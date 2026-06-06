#include "servo_driver.h"

#include <ESP32Servo.h>

namespace {
constexpr int kServoCount = 2;

Servo servos[kServoCount];
}  // namespace

void setupServoDriver(int servoPin1, int servoPin2) {
  servos[0].attach(servoPin1);
  servos[1].attach(servoPin2);
}

void writeServoDriverAngles(int angle1, int angle2) {
  servos[0].write(angle1);
  servos[1].write(angle2);
}


