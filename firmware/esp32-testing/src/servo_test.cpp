#include "servo_test.h"

#include <Arduino.h>

#include "servo_driver.h"

namespace {
constexpr int kMinAngle = 0;
constexpr int kMaxAngle = 90;
constexpr unsigned long kStepDelayMs = 15;

int currentAngle = kMinAngle;
int direction = 1;
unsigned long lastStepAtMs = 0;
}  // namespace

void setupServoTest(int servoPin1, int servoPin2) {
  setupServoDriver(servoPin1, servoPin2);
  writeServoDriverAngles(currentAngle, currentAngle);
  lastStepAtMs = millis();
}

void runServoTest() {
  const unsigned long now = millis();
  if (now - lastStepAtMs < kStepDelayMs) {
    return;
  }

  lastStepAtMs = now;
  currentAngle += direction;

  if (currentAngle >= kMaxAngle) {
    currentAngle = kMaxAngle;
    direction = -1;
  } else if (currentAngle <= kMinAngle) {
    currentAngle = kMinAngle;
    direction = 1;
  }

  writeServoDriverAngles(currentAngle, currentAngle);
}

float getServoAngle1() {
  return getServoDriverAngle(0);
}

float getServoAngle2() {
  return getServoDriverAngle(1);
}
