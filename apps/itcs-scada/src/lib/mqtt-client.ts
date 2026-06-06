import mqtt, { type MqttClient } from "mqtt";

import { useScadaDataStore, type StatusTone } from "~/stores/scada-data";

const envBrokerUrl = import.meta.env.VITE_MQTT_BROKER_URL ?? "ws://localhost:8888";
const envClientId =
  import.meta.env.VITE_MQTT_CLIENT_ID ?? `itcs-scada-${Math.random().toString(16).slice(2, 10)}`;
const envTelemetryTopic = import.meta.env.VITE_MQTT_TOPIC_TELEMETRY ?? "itcs/cu/telemetry";
const envCommandTopic = import.meta.env.VITE_MQTT_TOPIC_COMMANDS ?? "itcs/cu/commands";
const envStateTopic = import.meta.env.VITE_MQTT_TOPIC_STATE ?? "itcs/cu/state";

let client: MqttClient | null = null;
let activeConfig: {
  brokerUrl: string;
  clientId: string;
  telemetryTopic: string;
  commandTopic: string;
  stateTopic: string;
} | null = null;

function toTone(value: string): StatusTone {
  const normalized = value.toLowerCase();

  if (normalized.includes("error") || normalized.includes("fail") || normalized.includes("down")) {
    return "danger";
  }

  if (
    normalized.includes("warn") ||
    normalized.includes("pending") ||
    normalized.includes("unknown")
  ) {
    return "warn";
  }

  if (normalized.includes("ok") || normalized.includes("up") || normalized.includes("active")) {
    return "ok";
  }

  return "neutral";
}

function safeJsonParse(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function handleTelemetry(rawPayload: string) {
  const payload = safeJsonParse(rawPayload);
  const setCloudStatus = useScadaDataStore.getState().setCloudStatus;

  if (!payload) {
    setCloudStatus({
      syncStatus: `Invalid telemetry payload at ${new Date().toLocaleTimeString()}`,
      apiConnection: "DEGRADED",
      apiConnectionTone: "warn",
    });
    return;
  }

  const deviceId = typeof payload.deviceId === "string" ? payload.deviceId : "edge-unit-01";
  const sensorId = typeof payload.sensorId === "string" ? payload.sensorId : null;
  const actuatorId = typeof payload.actuatorId === "string" ? payload.actuatorId : null;
  const status = typeof payload.status === "string" ? payload.status : "ACTIVE";
  const tone = toTone(status);

  setCloudStatus({
    apiConnection: "SECURE",
    apiConnectionTone: "ok",
    syncStatus: `Telemetry ${new Date().toLocaleTimeString()}`,
  });

  if (sensorId) {
    useScadaDataStore.getState().setSensorStatus(sensorId, {
      status,
      tone,
      processingUnitId: deviceId,
    });
  }

  if (actuatorId) {
    useScadaDataStore.getState().setActuatorStatus(actuatorId, {
      status,
      tone,
      processingUnitId: deviceId,
    });
  }
}

function handleCommand(rawPayload: string) {
  const payload = safeJsonParse(rawPayload);

  if (!payload) {
    return;
  }

  const command = typeof payload.command === "string" ? payload.command : "UNKNOWN";

  useScadaDataStore.getState().setCloudStatus({
    activeCommands: 1,
    remoteOverride: command,
    syncStatus: `Command ${command} at ${new Date().toLocaleTimeString()}`,
  });
}

function handleState(rawPayload: string) {
  const payload = safeJsonParse(rawPayload);

  if (!payload) {
    return;
  }

  const state = typeof payload.state === "string" ? payload.state : "UNKNOWN";
  const fault = payload.fault === 1 || payload.fault === true;

  useScadaDataStore.getState().setCloudStatus({
    syncStatus: `State ${state}${fault ? " (FAULT)" : ""} ${new Date().toLocaleTimeString()}`,
  });
}

export function startMqttClient() {
  if (typeof window === "undefined" || client) {
    return;
  }

  const state = useScadaDataStore.getState();
  const storeConfig = state.mqtt;
  const brokerUrl = storeConfig.brokerUrl || envBrokerUrl;
  const clientId = storeConfig.clientId || envClientId;
  const telemetryTopic = storeConfig.telemetryTopic || envTelemetryTopic;
  const commandTopic = storeConfig.commandTopic || envCommandTopic;
  const stateTopic = storeConfig.stateTopic || envStateTopic;

  activeConfig = {
    brokerUrl,
    clientId,
    telemetryTopic,
    commandTopic,
    stateTopic,
  };

  client = mqtt.connect(brokerUrl, { clientId });

  const setCloudStatus = useScadaDataStore.getState().setCloudStatus;

  client.on("connect", () => {
    setCloudStatus({
      apiConnection: "SECURE",
      apiConnectionTone: "ok",
      syncStatus: "MQTT connected",
    });

    client?.subscribe([telemetryTopic, commandTopic, stateTopic]);
  });

  client.on("reconnect", () => {
    setCloudStatus({
      apiConnection: "RECONNECTING",
      apiConnectionTone: "warn",
      syncStatus: "MQTT reconnecting",
    });
  });

  client.on("error", () => {
    setCloudStatus({
      apiConnection: "OFFLINE",
      apiConnectionTone: "danger",
      syncStatus: "MQTT error",
    });
  });

  client.on("message", (topic, payload) => {
    const rawPayload = payload.toString();
    useScadaDataStore.getState().pushMqttFeedMessage({
      topic,
      payload: rawPayload,
    });

    if (topic === telemetryTopic) {
      handleTelemetry(rawPayload);
      return;
    }

    if (topic === commandTopic) {
      handleCommand(rawPayload);
      return;
    }

    if (topic === stateTopic) {
      handleState(rawPayload);
    }
  });
}

export function stopMqttClient() {
  if (!client) {
    return;
  }

  client.end(true);
  client = null;
  activeConfig = null;

  useScadaDataStore.getState().setCloudStatus({
    apiConnection: "OFFLINE",
    apiConnectionTone: "neutral",
    syncStatus: "MQTT disconnected",
    activeCommands: 0,
  });
}

export function restartMqttClient() {
  stopMqttClient();
  startMqttClient();
}

export function getMqttRuntimeConfig() {
  if (activeConfig) {
    return activeConfig;
  }

  const storeConfig = useScadaDataStore.getState().mqtt;
  return {
    brokerUrl: storeConfig.brokerUrl || envBrokerUrl,
    clientId: storeConfig.clientId || envClientId,
    telemetryTopic: storeConfig.telemetryTopic || envTelemetryTopic,
    commandTopic: storeConfig.commandTopic || envCommandTopic,
    stateTopic: storeConfig.stateTopic || envStateTopic,
  };
}

export function publishCommand(command: string) {
  if (!client || !client.connected) {
    return false;
  }

  const payload = JSON.stringify({
    source: "itcs-scada",
    command,
    issuedAt: new Date().toISOString(),
  });

  client.publish(commandTopic, payload);
  return true;
}
