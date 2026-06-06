#ifndef SERVO_DRIVER_H
#define SERVO_DRIVER_H

void setupServoDriver(int servoPin1, int servoPin2);
void writeServoDriverAngles(int angle1, int angle2);
float getServoDriverAngle(int servoIndex);

#endif
