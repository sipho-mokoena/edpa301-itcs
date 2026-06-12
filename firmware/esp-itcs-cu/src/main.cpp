#include <Arduino.h>

#include "config.h"
#include "globals.h"

#ifndef ITCS_DISABLE_NETWORK
#include <WiFi.h>
#include "mqtt_client.h"
#include "secrets.h"
#endif

#include "ir_obstacle_driver.h"
#include "servo_driver.h"
#include "ultrasonic_driver.h"
#include "warnings_driver.h"

void sensorTask(void *);
void controlTask(void *);
void actuatorTask(void *);
#ifndef ITCS_DISABLE_NETWORK
void mqttTask(void *);
void telemetryTask(void *);
#endif

void setup()
{
  Serial.begin(115200);

  setupWarningsDriver(kBuzzerPin, kRedLedPin);
  setupServoDriver(kServo1Pin, kServo2Pin);
  setupUltrasonicDriver(kUltrasonicTriggerPin, kUltrasonicEcho1Pin, kUltrasonicEcho2Pin, kUltrasonicEcho3Pin);
  setupIrObstacleDriver(kIrInsidePin, kIrApproachPin, kIrLeavingPin);

  pinMode(kLdrDigitalPin, INPUT);
  pinMode(kNightLightPin, OUTPUT);
  digitalWrite(kNightLightPin, LOW);

  gStateMutex = xSemaphoreCreateMutex();
  if (gStateMutex == nullptr)
  {
    Serial.println("FATAL: failed to create state mutex");
    abort();
  }

#ifndef ITCS_DISABLE_NETWORK
  gMqttClient.setServer(ITCS_MQTT_HOST, ITCS_MQTT_PORT);
  gMqttClient.setCallback(mqttCallback);
  gMqttClient.setBufferSize(kStatePayloadSize);
  gMqttClient.setKeepAlive(5);
  gWiFiClient.setTimeout(kWifiClientTimeoutMs);
#endif

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
#ifndef ITCS_DISABLE_NETWORK
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
#endif
}

void loop()
{
  vTaskDelay(portMAX_DELAY);
}
