#ifndef IR_OBSTACLE_DRIVER_H
#define IR_OBSTACLE_DRIVER_H

void setupIrObstacleDriver(int sensor1Pin, int sensor2Pin, int sensor3Pin);
void updateIrObstacleDriver();
int getIrObstacleDriverState(int sensorIndex);

#endif
