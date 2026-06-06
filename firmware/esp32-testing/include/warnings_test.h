#ifndef WARNINGS_TEST_H
#define WARNINGS_TEST_H

void setupWarningsTest(int buzzerPin, int redLedPin);
void runWarningsTest();
void setWarningsTestEnabled(bool enabled);
bool isWarningActive();
int getBuzzerState();
int getLedState();

#endif
