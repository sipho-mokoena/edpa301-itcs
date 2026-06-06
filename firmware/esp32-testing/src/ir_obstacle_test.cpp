#include "ir_obstacle_test.h"

#include <Arduino.h>

#include "ir_obstacle_driver.h"

namespace {
constexpr unsigned long kReadIntervalMs = 200;
unsigned long lastReadAtMs = 0;
}  // namespace

void setupIrObstacleTest(int sensor1Pin, int sensor2Pin, int sensor3Pin) {
  setupIrObstacleDriver(sensor1Pin, sensor2Pin, sensor3Pin);
  lastReadAtMs = 0;
}

void runIrObstacleTest() {
  const unsigned long now = millis();
  if (now - lastReadAtMs < kReadIntervalMs) {
    return;
  }

  lastReadAtMs = now;
  updateIrObstacleDriver();
}

int getIrObstacleState(int sensorIndex) {
  return getIrObstacleDriverState(sensorIndex);
}
