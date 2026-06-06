#ifndef IR_OBSTACLE_TEST_H
#define IR_OBSTACLE_TEST_H

void setupIrObstacleTest(int sensor1Pin, int sensor2Pin, int sensor3Pin);
void runIrObstacleTest();
int getIrObstacleState(int sensorIndex);

#endif
