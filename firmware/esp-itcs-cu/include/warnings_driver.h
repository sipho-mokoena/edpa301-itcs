#ifndef WARNINGS_DRIVER_H
#define WARNINGS_DRIVER_H

void setupWarningsDriver(int buzzerPin, int redLedPin);
void setWarningsDriverEnabled(bool enabled);
bool isWarningsDriverEnabled();

#endif
