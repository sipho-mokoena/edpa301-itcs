#include "ultrasonic_test.h"

#include <Arduino.h>

#include "ultrasonic_driver.h"

namespace {
constexpr unsigned long kEchoWaitMs = 50;
constexpr unsigned long kCycleDelayMs = 100;

enum class UltrasonicState {
  readyToTrigger,
  waitingForEcho,
};

UltrasonicState currentState = UltrasonicState::readyToTrigger;
unsigned long stateChangedAtMs = 0;

}  // namespace

void setupUltrasonicTest(int trigPin, int echo1Pin, int echo2Pin, int echo3Pin) {
  setupUltrasonicDriver(trigPin, echo1Pin, echo2Pin, echo3Pin);
  currentState = UltrasonicState::readyToTrigger;
  stateChangedAtMs = millis() - kCycleDelayMs;
}

void runUltrasonicTest() {
  const unsigned long now = millis();

  if (currentState == UltrasonicState::readyToTrigger) {
    if (now - stateChangedAtMs < kCycleDelayMs) {
      return;
    }

    updateUltrasonicDriver();
    currentState = UltrasonicState::waitingForEcho;
    stateChangedAtMs = now;
    return;
  }

  if (now - stateChangedAtMs < kEchoWaitMs) {
    return;
  }

  finalizeUltrasonicDriverMeasurement();
  currentState = UltrasonicState::readyToTrigger;
  stateChangedAtMs = now;
}

float getUltrasonicDistanceCm(int sensorIndex) {
  return getUltrasonicDriverDistanceCm(sensorIndex);
}

bool isUltrasonicObstacleDetected(int sensorIndex, float maxDistanceCm) {
  return isUltrasonicDriverObstacleDetected(sensorIndex, maxDistanceCm);
}
