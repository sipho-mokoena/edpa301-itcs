#include <Arduino.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <WiFi.h>

#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include <freertos/task.h>

#include "ir_obstacle_driver.h"
#include "servo_driver.h"
#include "servo_feedback_driver.h"
#include "ultrasonic_driver.h"
#include "warnings_driver.h"

#ifndef ITCS_WIFI_SSID
#define ITCS_WIFI_SSID "ARMLab-ThinkStation"
#endif

#ifndef ITCS_WIFI_PASSWORD
#define ITCS_WIFI_PASSWORD "ArmDut2026"
#endif

#ifndef ITCS_MQTT_HOST
#define ITCS_MQTT_HOST "0.tcp.sa.ngrok.io"
#endif

#ifndef ITCS_MQTT_PORT
#define ITCS_MQTT_PORT 16261
#endif

namespace
{
  constexpr char kSiteId[] = "DUT-ECE-ITCS-01";
  constexpr char kDeviceId[] = "itcs-cu-01";
  constexpr char kTelemetryTopic[] = "itcs/cu/telemetry";
  constexpr char kCommandTopic[] = "itcs/cu/commands";
  constexpr char kStateTopic[] = "itcs/cu/state";
  constexpr char kAvailabilityTopic[] = "itcs/cu/availability";

  constexpr int kBuzzerPin = 23;
  constexpr int kRedLedPin = 22;
  constexpr int kServo1Pin = 32;
  constexpr int kServo2Pin = 33;
  constexpr int kUltrasonicTriggerPin = 14;
  constexpr int kUltrasonicEcho1Pin = 26;
  constexpr int kUltrasonicEcho2Pin = 25;
  constexpr int kUltrasonicEcho3Pin = 27;
  constexpr int kIrApproachPin = 9;
  constexpr int kIrInsidePin = 10;
  constexpr int kIrLeavingPin = 13;
  constexpr int kLdrDigitalPin = 17;
  constexpr int kNightLightPin = 16;
  constexpr int kLimitSwitch1Pin = 18;
  constexpr int kLimitSwitch2Pin = 19;

  constexpr float kObstacleDistanceCm = 12.0f;
  constexpr int kGateOpenAngle = 0;
  constexpr int kGateClosedAngle = 90;

  constexpr TickType_t kSensorTaskPeriod = pdMS_TO_TICKS(50);
  constexpr TickType_t kControlTaskPeriod = pdMS_TO_TICKS(20);
  constexpr TickType_t kActuatorTaskPeriod = pdMS_TO_TICKS(20);
  constexpr TickType_t kMqttTaskPeriod = pdMS_TO_TICKS(20);
  constexpr TickType_t kTelemetryTaskPeriod = pdMS_TO_TICKS(500);

  constexpr uint32_t kApproachTimeoutMs = 5000;
  constexpr uint32_t kLeaveClearMs = 2000;
  constexpr uint32_t kGateCloseTimeoutMs = 7000;
  constexpr uint8_t kIrDebounceSamples = 3;

  constexpr uint32_t kWifiRetryIntervalMs = 2000;
  constexpr uint32_t kMqttRetryIntervalMs = 2000;
  constexpr uint32_t kUltrasonicTriggerIntervalMs = 100;
  constexpr uint32_t kEchoWaitIntervalMs = 50;
  constexpr uint32_t kWifiClientTimeoutMs = 2000;
  constexpr size_t kAvailabilityPayloadSize = 192;
  constexpr size_t kTelemetryDocSize = 256;
  constexpr size_t kTelemetryPayloadSize = 320;
  constexpr size_t kStateDocSize = 640;
  constexpr size_t kStatePayloadSize = 768;

  enum class CrossingState : uint8_t
  {
    idle,
    trainApproaching,
    trainInside,
    trainLeaving,
    fault,
  };

  enum class RemoteGateMode : uint8_t
  {
    autoMode,
    forceOpen,
    forceClosed,
  };

  struct SensorSnapshot
  {
    int irApproach;
    int irInside;
    int irLeaving;
    int limitSwitch1;
    int limitSwitch2;
    int ldrDark;
    int usSouth;
    int usIntersection;
    int usNorth;
    uint32_t sampledAtMs;
  };

  struct ActuatorState
  {
    bool warningsEnabled;
    bool nightLightEnabled;
    bool gateClosed;
    int servo1Angle;
    int servo2Angle;
    uint32_t gateCommandedAtMs;
  };

  struct ControlState
  {
    CrossingState crossingState;
    RemoteGateMode remoteGateMode;
    int remoteWarningOverride;
    bool faultActive;
    bool trainDetected;
    uint32_t enteredApproachAtMs;
    uint32_t enteredLeavingAtMs;
  };

  struct PublishedCache
  {
    int irApproach;
    int irInside;
    int irLeaving;
    int ldrDark;
    int usSouth;
    int usIntersection;
    int usNorth;
    int limitSwitch1;
    int limitSwitch2;
    bool warningsEnabled;
    bool nightLightEnabled;
    bool gateClosed;
    bool faultActive;
  };

  SemaphoreHandle_t gStateMutex = nullptr;

  SensorSnapshot gSensors = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
  ActuatorState gActuators = {false, false, false, kGateOpenAngle, kGateOpenAngle, 0};
  ControlState gControl = {
      CrossingState::idle,
      RemoteGateMode::autoMode,
      -1,
      false,
      false,
      0,
      0,
  };
  PublishedCache gPublished = {
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      false,
      false,
      false,
      false,
  };

  WiFiClient gWiFiClient;
  PubSubClient gMqttClient(gWiFiClient);

  uint32_t gLastUltrasonicTriggerMs = 0;
  bool gUltrasonicWaitingForEcho = false;
  uint32_t gLastWiFiRetryMs = 0;
  uint32_t gLastMqttRetryMs = 0;

  int gIrRawLast[3] = {0, 0, 0};
  uint8_t gIrStableCount[3] = {0, 0, 0};
  int gIrDebounced[3] = {0, 0, 0};

  int asBinary(bool value)
  {
    return value ? 1 : 0;
  }

  bool buildAvailabilityPayload(const char *status, char *payload, size_t payloadSize);

  bool containsIgnoreCase(const char *value, const char *needle)
  {
    if (!value || !needle)
    {
      return false;
    }

    String haystack(value);
    haystack.toUpperCase();
    String token(needle);
    token.toUpperCase();
    return haystack.indexOf(token) >= 0;
  }

  int debounceIrReading(int channelIndex, int rawValue)
  {
    if (channelIndex < 0 || channelIndex >= 3)
    {
      return rawValue;
    }

    if (rawValue == gIrRawLast[channelIndex])
    {
      if (gIrStableCount[channelIndex] < kIrDebounceSamples)
      {
        gIrStableCount[channelIndex]++;
      }
    }
    else
    {
      gIrRawLast[channelIndex] = rawValue;
      gIrStableCount[channelIndex] = 1;
    }

    if (gIrStableCount[channelIndex] >= kIrDebounceSamples)
    {
      gIrDebounced[channelIndex] = rawValue;
    }

    return gIrDebounced[channelIndex];
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

    if (containsIgnoreCase(buffer, "RESET_FAULT"))
    {
      gControl.faultActive = false;
      if (gControl.crossingState == CrossingState::fault)
      {
        gControl.crossingState = CrossingState::idle;
      }
    }

    if (containsIgnoreCase(buffer, "AUTO"))
    {
      gControl.remoteGateMode = RemoteGateMode::autoMode;
      gControl.remoteWarningOverride = -1;
    }
    else if (containsIgnoreCase(buffer, "GATE_OPEN"))
    {
      gControl.remoteGateMode = RemoteGateMode::forceOpen;
    }
    else if (containsIgnoreCase(buffer, "GATE_CLOSE"))
    {
      gControl.remoteGateMode = RemoteGateMode::forceClosed;
    }

    if (containsIgnoreCase(buffer, "WARN_ON"))
    {
      gControl.remoteWarningOverride = 1;
    }
    else if (containsIgnoreCase(buffer, "WARN_OFF"))
    {
      gControl.remoteWarningOverride = 0;
    }

    xSemaphoreGive(gStateMutex);
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

    gPublished = {-1, -1, -1, -1, -1, -1, -1, -1, -1, false, false, false, false};
  }

  const char *crossingStateToText(CrossingState state)
  {
    switch (state)
    {
    case CrossingState::idle:
      return "IDLE";
    case CrossingState::trainApproaching:
      return "TRAIN_APPROACHING";
    case CrossingState::trainInside:
      return "TRAIN_INSIDE";
    case CrossingState::trainLeaving:
      return "TRAIN_LEAVING";
    case CrossingState::fault:
      return "FAULT";
    }

    return "UNKNOWN";
  }

  const char *activeStateText(int value)
  {
    return value == 1 ? "ACTIVE" : "IDLE";
  }

  const char *gateStateText(bool isClosed)
  {
    return isClosed ? "CLOSED" : "OPEN";
  }

  const char *warningStateText(bool isEnabled)
  {
    return isEnabled ? "ACTIVE" : "IDLE";
  }

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
    doc["siteId"] = kSiteId;
    doc["deviceId"] = kDeviceId;
    doc["status"] = status;
    doc["ts"] = millis();
    return serializeJsonDocumentToBuffer(doc, payload, payloadSize);
  }

  bool publishTelemetry(const char *elementType, const char *elementId, const char *status)
  {
    if (!gMqttClient.connected())
    {
      return false;
    }

    StaticJsonDocument<kTelemetryDocSize> doc;
    doc["siteId"] = kSiteId;
    doc["deviceId"] = kDeviceId;
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
    doc["siteId"] = kSiteId;
    doc["deviceId"] = kDeviceId;
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
    sensorsObj["limitLeftClosed"] = sensors.limitSwitch1;
    sensorsObj["limitRightClosed"] = sensors.limitSwitch2;

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

  void sensorTask(void * /*unused*/)
  {
    TickType_t lastWake = xTaskGetTickCount();

    for (;;)
    {
      updateIrObstacleDriver();
      updateServoFeedbackDriver();

      const uint32_t now = millis();
      if (!gUltrasonicWaitingForEcho && (now - gLastUltrasonicTriggerMs >= kUltrasonicTriggerIntervalMs))
      {
        updateUltrasonicDriver();
        gUltrasonicWaitingForEcho = true;
        gLastUltrasonicTriggerMs = now;
      }
      else if (gUltrasonicWaitingForEcho && (now - gLastUltrasonicTriggerMs >= kEchoWaitIntervalMs))
      {
        finalizeUltrasonicDriverMeasurement();
        gUltrasonicWaitingForEcho = false;
      }

      SensorSnapshot localSnapshot;
      const int rawIrInside = getIrObstacleDriverState(0);
      const int rawIrApproach = getIrObstacleDriverState(1);
      const int rawIrLeaving = getIrObstacleDriverState(2);

      localSnapshot.irApproach = debounceIrReading(0, rawIrApproach);
      localSnapshot.irInside = debounceIrReading(1, rawIrInside);
      localSnapshot.irLeaving = debounceIrReading(2, rawIrLeaving);
      localSnapshot.limitSwitch1 = getServoFeedbackDriverState(0);
      localSnapshot.limitSwitch2 = getServoFeedbackDriverState(1);
      localSnapshot.ldrDark = digitalRead(kLdrDigitalPin) == HIGH ? 1 : 0;
      localSnapshot.usSouth = isUltrasonicDriverObstacleDetected(0, kObstacleDistanceCm) ? 1 : 0;
      localSnapshot.usIntersection = isUltrasonicDriverObstacleDetected(1, kObstacleDistanceCm) ? 1 : 0;
      localSnapshot.usNorth = isUltrasonicDriverObstacleDetected(2, kObstacleDistanceCm) ? 1 : 0;
      localSnapshot.sampledAtMs = now;

      if (xSemaphoreTake(gStateMutex, portMAX_DELAY) == pdTRUE)
      {
        gSensors = localSnapshot;
        xSemaphoreGive(gStateMutex);
      }

      vTaskDelayUntil(&lastWake, kSensorTaskPeriod);
    }
  }

  void controlTask(void * /*unused*/)
  {
    TickType_t lastWake = xTaskGetTickCount();

    for (;;)
    {
      if (xSemaphoreTake(gStateMutex, portMAX_DELAY) == pdTRUE)
      {
        const uint32_t now = millis();

        const bool approach = gSensors.irApproach == 1;
        const bool inside = gSensors.irInside == 1;
        const bool leaving = gSensors.irLeaving == 1;
        const bool gateClosedBySwitch = gSensors.limitSwitch1 == 1 && gSensors.limitSwitch2 == 1;

        if (gControl.faultActive)
        {
          gControl.crossingState = CrossingState::fault;
        }
        else
        {
          switch (gControl.crossingState)
          {
          case CrossingState::idle:
            if (approach)
            {
              gControl.crossingState = CrossingState::trainApproaching;
              gControl.enteredApproachAtMs = now;
            }
            else if (inside)
            {
              gControl.crossingState = CrossingState::trainInside;
            }
            break;

          case CrossingState::trainApproaching:
            if (inside)
            {
              gControl.crossingState = CrossingState::trainInside;
            }
            else if (!approach && (now - gControl.enteredApproachAtMs > kApproachTimeoutMs))
            {
              gControl.crossingState = CrossingState::idle;
            }
            break;

          case CrossingState::trainInside:
            if (leaving && !inside && !approach)
            {
              gControl.crossingState = CrossingState::trainLeaving;
              gControl.enteredLeavingAtMs = now;
            }
            break;

          case CrossingState::trainLeaving:
            if (!approach && !inside && !leaving && (now - gControl.enteredLeavingAtMs > kLeaveClearMs))
            {
              gControl.crossingState = CrossingState::idle;
            }
            break;

          case CrossingState::fault:
            break;
          }
        }

        const bool trainActive =
            gControl.crossingState == CrossingState::trainApproaching ||
            gControl.crossingState == CrossingState::trainInside ||
            gControl.crossingState == CrossingState::trainLeaving;

        bool targetGateClosed = trainActive || gControl.faultActive;
        bool targetWarningsOn = trainActive || gControl.faultActive;

        if (!trainActive && !gControl.faultActive)
        {
          if (gControl.remoteGateMode == RemoteGateMode::forceClosed)
          {
            targetGateClosed = true;
          }
          else if (gControl.remoteGateMode == RemoteGateMode::forceOpen)
          {
            targetGateClosed = false;
          }

          if (gControl.remoteWarningOverride == 1)
          {
            targetWarningsOn = true;
          }
          else if (gControl.remoteWarningOverride == 0)
          {
            targetWarningsOn = false;
          }
        }

        const bool changedGateCommand = (gActuators.gateClosed != targetGateClosed);
        gActuators.gateClosed = targetGateClosed;
        gActuators.warningsEnabled = targetWarningsOn;
        gActuators.nightLightEnabled = gSensors.ldrDark == 1;
        gControl.trainDetected = trainActive;

        if (changedGateCommand)
        {
          gActuators.gateCommandedAtMs = now;
        }

        if (gActuators.gateClosed && !gateClosedBySwitch &&
            (now - gActuators.gateCommandedAtMs > kGateCloseTimeoutMs))
        {
          gControl.faultActive = true;
          gControl.crossingState = CrossingState::fault;
        }

        xSemaphoreGive(gStateMutex);
      }

      vTaskDelayUntil(&lastWake, kControlTaskPeriod);
    }
  }

  void actuatorTask(void * /*unused*/)
  {
    TickType_t lastWake = xTaskGetTickCount();

    for (;;)
    {
      ActuatorState actuators;
      if (xSemaphoreTake(gStateMutex, portMAX_DELAY) == pdTRUE)
      {
        actuators = gActuators;
        xSemaphoreGive(gStateMutex);
      }

      if (actuators.gateClosed)
      {
        actuators.servo1Angle = kGateClosedAngle;
        actuators.servo2Angle = kGateClosedAngle;
      }
      else
      {
        actuators.servo1Angle = kGateOpenAngle;
        actuators.servo2Angle = kGateOpenAngle;
      }

      writeServoDriverAngles(actuators.servo1Angle, actuators.servo2Angle);
      setWarningsDriverEnabled(actuators.warningsEnabled);
      digitalWrite(kNightLightPin, actuators.nightLightEnabled ? HIGH : LOW);

      if (xSemaphoreTake(gStateMutex, portMAX_DELAY) == pdTRUE)
      {
        gActuators.servo1Angle = actuators.servo1Angle;
        gActuators.servo2Angle = actuators.servo2Angle;
        xSemaphoreGive(gStateMutex);
      }

      vTaskDelayUntil(&lastWake, kActuatorTaskPeriod);
    }
  }

  void mqttTask(void * /*unused*/)
  {
    TickType_t lastWake = xTaskGetTickCount();

    for (;;)
    {
      ensureWiFiConnected();
      ensureMqttConnected();
      gMqttClient.loop();

      vTaskDelayUntil(&lastWake, kMqttTaskPeriod);
    }
  }

  void telemetryTask(void * /*unused*/)
  {
    TickType_t lastWake = xTaskGetTickCount();

    for (;;)
    {
      SensorSnapshot sensors;
      ActuatorState actuators;
      ControlState control;

      if (xSemaphoreTake(gStateMutex, portMAX_DELAY) == pdTRUE)
      {
        sensors = gSensors;
        actuators = gActuators;
        control = gControl;
        xSemaphoreGive(gStateMutex);
      }

      if (gMqttClient.connected())
      {
        if (gPublished.irApproach != sensors.irApproach)
        {
          publishTelemetry("sensorId", "ir.train.approach", activeStateText(sensors.irApproach));
          gPublished.irApproach = sensors.irApproach;
        }
        if (gPublished.irInside != sensors.irInside)
        {
          publishTelemetry("sensorId", "ir.train.inside", activeStateText(sensors.irInside));
          gPublished.irInside = sensors.irInside;
        }
        if (gPublished.irLeaving != sensors.irLeaving)
        {
          publishTelemetry("sensorId", "ir.train.leaving", activeStateText(sensors.irLeaving));
          gPublished.irLeaving = sensors.irLeaving;
        }
        if (gPublished.ldrDark != sensors.ldrDark)
        {
          publishTelemetry("sensorId", "ldr.camera.night", activeStateText(sensors.ldrDark));
          gPublished.ldrDark = sensors.ldrDark;
        }
        if (gPublished.usSouth != sensors.usSouth)
        {
          publishTelemetry("sensorId", "ultrasonic.south.vehicle", activeStateText(sensors.usSouth));
          gPublished.usSouth = sensors.usSouth;
        }
        if (gPublished.usIntersection != sensors.usIntersection)
        {
          publishTelemetry("sensorId", "ultrasonic.intersection.vehicle", activeStateText(sensors.usIntersection));
          gPublished.usIntersection = sensors.usIntersection;
        }
        if (gPublished.usNorth != sensors.usNorth)
        {
          publishTelemetry("sensorId", "ultrasonic.north.vehicle", activeStateText(sensors.usNorth));
          gPublished.usNorth = sensors.usNorth;
        }
        if (gPublished.limitSwitch1 != sensors.limitSwitch1)
        {
          publishTelemetry("sensorId", "limit.left.closed", activeStateText(sensors.limitSwitch1));
          gPublished.limitSwitch1 = sensors.limitSwitch1;
        }
        if (gPublished.limitSwitch2 != sensors.limitSwitch2)
        {
          publishTelemetry("sensorId", "limit.right.closed", activeStateText(sensors.limitSwitch2));
          gPublished.limitSwitch2 = sensors.limitSwitch2;
        }
        if (gPublished.warningsEnabled != actuators.warningsEnabled)
        {
          publishTelemetry("actuatorId", "warning.redLed", warningStateText(actuators.warningsEnabled));
          publishTelemetry("actuatorId", "warning.buzzer", warningStateText(actuators.warningsEnabled));
          gPublished.warningsEnabled = actuators.warningsEnabled;
        }
        if (gPublished.nightLightEnabled != actuators.nightLightEnabled)
        {
          publishTelemetry("actuatorId", "light.camera.night", actuators.nightLightEnabled ? "ACTIVE" : "IDLE");
          gPublished.nightLightEnabled = actuators.nightLightEnabled;
        }
        if (gPublished.gateClosed != actuators.gateClosed)
        {
          publishTelemetry("actuatorId", "gate.servo.left", gateStateText(actuators.gateClosed));
          publishTelemetry("actuatorId", "gate.servo.right", gateStateText(actuators.gateClosed));
          gPublished.gateClosed = actuators.gateClosed;
        }
        if (gPublished.faultActive != control.faultActive)
        {
          publishTelemetry("actuatorId", "controller.fault", control.faultActive ? "FAULT" : "ACTIVE");
          gPublished.faultActive = control.faultActive;
        }

        publishState(sensors, actuators, control);
      }

      Serial.printf(
          "state=%s ir=[%d,%d,%d] us=[%d,%d,%d] ldr=%d lim=[%d,%d] gate=%d warn=%d night=%d fault=%d wifi=%d mqtt=%d\n",
          crossingStateToText(control.crossingState),
          sensors.irApproach,
          sensors.irInside,
          sensors.irLeaving,
          sensors.usSouth,
          sensors.usIntersection,
          sensors.usNorth,
          sensors.ldrDark,
          sensors.limitSwitch1,
          sensors.limitSwitch2,
          asBinary(actuators.gateClosed),
          asBinary(actuators.warningsEnabled),
          asBinary(actuators.nightLightEnabled),
          asBinary(control.faultActive),
          WiFi.status() == WL_CONNECTED ? 1 : 0,
          gMqttClient.connected() ? 1 : 0);

      vTaskDelayUntil(&lastWake, kTelemetryTaskPeriod);
    }
  }
} // namespace

void setup()
{
  Serial.begin(115200);

  setupWarningsDriver(kBuzzerPin, kRedLedPin);
  setupServoDriver(kServo1Pin, kServo2Pin);
  setupUltrasonicDriver(kUltrasonicTriggerPin, kUltrasonicEcho1Pin, kUltrasonicEcho2Pin, kUltrasonicEcho3Pin);
  setupIrObstacleDriver(kIrInsidePin, kIrApproachPin, kIrLeavingPin);
  setupServoFeedbackDriver(kLimitSwitch1Pin, kLimitSwitch2Pin);

  pinMode(kLdrDigitalPin, INPUT);
  pinMode(kNightLightPin, OUTPUT);
  digitalWrite(kNightLightPin, LOW);

  gStateMutex = xSemaphoreCreateMutex();

  gMqttClient.setServer(ITCS_MQTT_HOST, ITCS_MQTT_PORT);
  gMqttClient.setCallback(mqttCallback);
  gMqttClient.setBufferSize(kStatePayloadSize);
  gMqttClient.setKeepAlive(5);
  gWiFiClient.setTimeout(kWifiClientTimeoutMs);

  xTaskCreatePinnedToCore(sensorTask, "sensorTask", 4096, nullptr, 3, nullptr, 1);
  xTaskCreatePinnedToCore(controlTask, "controlTask", 4096, nullptr, 4, nullptr, 1);
  xTaskCreatePinnedToCore(actuatorTask, "actuatorTask", 4096, nullptr, 3, nullptr, 1);
  xTaskCreatePinnedToCore(mqttTask, "mqttTask", 6144, nullptr, 2, nullptr, 0);
  xTaskCreatePinnedToCore(telemetryTask, "telemetryTask", 6144, nullptr, 2, nullptr, 0);
}

void loop()
{
  vTaskDelay(portMAX_DELAY);
}
