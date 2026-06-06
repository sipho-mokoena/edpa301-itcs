#include "ir_obstacle_driver.h"

#include <Arduino.h>

namespace {
constexpr int kSensorCount = 3;

int sensorPins[kSensorCount] = {-1, -1, -1};
int sensorStates[kSensorCount] = {0, 0, 0};
}  // namespace

void setupIrObstacleDriver(int sensor1Pin, int sensor2Pin, int sensor3Pin) {
  sensorPins[0] = sensor1Pin;
  sensorPins[1] = sensor2Pin;
  sensorPins[2] = sensor3Pin;

  for (int i = 0; i < kSensorCount; i++) {
    pinMode(sensorPins[i], INPUT);
    sensorStates[i] = 0;
  }
}

void updateIrObstacleDriver() {
  for (int i = 0; i < kSensorCount; i++) {
    sensorStates[i] = digitalRead(sensorPins[i]) == LOW ? 1 : 0;
  }
}

int getIrObstacleDriverState(int sensorIndex) {
  if (sensorIndex < 0 || sensorIndex >= kSensorCount) {
    return 0;
  }

  return sensorStates[sensorIndex];
}
