#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>

constexpr char kTelemetryTopic[] = "itcs/cu/telemetry";
constexpr char kCommandTopic[] = "itcs/cu/commands";
constexpr char kAckTopic[] = "itcs/cu/ack";
constexpr char kStateTopic[] = "itcs/cu/state";
constexpr char kAvailabilityTopic[] = "itcs/cu/availability";

constexpr int kBuzzerPin = 23;
constexpr int kRedLedPin = 22;
constexpr int kServo1Pin = 32;
constexpr int kServo2Pin = 33;
constexpr int kUltrasonicTriggerPin = 14;
constexpr int kUltrasonicEcho1Pin = 26;
constexpr int kUltrasonicEcho2Pin = 25;
constexpr int kUltrasonicEcho3Pin = 27;
constexpr int kIrApproachPin = 9;
constexpr int kIrInsidePin = 10;
constexpr int kIrLeavingPin = 13;
constexpr int kLdrDigitalPin = 17;
constexpr int kNightLightPin = 16;
constexpr int kLimitSwitch1Pin = 18;
constexpr int kLimitSwitch2Pin = 19;

constexpr float kObstacleDistanceCm = 12.0f;
constexpr int kGateOpenAngle = 0;
constexpr int kGateClosedAngle = 90;

constexpr TickType_t kSensorTaskPeriod = pdMS_TO_TICKS(50);
constexpr TickType_t kControlTaskPeriod = pdMS_TO_TICKS(20);
constexpr TickType_t kActuatorTaskPeriod = pdMS_TO_TICKS(20);
constexpr TickType_t kMqttTaskPeriod = pdMS_TO_TICKS(20);
constexpr TickType_t kTelemetryTaskPeriod = pdMS_TO_TICKS(500);

constexpr uint32_t kApproachTimeoutMs = 5000;
constexpr uint32_t kLeaveClearMs = 2000;
constexpr uint32_t kGateCloseTimeoutMs = 7000;
constexpr uint8_t kIrDebounceSamples = 3;

constexpr uint32_t kWifiRetryIntervalMs = 2000;
constexpr uint32_t kMqttRetryIntervalMs = 2000;
constexpr uint32_t kUltrasonicTriggerIntervalMs = 100;
constexpr uint32_t kEchoWaitIntervalMs = 50;
constexpr uint32_t kWifiClientTimeoutMs = 2000;
constexpr size_t kAvailabilityPayloadSize = 192;
constexpr size_t kTelemetryDocSize = 256;
constexpr size_t kTelemetryPayloadSize = 320;
constexpr size_t kStateDocSize = 640;
constexpr size_t kStatePayloadSize = 768;

enum class CrossingState : uint8_t
{
  idle,
  trainApproaching,
  trainInside,
  trainLeaving,
  fault,
};

enum class RemoteGateMode : uint8_t
{
  autoMode,
  forceOpen,
  forceClosed,
};

struct SensorSnapshot
{
  int irApproach;
  int irInside;
  int irLeaving;
  int limitSwitch1;
  int limitSwitch2;
  int ldrDark;
  int usSouth;
  int usIntersection;
  int usNorth;
  uint32_t sampledAtMs;
};

struct ActuatorState
{
  bool warningsEnabled;
  bool nightLightEnabled;
  bool gateClosed;
  int servo1Angle;
  int servo2Angle;
  uint32_t gateCommandedAtMs;
};

struct ControlState
{
  CrossingState crossingState;
  RemoteGateMode remoteGateMode;
  int remoteWarningOverride;
  bool faultActive;
  bool trainDetected;
  uint32_t enteredApproachAtMs;
  uint32_t enteredLeavingAtMs;
};

struct PublishedCache
{
  int irApproach;
  int irInside;
  int irLeaving;
  int ldrDark;
  int usSouth;
  int usIntersection;
  int usNorth;
  int limitSwitch1;
  int limitSwitch2;
  bool warningsEnabled;
  bool nightLightEnabled;
  bool gateClosed;
  bool faultActive;
};

inline int asBinary(bool value)
{
  return value ? 1 : 0;
}

inline const char *crossingStateToText(CrossingState state)
{
  switch (state)
  {
  case CrossingState::idle:
    return "IDLE";
  case CrossingState::trainApproaching:
    return "TRAIN_APPROACHING";
  case CrossingState::trainInside:
    return "TRAIN_INSIDE";
  case CrossingState::trainLeaving:
    return "TRAIN_LEAVING";
  case CrossingState::fault:
    return "FAULT";
  }

  return "UNKNOWN";
}

inline const char *activeStateText(int value)
{
  return value == 1 ? "ACTIVE" : "IDLE";
}

inline const char *gateStateText(bool isClosed)
{
  return isClosed ? "CLOSED" : "OPEN";
}

inline const char *warningStateText(bool isEnabled)
{
  return isEnabled ? "ACTIVE" : "IDLE";
}

#endif
