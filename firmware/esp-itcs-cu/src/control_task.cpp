#include "config.h"
#include "globals.h"

#include <Arduino.h>

void controlTask(void *)
{
  TickType_t lastWake = xTaskGetTickCount();

  for (;;)
  {
    if (xSemaphoreTake(gStateMutex, portMAX_DELAY) == pdTRUE)
    {
      const uint32_t now = millis();

      const bool approach = gSensors.irApproach == 1;
      const bool inside = gSensors.irInside == 1;
      const bool leaving = gSensors.irLeaving == 1;
      const bool gateClosedBySwitch = gSensors.limitSwitch1 == 1 && gSensors.limitSwitch2 == 1;

      if (gControl.faultActive)
      {
        gControl.crossingState = CrossingState::fault;
      }
      else
      {
        switch (gControl.crossingState)
        {
        case CrossingState::idle:
          if (approach)
          {
            gControl.crossingState = CrossingState::trainApproaching;
            gControl.enteredApproachAtMs = now;
          }
          else if (inside)
          {
            gControl.crossingState = CrossingState::trainInside;
          }
          break;

        case CrossingState::trainApproaching:
          if (inside)
          {
            gControl.crossingState = CrossingState::trainInside;
          }
          else if (!approach && (now - gControl.enteredApproachAtMs > kApproachTimeoutMs))
          {
            gControl.crossingState = CrossingState::idle;
          }
          break;

        case CrossingState::trainInside:
          if (leaving && !inside && !approach)
          {
            gControl.crossingState = CrossingState::trainLeaving;
            gControl.enteredLeavingAtMs = now;
          }
          break;

        case CrossingState::trainLeaving:
          if (!approach && !inside && !leaving && (now - gControl.enteredLeavingAtMs > kLeaveClearMs))
          {
            gControl.crossingState = CrossingState::idle;
          }
          break;

        case CrossingState::fault:
          break;
        }
      }

      const bool trainActive =
          gControl.crossingState == CrossingState::trainApproaching ||
          gControl.crossingState == CrossingState::trainInside ||
          gControl.crossingState == CrossingState::trainLeaving;

      bool targetGateClosed = trainActive || gControl.faultActive;
      bool targetWarningsOn = trainActive || gControl.faultActive;

      if (!trainActive && !gControl.faultActive)
      {
        if (gControl.remoteGateMode == RemoteGateMode::forceClosed)
        {
          targetGateClosed = true;
        }
        else if (gControl.remoteGateMode == RemoteGateMode::forceOpen)
        {
          targetGateClosed = false;
        }

        if (gControl.remoteWarningOverride == 1)
        {
          targetWarningsOn = true;
        }
        else if (gControl.remoteWarningOverride == 0)
        {
          targetWarningsOn = false;
        }
      }

      const bool changedGateCommand = (gActuators.gateClosed != targetGateClosed);
      gActuators.gateClosed = targetGateClosed;
      gActuators.warningsEnabled = targetWarningsOn;
      gActuators.nightLightEnabled = gSensors.ldrDark == 1;
      gControl.trainDetected = trainActive;

      if (changedGateCommand)
      {
        gActuators.gateCommandedAtMs = now;
      }

      if (gActuators.gateClosed && !gateClosedBySwitch &&
          (now - gActuators.gateCommandedAtMs > kGateCloseTimeoutMs))
      {
        gControl.faultActive = true;
        gControl.crossingState = CrossingState::fault;
      }

      xSemaphoreGive(gStateMutex);
    }

    vTaskDelayUntil(&lastWake, kControlTaskPeriod);
  }
}
