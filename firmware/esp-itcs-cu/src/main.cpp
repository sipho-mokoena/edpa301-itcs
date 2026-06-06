#include <Arduino.h>
#include <WiFi.h>

#include "config.h"
#include "globals.h"
#include "mqtt_client.h"

#include "ir_obstacle_driver.h"
#include "servo_driver.h"
#include "servo_feedback_driver.h"
#include "ultrasonic_driver.h"
#include "warnings_driver.h"

#include "secrets.h"

void sensorTask(void *);
void controlTask(void *);
void actuatorTask(void *);
void mqttTask(void *);
void telemetryTask(void *);

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
  if (gStateMutex == nullptr)
  {
    Serial.println("FATAL: failed to create state mutex");
    abort();
  }

  gMqttClient.setServer(ITCS_MQTT_HOST, ITCS_MQTT_PORT);
  gMqttClient.setCallback(mqttCallback);
  gMqttClient.setBufferSize(kStatePayloadSize);
  gMqttClient.setKeepAlive(5);
  gWiFiClient.setTimeout(kWifiClientTimeoutMs);

  if (xTaskCreatePinnedToCore(sensorTask, "sensorTask", 4096, nullptr, 3, &gSensorTaskHandle, 1) != pdPASS)
  {
    Serial.println("FATAL: sensorTask creation failed");
    abort();
  }
  if (xTaskCreatePinnedToCore(controlTask, "controlTask", 4096, nullptr, 4, &gControlTaskHandle, 1) != pdPASS)
  {
    Serial.println("FATAL: controlTask creation failed");
    abort();
  }
  if (xTaskCreatePinnedToCore(actuatorTask, "actuatorTask", 4096, nullptr, 3, &gActuatorTaskHandle, 1) != pdPASS)
  {
    Serial.println("FATAL: actuatorTask creation failed");
    abort();
  }
  if (xTaskCreatePinnedToCore(mqttTask, "mqttTask", 6144, nullptr, 2, &gMqttTaskHandle, 0) != pdPASS)
  {
    Serial.println("FATAL: mqttTask creation failed");
    abort();
  }
  if (xTaskCreatePinnedToCore(telemetryTask, "telemetryTask", 6144, nullptr, 2, &gTelemetryTaskHandle, 0) != pdPASS)
  {
    Serial.println("FATAL: telemetryTask creation failed");
    abort();
  }
}

void loop()
{
  vTaskDelay(portMAX_DELAY);
}
