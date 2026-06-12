#ifndef GLOBALS_H
#define GLOBALS_H

#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include <freertos/task.h>

#include "config.h"

#ifndef ITCS_DISABLE_NETWORK
#include <WiFi.h>
#include <PubSubClient.h>
#endif

extern SemaphoreHandle_t gStateMutex;

extern SensorSnapshot gSensors;
extern ActuatorState gActuators;
extern ControlState gControl;
extern PublishedCache gPublished;

#ifndef ITCS_DISABLE_NETWORK
extern WiFiClient gWiFiClient;
extern PubSubClient gMqttClient;
#endif

extern TaskHandle_t gSensorTaskHandle;
extern TaskHandle_t gControlTaskHandle;
extern TaskHandle_t gActuatorTaskHandle;
extern TaskHandle_t gMqttTaskHandle;
extern TaskHandle_t gTelemetryTaskHandle;

extern uint32_t gLastUltrasonicTriggerMs;
extern bool gUltrasonicWaitingForEcho;

#ifndef ITCS_DISABLE_NETWORK
extern uint32_t gLastWiFiRetryMs;
extern uint32_t gLastMqttRetryMs;
#endif

extern int gIrRawLast[3];
extern uint8_t gIrStableCount[3];
extern int gIrDebounced[3];

#endif
