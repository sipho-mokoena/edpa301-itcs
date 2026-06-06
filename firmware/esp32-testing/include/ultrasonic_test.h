#ifndef ULTRASONIC_TEST_H
#define ULTRASONIC_TEST_H

void setupUltrasonicTest(int trigPin, int echo1Pin, int echo2Pin, int echo3Pin);
void runUltrasonicTest();
float getUltrasonicDistanceCm(int sensorIndex);
bool isUltrasonicObstacleDetected(int sensorIndex, float maxDistanceCm);

#endif
