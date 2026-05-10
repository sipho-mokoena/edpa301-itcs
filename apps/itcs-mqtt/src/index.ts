import { createServer } from "node:net";
import { createServer as createHttpServer } from "node:http";
import { Aedes } from "aedes";
import { WebSocketServer, createWebSocketStream } from "ws";
import { initLogger, log } from "utils";

initLogger({ name: "mqtt" });

const port = Number(process.env.MQTT_PORT ?? 1883);
const host = process.env.MQTT_HOST ?? "0.0.0.0";
const wsPort = Number(process.env.MQTT_WS_PORT ?? 8888);

const broker = await Aedes.createBroker();
const server = createServer(broker.handle);
const httpServer = createHttpServer();
const wsServer = new WebSocketServer({ server: httpServer });

wsServer.on("connection", (socket, request) => {
  const stream = createWebSocketStream(socket);
  broker.handle(stream, request);
});

broker.on("client", (client) => {
  log.info(`client connected: ${client?.id ?? "unknown"}`);
});

broker.on("clientDisconnect", (client) => {
  log.info(`client disconnected: ${client?.id ?? "unknown"}`);
});

broker.on("publish", (packet, client) => {
  if (!client) {
    return;
  }

  log.info(`publish ${client.id} -> ${packet.topic}`);
});

server.listen(port, host, () => {
  log.info(`MQTT broker listening on ${host}:${port}`);
});

httpServer.listen(wsPort, host, () => {
  log.info(`MQTT over WebSocket listening on ws://${host}:${wsPort}`);
});

const shutdown = () => {
  log.info("Shutting down MQTT broker");

  server.close((serverError) => {
    wsServer.close();
    httpServer.close();

    if (serverError) {
      log.error("Failed to close MQTT server", serverError);
    }

    broker.close(() => {
      log.info("MQTT broker closed");
      process.exit(serverError ? 1 : 0);
    });
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
