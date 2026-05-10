#include <Arduino.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <WiFi.h>

static constexpr char WIFI_SSID[] = "Wokwi-GUEST";
static constexpr char WIFI_PASSWORD[] = "";
static constexpr uint8_t WIFI_CHANNEL = 6;
static constexpr char MQTT_HOST[] = "0.tcp.sa.ngrok.io";
static constexpr uint16_t MQTT_PORT = 16261;
static constexpr char MQTT_CLIENT_ID[] = "esp-itcs-cu";
static constexpr char MQTT_TOPIC_TELEMETRY[] = "itcs/cu/telemetry";
static constexpr char MQTT_TOPIC_COMMANDS[] = "itcs/cu/commands";

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastTelemetryAt = 0;

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<256> messageJson;
  const DeserializationError error = deserializeJson(messageJson, payload, length);

  Serial.print("MQTT rx [");
  Serial.print(topic);
  Serial.print("]: ");

  if (error) {
    Serial.println("invalid JSON payload");
    return;
  }

  serializeJson(messageJson, Serial);
  Serial.println();

  const char* command = messageJson["command"] | nullptr;
  if (command != nullptr) {
    Serial.print("Command received: ");
    Serial.println(command);
  }
}

void connectWifi() {
  Serial.println("Connecting to WiFi");

  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD, WIFI_CHANNEL);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("WiFi connected: ");
  Serial.println(WiFi.localIP());
}

void connectMqtt() {
  while (!mqttClient.connected()) {
    if (mqttClient.connect(MQTT_CLIENT_ID)) {
      mqttClient.subscribe(MQTT_TOPIC_COMMANDS);
      Serial.println("MQTT connected");
      continue;
    }

    Serial.print("MQTT connect failed, rc=");
    Serial.println(mqttClient.state());
    delay(2000);
  }
}

void publishTelemetry() {
  const unsigned long now = millis();
  if (now - lastTelemetryAt < 5000) {
    return;
  }

  lastTelemetryAt = now;

  StaticJsonDocument<256> telemetryJson;
  telemetryJson["deviceId"] = MQTT_CLIENT_ID;
  telemetryJson["uptimeMs"] = now;
  telemetryJson["sensorId"] = "inductive-sensor-1";
  telemetryJson["status"] = ((now / 5000) % 2 == 0) ? "ACTIVE" : "IDLE";

  char payload[256];
  const size_t payloadLength = serializeJson(telemetryJson, payload, sizeof(payload));
  mqttClient.publish(MQTT_TOPIC_TELEMETRY, payload, payloadLength);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  connectWifi();

  mqttClient.setServer(MQTT_HOST, MQTT_PORT);
  mqttClient.setCallback(onMqttMessage);

  connectMqtt();
}

void loop() {
  connectWifi();

  if (!mqttClient.connected()) {
    connectMqtt();
  }

  mqttClient.loop();
  publishTelemetry();
}
