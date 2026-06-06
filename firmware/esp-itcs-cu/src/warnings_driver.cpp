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
}  // namespace

void setupWarningsDriver(int buzzerOutputPin, int redLedOutputPin) {
  buzzerPin = buzzerOutputPin;
  redLedPin = redLedOutputPin;

  ledcSetup(kBuzzerPwmChannel, kBuzzerPwmFrequencyHz, kBuzzerPwmResolutionBits);
  ledcAttachPin(buzzerPin, kBuzzerPwmChannel);
  pinMode(redLedPin, OUTPUT);

  warningEnabled = false;
  ledcWrite(kBuzzerPwmChannel, 0);
  digitalWrite(redLedPin, LOW);
}

void setWarningsDriverEnabled(bool enabled) {
  warningEnabled = enabled;
  ledcWrite(kBuzzerPwmChannel, enabled ? kBuzzerPwmDutyOn : 0);
  digitalWrite(redLedPin, enabled ? HIGH : LOW);
}

bool isWarningsDriverEnabled() {
  return warningEnabled;
}
