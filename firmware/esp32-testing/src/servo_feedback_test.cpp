#include "servo_feedback_test.h"

#include <Arduino.h>

#include "servo_feedback_driver.h"

namespace {
constexpr unsigned long kReadIntervalMs = 100;
unsigned long lastReadAtMs = 0;
}  // namespace

void setupServoFeedbackTest(int switch1Pin, int switch2Pin) {
  setupServoFeedbackDriver(switch1Pin, switch2Pin);
  lastReadAtMs = 0;
}

void runServoFeedbackTest() {
  const unsigned long now = millis();
  if (now - lastReadAtMs < kReadIntervalMs) {
    return;
  }

  lastReadAtMs = now;
  updateServoFeedbackDriver();
}

int getServoLimitSwitchState(int switchIndex) {
  return getServoFeedbackDriverState(switchIndex);
}
