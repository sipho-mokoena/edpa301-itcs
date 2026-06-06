#include "config.h"
#include "globals.h"
#include "mqtt_client.h"

#include <Arduino.h>
#include <WiFi.h>

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
      if (gPublished.limitSwitch1 != sensors.limitSwitch1)
      {
        publishTelemetry("sensorId", "limit.left.closed", activeStateText(sensors.limitSwitch1));
      }
      if (gPublished.limitSwitch2 != sensors.limitSwitch2)
      {
        publishTelemetry("sensorId", "limit.right.closed", activeStateText(sensors.limitSwitch2));
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
        gPublished.limitSwitch1 = sensors.limitSwitch1;
        gPublished.limitSwitch2 = sensors.limitSwitch2;
        gPublished.warningsEnabled = actuators.warningsEnabled;
        gPublished.nightLightEnabled = actuators.nightLightEnabled;
        gPublished.gateClosed = actuators.gateClosed;
        gPublished.faultActive = control.faultActive;
        xSemaphoreGive(gStateMutex);
      }
    }

    Serial.printf(
        "state=%s ir=[%d,%d,%d] us=[%d,%d,%d] ldr=%d lim=[%d,%d] gate=%d warn=%d night=%d fault=%d wifi=%d mqtt=%d\n",
        crossingStateToText(control.crossingState),
        sensors.irApproach,
        sensors.irInside,
        sensors.irLeaving,
        sensors.usSouth,
        sensors.usIntersection,
        sensors.usNorth,
        sensors.ldrDark,
        sensors.limitSwitch1,
        sensors.limitSwitch2,
        asBinary(actuators.gateClosed),
        asBinary(actuators.warningsEnabled),
        asBinary(actuators.nightLightEnabled),
        asBinary(control.faultActive),
        WiFi.status() == WL_CONNECTED ? 1 : 0,
        gMqttClient.connected() ? 1 : 0);

    Serial.printf(
        "stack: sensor=%u ctrl=%u act=%u mqtt=%u tele=%u\n",
        uxTaskGetStackHighWaterMark(gSensorTaskHandle),
        uxTaskGetStackHighWaterMark(gControlTaskHandle),
        uxTaskGetStackHighWaterMark(gActuatorTaskHandle),
        uxTaskGetStackHighWaterMark(gMqttTaskHandle),
        uxTaskGetStackHighWaterMark(gTelemetryTaskHandle));

    vTaskDelayUntil(&lastWake, kTelemetryTaskPeriod);
  }
}
