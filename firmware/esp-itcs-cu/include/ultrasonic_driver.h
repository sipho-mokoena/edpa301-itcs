#ifndef ULTRASONIC_DRIVER_H
#define ULTRASONIC_DRIVER_H

void setupUltrasonicDriver(int trigPin, int echo1Pin, int echo2Pin, int echo3Pin);
void updateUltrasonicDriver();
void finalizeUltrasonicDriverMeasurement();
float getUltrasonicDriverDistanceCm(int sensorIndex);
bool isUltrasonicDriverObstacleDetected(int sensorIndex, float maxDistanceCm);

#endif
