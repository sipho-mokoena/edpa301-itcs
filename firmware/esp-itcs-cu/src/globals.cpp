#include "globals.h"

SemaphoreHandle_t gStateMutex = nullptr;

SensorSnapshot gSensors = {0, 0, 0, 0, 0, 0, 0, 0};
ActuatorState gActuators = {false, false, false, kGateOpenAngle, kGateOpenAngle};
ControlState gControl = {
    CrossingState::idle,
    RemoteGateMode::autoMode,
    -1,
    false,
    false,
    0,
};
PublishedCache gPublished = {
    -1, -1, -1, -1, -1, -1, -1,
    false, false, false, false,
};

#ifndef ITCS_DISABLE_NETWORK
WiFiClient gWiFiClient;
PubSubClient gMqttClient(gWiFiClient);
#endif

TaskHandle_t gSensorTaskHandle = nullptr;
TaskHandle_t gControlTaskHandle = nullptr;
TaskHandle_t gActuatorTaskHandle = nullptr;
TaskHandle_t gMqttTaskHandle = nullptr;
TaskHandle_t gTelemetryTaskHandle = nullptr;

uint32_t gLastUltrasonicTriggerMs = 0;
bool gUltrasonicWaitingForEcho = false;

#ifndef ITCS_DISABLE_NETWORK
uint32_t gLastWiFiRetryMs = 0;
uint32_t gLastMqttRetryMs = 0;
#endif

int gIrRawLast[3] = {0, 0, 0};
uint8_t gIrStableCount[3] = {0, 0, 0};
int gIrDebounced[3] = {0, 0, 0};
