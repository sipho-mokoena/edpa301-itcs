#include "config.h"
#include "globals.h"

#include "ir_obstacle_driver.h"
#include "servo_feedback_driver.h"
#include "ultrasonic_driver.h"

#include <Arduino.h>

namespace
{
  int debounceIrReading(int channelIndex, int rawValue)
  {
    if (channelIndex < 0 || channelIndex >= 3)
    {
      return rawValue;
    }

    if (rawValue == gIrRawLast[channelIndex])
    {
      if (gIrStableCount[channelIndex] < kIrDebounceSamples)
      {
        gIrStableCount[channelIndex]++;
      }
    }
    else
    {
      gIrRawLast[channelIndex] = rawValue;
      gIrStableCount[channelIndex] = 1;
    }

    if (gIrStableCount[channelIndex] >= kIrDebounceSamples)
    {
      gIrDebounced[channelIndex] = rawValue;
    }

    return gIrDebounced[channelIndex];
  }
}

void sensorTask(void *)
{
  TickType_t lastWake = xTaskGetTickCount();

  for (;;)
  {
    updateIrObstacleDriver();
    updateServoFeedbackDriver();

    const uint32_t now = millis();
    if (!gUltrasonicWaitingForEcho && (now - gLastUltrasonicTriggerMs >= kUltrasonicTriggerIntervalMs))
    {
      updateUltrasonicDriver();
      gUltrasonicWaitingForEcho = true;
      gLastUltrasonicTriggerMs = now;
    }
    else if (gUltrasonicWaitingForEcho && (now - gLastUltrasonicTriggerMs >= kEchoWaitIntervalMs))
    {
      finalizeUltrasonicDriverMeasurement();
      gUltrasonicWaitingForEcho = false;
    }

    SensorSnapshot localSnapshot;
    const int rawIrInside = getIrObstacleDriverState(0);
    const int rawIrApproach = getIrObstacleDriverState(1);
    const int rawIrLeaving = getIrObstacleDriverState(2);

    localSnapshot.irApproach = debounceIrReading(0, rawIrApproach);
    localSnapshot.irInside = debounceIrReading(1, rawIrInside);
    localSnapshot.irLeaving = debounceIrReading(2, rawIrLeaving);
    localSnapshot.limitSwitch1 = getServoFeedbackDriverState(0);
    localSnapshot.limitSwitch2 = getServoFeedbackDriverState(1);
    localSnapshot.ldrDark = digitalRead(kLdrDigitalPin) == HIGH ? 1 : 0;
    localSnapshot.usSouth = isUltrasonicDriverObstacleDetected(0, kObstacleDistanceCm) ? 1 : 0;
    localSnapshot.usIntersection = isUltrasonicDriverObstacleDetected(1, kObstacleDistanceCm) ? 1 : 0;
    localSnapshot.usNorth = isUltrasonicDriverObstacleDetected(2, kObstacleDistanceCm) ? 1 : 0;
    localSnapshot.sampledAtMs = now;

    if (xSemaphoreTake(gStateMutex, portMAX_DELAY) == pdTRUE)
    {
      gSensors = localSnapshot;
      xSemaphoreGive(gStateMutex);
    }

    vTaskDelayUntil(&lastWake, kSensorTaskPeriod);
  }
}
