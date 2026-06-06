#include "servo_feedback_driver.h"

#include <Arduino.h>

namespace {
constexpr int kLimitSwitchCount = 2;

int limitSwitchPins[kLimitSwitchCount] = {-1, -1};
int limitSwitchStates[kLimitSwitchCount] = {0, 0};
}  // namespace

void setupServoFeedbackDriver(int switch1Pin, int switch2Pin) {
  limitSwitchPins[0] = switch1Pin;
  limitSwitchPins[1] = switch2Pin;

  for (int i = 0; i < kLimitSwitchCount; i++) {
    pinMode(limitSwitchPins[i], INPUT_PULLUP);
    limitSwitchStates[i] = 0;
  }
}

void updateServoFeedbackDriver() {
  for (int i = 0; i < kLimitSwitchCount; i++) {
    limitSwitchStates[i] = digitalRead(limitSwitchPins[i]) == LOW ? 1 : 0;
  }
}

int getServoFeedbackDriverState(int switchIndex) {
  if (switchIndex < 0 || switchIndex >= kLimitSwitchCount) {
    return 0;
  }

  return limitSwitchStates[switchIndex];
}
