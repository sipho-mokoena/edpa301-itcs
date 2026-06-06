#include "warnings_driver.h"

#include <Arduino.h>

namespace {
constexpr int kBuzzerPwmChannel = 15;
constexpr int kBuzzerPwmFrequencyHz = 2000;
constexpr int kBuzzerPwmResolutionBits = 8;
constexpr int kBuzzerPwmDutyOn = 64;

int buzzerPin = -1;
int redLedPin = -1;
bool warningEnabled = false;
int buzzerState = LOW;
int ledState = LOW;

void writeOutputs() {
  ledcWrite(kBuzzerPwmChannel, warningEnabled ? kBuzzerPwmDutyOn : 0);
  digitalWrite(redLedPin, warningEnabled ? HIGH : LOW);

  buzzerState = warningEnabled ? 1 : 0;
  ledState = warningEnabled ? 1 : 0;
}
}  // namespace

void setupWarningsDriver(int buzzerOutputPin, int redLedOutputPin) {
  buzzerPin = buzzerOutputPin;
  redLedPin = redLedOutputPin;

  ledcSetup(kBuzzerPwmChannel, kBuzzerPwmFrequencyHz, kBuzzerPwmResolutionBits);
  ledcAttachPin(buzzerPin, kBuzzerPwmChannel);
  pinMode(redLedPin, OUTPUT);

  warningEnabled = false;
  writeOutputs();
}

void setWarningsDriverEnabled(bool enabled) {
  warningEnabled = enabled;
  writeOutputs();
}

void toggleWarningsDriver() {
  setWarningsDriverEnabled(!warningEnabled);
}

bool isWarningsDriverEnabled() {
  return warningEnabled;
}

int getWarningsDriverBuzzerState() {
  return buzzerState;
}

int getWarningsDriverLedState() {
  return ledState;
}
