/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MQTT_BROKER_URL?: string;
  readonly VITE_MQTT_CLIENT_ID?: string;
  readonly VITE_MQTT_TOPIC_TELEMETRY?: string;
  readonly VITE_MQTT_TOPIC_COMMANDS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
