#include "config.h"
#include "globals.h"

#include "servo_driver.h"
#include "warnings_driver.h"

#include <Arduino.h>

void actuatorTask(void *)
{
  TickType_t lastWake = xTaskGetTickCount();

  for (;;)
  {
    ActuatorState actuators;
    if (xSemaphoreTake(gStateMutex, portMAX_DELAY) == pdTRUE)
    {
      actuators = gActuators;
      xSemaphoreGive(gStateMutex);
    }

    if (actuators.gateClosed)
    {
      actuators.servo1Angle = kGateClosedAngle;
      actuators.servo2Angle = kGateClosedAngle;
    }
    else
    {
      actuators.servo1Angle = kGateOpenAngle;
      actuators.servo2Angle = kGateOpenAngle;
    }

    writeServoDriverAngles(actuators.servo1Angle, actuators.servo2Angle);
    setWarningsDriverEnabled(actuators.warningsEnabled);
    digitalWrite(kNightLightPin, actuators.nightLightEnabled ? HIGH : LOW);

    if (xSemaphoreTake(gStateMutex, portMAX_DELAY) == pdTRUE)
    {
      gActuators.servo1Angle = actuators.servo1Angle;
      gActuators.servo2Angle = actuators.servo2Angle;
      xSemaphoreGive(gStateMutex);
    }

    vTaskDelayUntil(&lastWake, kActuatorTaskPeriod);
  }
}
