#ifndef WARNINGS_DRIVER_H
#define WARNINGS_DRIVER_H

void setupWarningsDriver(int buzzerPin, int redLedPin);
void setWarningsDriverEnabled(bool enabled);
void toggleWarningsDriver();
bool isWarningsDriverEnabled();
int getWarningsDriverBuzzerState();
int getWarningsDriverLedState();

#endif
