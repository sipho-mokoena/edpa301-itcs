#ifndef SERVO_FEEDBACK_TEST_H
#define SERVO_FEEDBACK_TEST_H

void setupServoFeedbackTest(int limitSwitch1Pin, int limitSwitch2Pin);
void runServoFeedbackTest();
int getServoLimitSwitchState(int switchIndex);

#endif
