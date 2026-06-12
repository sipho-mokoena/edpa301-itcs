#include "mqtt_client.h"
#include "globals.h"

#ifndef ITCS_DISABLE_NETWORK

#include <ArduinoJson.h>
#include <WiFi.h>
#include "secrets.h"

namespace
{
  template <size_t N>
  bool serializeJsonDocumentToBuffer(const StaticJsonDocument<N> &doc, char *output, size_t outputSize)
  {
    if (!output || outputSize == 0)
    {
      return false;
    }

    return serializeJson(doc, output, outputSize) > 0;
  }

  bool buildAvailabilityPayload(const char *status, char *payload, size_t payloadSize)
  {
    StaticJsonDocument<kAvailabilityPayloadSize> doc;
    doc["status"] = status;
    doc["ts"] = millis();
    return serializeJsonDocumentToBuffer(doc, payload, payloadSize);
  }
}

void mqttCallback(char *topic, byte *payload, unsigned int length)
{
  if (!topic || strcmp(topic, kCommandTopic) != 0)
  {
    return;
  }

  char buffer[256];
  const unsigned int copyLength = length < sizeof(buffer) - 1 ? length : sizeof(buffer) - 1;
  memcpy(buffer, payload, copyLength);
  buffer[copyLength] = '\0';

  if (xSemaphoreTake(gStateMutex, portMAX_DELAY) != pdTRUE)
  {
    return;
  }

  const char *command = nullptr;

  if (strcmp(buffer, "RESET_FAULT") == 0)
  {
    gControl.faultActive = false;
    if (gControl.crossingState == CrossingState::fault)
    {
      gControl.crossingState = CrossingState::idle;
    }
    command = "RESET_FAULT";
  }
  else if (strcmp(buffer, "AUTO") == 0)
  {
    gControl.remoteGateMode = RemoteGateMode::autoMode;
    gControl.remoteWarningOverride = -1;
    command = "AUTO";
  }
  else if (strcmp(buffer, "GATE_OPEN") == 0)
  {
    gControl.remoteGateMode = RemoteGateMode::forceOpen;
    command = "GATE_OPEN";
  }
  else if (strcmp(buffer, "GATE_CLOSE") == 0)
  {
    gControl.remoteGateMode = RemoteGateMode::forceClosed;
    command = "GATE_CLOSE";
  }
  else if (strcmp(buffer, "WARN_ON") == 0)
  {
    gControl.remoteWarningOverride = 1;
    command = "WARN_ON";
  }
  else if (strcmp(buffer, "WARN_OFF") == 0)
  {
    gControl.remoteWarningOverride = 0;
    command = "WARN_OFF";
  }

  xSemaphoreGive(gStateMutex);

  if (command != nullptr)
  {
    StaticJsonDocument<64> doc;
    doc["command"] = command;
    doc["status"] = "ok";
    char ackPayload[64];
    if (serializeJson(doc, ackPayload, sizeof(ackPayload)) > 0)
    {
      gMqttClient.publish(kAckTopic, ackPayload, true);
    }
  }
}

void ensureWiFiConnected()
{
  if (WiFi.status() == WL_CONNECTED)
  {
    return;
  }

  const uint32_t now = millis();
  if (now - gLastWiFiRetryMs < kWifiRetryIntervalMs)
  {
    return;
  }

  gLastWiFiRetryMs = now;
  WiFi.mode(WIFI_STA);
  WiFi.begin(ITCS_WIFI_SSID, ITCS_WIFI_PASSWORD);
}

void ensureMqttConnected()
{
  if (WiFi.status() != WL_CONNECTED || gMqttClient.connected())
  {
    return;
  }

  const uint32_t now = millis();
  if (now - gLastMqttRetryMs < kMqttRetryIntervalMs)
  {
    return;
  }

  gLastMqttRetryMs = now;
  const String clientId = String("itcs-cu-") + String(static_cast<uint32_t>(ESP.getEfuseMac()), HEX);

  char offlinePayload[kAvailabilityPayloadSize];
  if (!buildAvailabilityPayload("OFFLINE", offlinePayload, sizeof(offlinePayload)))
  {
    return;
  }

  const bool connected = gMqttClient.connect(
      clientId.c_str(),
      nullptr,
      nullptr,
      kAvailabilityTopic,
      1,
      true,
      offlinePayload);

  if (!connected)
  {
    return;
  }

  char onlinePayload[kAvailabilityPayloadSize];
  if (buildAvailabilityPayload("ONLINE", onlinePayload, sizeof(onlinePayload)))
  {
    gMqttClient.publish(kAvailabilityTopic, onlinePayload, true);
  }
  gMqttClient.subscribe(kCommandTopic, 1);

  gPublished = {-1, -1, -1, -1, -1, -1, -1, false, false, false, false};
}

bool publishTelemetry(const char *elementType, const char *elementId, const char *status)
{
  if (!gMqttClient.connected())
  {
    return false;
  }

  StaticJsonDocument<kTelemetryDocSize> doc;
  doc[elementType] = elementId;
  doc["status"] = status;
  doc["ts"] = millis();

  char payload[kTelemetryPayloadSize];
  if (!serializeJsonDocumentToBuffer(doc, payload, sizeof(payload)))
  {
    return false;
  }

  return gMqttClient.publish(kTelemetryTopic, payload, true);
}

bool publishState(const SensorSnapshot &sensors, const ActuatorState &actuators, const ControlState &control)
{
  if (!gMqttClient.connected())
  {
    return false;
  }

  StaticJsonDocument<kStateDocSize> doc;
  doc["state"] = crossingStateToText(control.crossingState);
  doc["fault"] = asBinary(control.faultActive);

  JsonObject sensorsObj = doc.createNestedObject("sensors");
  sensorsObj["irTrainApproach"] = sensors.irApproach;
  sensorsObj["irTrainInside"] = sensors.irInside;
  sensorsObj["irTrainLeaving"] = sensors.irLeaving;
  sensorsObj["ultrasonicSouth"] = sensors.usSouth;
  sensorsObj["ultrasonicIntersection"] = sensors.usIntersection;
  sensorsObj["ultrasonicNorth"] = sensors.usNorth;
  sensorsObj["ldrNight"] = sensors.ldrDark;

  JsonObject actuatorsObj = doc.createNestedObject("actuators");
  actuatorsObj["gateClosed"] = asBinary(actuators.gateClosed);
  actuatorsObj["warningsEnabled"] = asBinary(actuators.warningsEnabled);
  actuatorsObj["nightLightEnabled"] = asBinary(actuators.nightLightEnabled);
  doc["ts"] = millis();

  char payload[kStatePayloadSize];
  if (!serializeJsonDocumentToBuffer(doc, payload, sizeof(payload)))
  {
    return false;
  }

  return gMqttClient.publish(kStateTopic, payload, true);
}

#endif
