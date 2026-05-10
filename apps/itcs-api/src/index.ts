import { cors } from "@elysiajs/cors";
import { node } from "@elysiajs/node";
import { Elysia } from "elysia";
import mqtt from "mqtt";
import { initLogger, log } from "utils";

initLogger({ name: "api" });

const mqttBrokerUrl = process.env.MQTT_BROKER_URL ?? "mqtt://127.0.0.1:1883";
const mqttClientId = process.env.MQTT_API_CLIENT_ID ?? "itcs-api";
const mqttTopicTelemetry = process.env.MQTT_TOPIC_TELEMETRY ?? "itcs/cu/telemetry";
const mqttTopicCommands = process.env.MQTT_TOPIC_COMMANDS ?? "itcs/cu/commands";
const mqttEnabled = process.env.MQTT_ENABLED !== "false";
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3001";

let mqttConnectionWarned = false;

const mqttClient = mqttEnabled
  ? mqtt.connect(mqttBrokerUrl, {
      clientId: mqttClientId,
      reconnectPeriod: 3000,
      connectTimeout: 5000,
    })
  : null;

if (!mqttEnabled) {
  log.warn("MQTT is disabled (set MQTT_ENABLED=true to enable)");
}

mqttClient?.on("connect", () => {
  mqttConnectionWarned = false;
  log.info(`Connected to MQTT broker at ${mqttBrokerUrl}`);

  mqttClient.subscribe(mqttTopicTelemetry, (error) => {
    if (error) {
      log.error(`Failed to subscribe to ${mqttTopicTelemetry}`, error);
      return;
    }

    log.info(`Subscribed to ${mqttTopicTelemetry}`);
  });
});

mqttClient?.on("reconnect", () => {
  log.warn("Reconnecting to MQTT broker");
});

mqttClient?.on("error", (error) => {
  if (!mqttConnectionWarned) {
    mqttConnectionWarned = true;
    log.warn(`MQTT unavailable at ${mqttBrokerUrl}. API will continue without broker.`);
    log.warn("Start broker with `vp run itcs-mqtt#dev` or set MQTT_BROKER_URL.");
  }

  log.debug("MQTT client error", error);
});

mqttClient?.on("message", (topic, payload) => {
  const message = payload.toString();
  log.info(`MQTT rx [${topic}] ${message}`);
});

const app = new Elysia({ adapter: node() })
  .use(
    cors({
      origin: corsOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  )
  .get("/", "Hello Elysia")
  .get("/health", () => ({
    status: "ok",
    serviceStatuses: {
      api: "online",
      mqtt: mqttClient?.connected ? "connected" : "disconnected",
    },
  }))
  .get("/user/:id", ({ params: { id } }) => id)
  .post("/mqtt/command", ({ body }) => {
    if (!mqttClient || !mqttClient.connected) {
      return {
        ok: false,
        topic: mqttTopicCommands,
        error: "MQTT broker not connected",
      };
    }

    const command =
      typeof body === "object" && body !== null && "command" in body
        ? String((body as { command: unknown }).command)
        : "NO_COMMAND";

    const payload = JSON.stringify({
      source: "itcs-api",
      command,
      issuedAt: new Date().toISOString(),
    });

    mqttClient.publish(mqttTopicCommands, payload);

    return {
      ok: true,
      topic: mqttTopicCommands,
      payload,
    };
  })
  .post("/form", ({ body }) => body)
  .listen(3000);

log.info(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
