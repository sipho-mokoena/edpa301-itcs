#include "ultrasonic_driver.h"

#include <Arduino.h>

namespace {
constexpr int kSensorCount = 3;
constexpr unsigned long kMinPulseDurationUs = 100;
constexpr float kSpeedOfSoundFactor = 58.0f;

int triggerPin = -1;
int echoPins[kSensorCount] = {-1, -1, -1};

volatile unsigned long startTimes[kSensorCount] = {0, 0, 0};
volatile unsigned long latestTravelTimes[kSensorCount] = {0, 0, 0};
volatile bool latestPulseCompleted[kSensorCount] = {false, false, false};
volatile bool cyclePulseCompleted[kSensorCount] = {false, false, false};

void IRAM_ATTR handleEchoInterrupt(int sensorIndex) {
  const int echoPin = echoPins[sensorIndex];
  if (digitalRead(echoPin) == HIGH) {
    startTimes[sensorIndex] = micros();
    return;
  }

  if (startTimes[sensorIndex] == 0) {
    return;
  }

  const unsigned long duration = micros() - startTimes[sensorIndex];
  if (duration > kMinPulseDurationUs) {
    latestTravelTimes[sensorIndex] = duration;
    cyclePulseCompleted[sensorIndex] = true;
  }
}

void IRAM_ATTR echoISR1() {
  handleEchoInterrupt(0);
}

void IRAM_ATTR echoISR2() {
  handleEchoInterrupt(1);
}

void IRAM_ATTR echoISR3() {
  handleEchoInterrupt(2);
}

void startMeasurementCycle() {
  for (int i = 0; i < kSensorCount; i++) {
    startTimes[i] = 0;
    cyclePulseCompleted[i] = false;
  }
}
}  // namespace

void setupUltrasonicDriver(int trigPin, int echo1Pin, int echo2Pin, int echo3Pin) {
  triggerPin = trigPin;
  echoPins[0] = echo1Pin;
  echoPins[1] = echo2Pin;
  echoPins[2] = echo3Pin;

  pinMode(triggerPin, OUTPUT);
  digitalWrite(triggerPin, LOW);
  delayMicroseconds(2);

  for (int i = 0; i < kSensorCount; i++) {
    pinMode(echoPins[i], INPUT);
  }

  attachInterrupt(digitalPinToInterrupt(echoPins[0]), echoISR1, CHANGE);
  attachInterrupt(digitalPinToInterrupt(echoPins[1]), echoISR2, CHANGE);
  attachInterrupt(digitalPinToInterrupt(echoPins[2]), echoISR3, CHANGE);

  startMeasurementCycle();
}

void updateUltrasonicDriver() {
  startMeasurementCycle();
  digitalWrite(triggerPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(triggerPin, LOW);
}

void finalizeUltrasonicDriverMeasurement() {
  for (int i = 0; i < kSensorCount; i++) {
    latestPulseCompleted[i] = cyclePulseCompleted[i];
  }
}

float getUltrasonicDriverDistanceCm(int sensorIndex) {
  if (sensorIndex < 0 || sensorIndex >= kSensorCount) {
    return 0.0f;
  }

  if (!latestPulseCompleted[sensorIndex]) {
    return 0.0f;
  }

  return latestTravelTimes[sensorIndex] / kSpeedOfSoundFactor;
}

bool isUltrasonicDriverObstacleDetected(int sensorIndex, float maxDistanceCm) {
  const float distanceCm = getUltrasonicDriverDistanceCm(sensorIndex);
  if (distanceCm <= 0.0f) {
    return false;
  }

  return distanceCm <= maxDistanceCm;
}
