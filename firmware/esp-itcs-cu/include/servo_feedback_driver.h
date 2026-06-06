#ifndef SERVO_FEEDBACK_DRIVER_H
#define SERVO_FEEDBACK_DRIVER_H

void setupServoFeedbackDriver(int switch1Pin, int switch2Pin);
void updateServoFeedbackDriver();
int getServoFeedbackDriverState(int switchIndex);

#endif
