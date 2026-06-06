#ifndef GLOBALS_H
#define GLOBALS_H

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include <freertos/task.h>

#include "config.h"

extern SemaphoreHandle_t gStateMutex;

extern SensorSnapshot gSensors;
extern ActuatorState gActuators;
extern ControlState gControl;
extern PublishedCache gPublished;

extern WiFiClient gWiFiClient;
extern PubSubClient gMqttClient;

extern TaskHandle_t gSensorTaskHandle;
extern TaskHandle_t gControlTaskHandle;
extern TaskHandle_t gActuatorTaskHandle;
extern TaskHandle_t gMqttTaskHandle;
extern TaskHandle_t gTelemetryTaskHandle;

extern uint32_t gLastUltrasonicTriggerMs;
extern bool gUltrasonicWaitingForEcho;
extern uint32_t gLastWiFiRetryMs;
extern uint32_t gLastMqttRetryMs;

extern int gIrRawLast[3];
extern uint8_t gIrStableCount[3];
extern int gIrDebounced[3];

#endif
