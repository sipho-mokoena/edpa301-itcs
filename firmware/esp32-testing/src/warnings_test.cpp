#include "warnings_test.h"

#include <Arduino.h>

#include "warnings_driver.h"

namespace {
constexpr unsigned long kToggleIntervalMs = 1000;
unsigned long lastToggleAtMs = 0;
}  // namespace

void setupWarningsTest(int buzzerOutputPin, int redLedOutputPin) {
  setupWarningsDriver(buzzerOutputPin, redLedOutputPin);
  lastToggleAtMs = millis();
}

void runWarningsTest() {
  const unsigned long now = millis();
  if (now - lastToggleAtMs < kToggleIntervalMs) {
    return;
  }

  lastToggleAtMs = now;
  toggleWarningsDriver();
}

void setWarningsTestEnabled(bool enabled) {
  setWarningsDriverEnabled(enabled);
}

bool isWarningActive() {
  return isWarningsDriverEnabled();
}

int getBuzzerState() {
  return getWarningsDriverBuzzerState();
}

int getLedState() {
  return getWarningsDriverLedState();
}
