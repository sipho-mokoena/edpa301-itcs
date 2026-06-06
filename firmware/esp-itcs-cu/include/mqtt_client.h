#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#include <Arduino.h>
#include <PubSubClient.h>

#include "config.h"

void mqttCallback(char *topic, byte *payload, unsigned int length);
void ensureWiFiConnected();
void ensureMqttConnected();
bool publishTelemetry(const char *elementType, const char *elementId, const char *status);
bool publishState(const SensorSnapshot &sensors, const ActuatorState &actuators, const ControlState &control);

#endif
