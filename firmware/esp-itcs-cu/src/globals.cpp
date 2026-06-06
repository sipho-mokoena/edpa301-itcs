#include "globals.h"

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
    -1, -1, -1, -1, -1, -1, -1, -1, -1,
    false, false, false, false,
};

WiFiClient gWiFiClient;
PubSubClient gMqttClient(gWiFiClient);

TaskHandle_t gSensorTaskHandle = nullptr;
TaskHandle_t gControlTaskHandle = nullptr;
TaskHandle_t gActuatorTaskHandle = nullptr;
TaskHandle_t gMqttTaskHandle = nullptr;
TaskHandle_t gTelemetryTaskHandle = nullptr;

uint32_t gLastUltrasonicTriggerMs = 0;
bool gUltrasonicWaitingForEcho = false;
uint32_t gLastWiFiRetryMs = 0;
uint32_t gLastMqttRetryMs = 0;

int gIrRawLast[3] = {0, 0, 0};
uint8_t gIrStableCount[3] = {0, 0, 0};
int gIrDebounced[3] = {0, 0, 0};
