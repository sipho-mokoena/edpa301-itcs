#include "servo_driver.h"

#include <ESP32Servo.h>

namespace {
constexpr int kServoCount = 2;

Servo servos[kServoCount];
float servoAngles[kServoCount] = {0.0f, 0.0f};
}  // namespace

void setupServoDriver(int servoPin1, int servoPin2) {
  servos[0].attach(servoPin1);
  servos[1].attach(servoPin2);
}

void writeServoDriverAngles(int angle1, int angle2) {
  servoAngles[0] = static_cast<float>(angle1);
  servoAngles[1] = static_cast<float>(angle2);

  servos[0].write(angle1);
  servos[1].write(angle2);
}

float getServoDriverAngle(int servoIndex) {
  if (servoIndex < 0 || servoIndex >= kServoCount) {
    return 0.0f;
  }

  return servoAngles[servoIndex];
}
