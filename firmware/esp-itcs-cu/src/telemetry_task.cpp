#include "config.h"
#include "globals.h"

#include <Arduino.h>

#ifndef ITCS_DISABLE_NETWORK
#include "mqtt_client.h"
#include <WiFi.h>
#endif

void telemetryTask(void *)
{
  TickType_t lastWake = xTaskGetTickCount();

  for (;;)
  {
    SensorSnapshot sensors;
    ActuatorState actuators;
    ControlState control;

    if (xSemaphoreTake(gStateMutex, portMAX_DELAY) == pdTRUE)
    {
      sensors = gSensors;
      actuators = gActuators;
      control = gControl;
      xSemaphoreGive(gStateMutex);
    }

#ifndef ITCS_DISABLE_NETWORK
    if (gMqttClient.connected())
    {
      if (gPublished.irApproach != sensors.irApproach)
      {
        publishTelemetry("sensorId", "ir.train.approach", activeStateText(sensors.irApproach));
      }
      if (gPublished.irInside != sensors.irInside)
      {
        publishTelemetry("sensorId", "ir.train.inside", activeStateText(sensors.irInside));
      }
      if (gPublished.irLeaving != sensors.irLeaving)
      {
        publishTelemetry("sensorId", "ir.train.leaving", activeStateText(sensors.irLeaving));
      }
      if (gPublished.ldrDark != sensors.ldrDark)
      {
        publishTelemetry("sensorId", "ldr.camera.night", activeStateText(sensors.ldrDark));
      }
      if (gPublished.usSouth != sensors.usSouth)
      {
        publishTelemetry("sensorId", "ultrasonic.south.vehicle", activeStateText(sensors.usSouth));
      }
      if (gPublished.usIntersection != sensors.usIntersection)
      {
        publishTelemetry("sensorId", "ultrasonic.intersection.vehicle", activeStateText(sensors.usIntersection));
      }
      if (gPublished.usNorth != sensors.usNorth)
      {
        publishTelemetry("sensorId", "ultrasonic.north.vehicle", activeStateText(sensors.usNorth));
      }
      if (gPublished.warningsEnabled != actuators.warningsEnabled)
      {
        publishTelemetry("actuatorId", "warning.redLed", warningStateText(actuators.warningsEnabled));
        publishTelemetry("actuatorId", "warning.buzzer", warningStateText(actuators.warningsEnabled));
      }
      if (gPublished.nightLightEnabled != actuators.nightLightEnabled)
      {
        publishTelemetry("actuatorId", "light.camera.night", actuators.nightLightEnabled ? "ACTIVE" : "IDLE");
      }
      if (gPublished.gateClosed != actuators.gateClosed)
      {
        publishTelemetry("actuatorId", "gate.servo.left", gateStateText(actuators.gateClosed));
        publishTelemetry("actuatorId", "gate.servo.right", gateStateText(actuators.gateClosed));
      }
      if (gPublished.faultActive != control.faultActive)
      {
        publishTelemetry("actuatorId", "controller.fault", control.faultActive ? "FAULT" : "ACTIVE");
      }

      publishState(sensors, actuators, control);

      if (xSemaphoreTake(gStateMutex, portMAX_DELAY) == pdTRUE)
      {
        gPublished.irApproach = sensors.irApproach;
        gPublished.irInside = sensors.irInside;
        gPublished.irLeaving = sensors.irLeaving;
        gPublished.ldrDark = sensors.ldrDark;
        gPublished.usSouth = sensors.usSouth;
        gPublished.usIntersection = sensors.usIntersection;
        gPublished.usNorth = sensors.usNorth;
        gPublished.warningsEnabled = actuators.warningsEnabled;
        gPublished.nightLightEnabled = actuators.nightLightEnabled;
        gPublished.gateClosed = actuators.gateClosed;
        gPublished.faultActive = control.faultActive;
        xSemaphoreGive(gStateMutex);
      }
    }
#endif

    Serial.printf(
        "state=%s ir=[%d,%d,%d] us=[%d,%d,%d] ldr=%d gate=%d warn=%d night=%d fault=%d\n",
        crossingStateToText(control.crossingState),
        sensors.irApproach,
        sensors.irInside,
        sensors.irLeaving,
        sensors.usSouth,
        sensors.usIntersection,
        sensors.usNorth,
        sensors.ldrDark,
        asBinary(actuators.gateClosed),
        asBinary(actuators.warningsEnabled),
        asBinary(actuators.nightLightEnabled),
        asBinary(control.faultActive));

    Serial.printf(
        "stack: sensor=%u ctrl=%u act=%u\n",
        uxTaskGetStackHighWaterMark(gSensorTaskHandle),
        uxTaskGetStackHighWaterMark(gControlTaskHandle),
        uxTaskGetStackHighWaterMark(gActuatorTaskHandle));

    vTaskDelayUntil(&lastWake, kTelemetryTaskPeriod);
  }
}
