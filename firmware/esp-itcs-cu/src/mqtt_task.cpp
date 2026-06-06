#include "mqtt_client.h"
#include "globals.h"

#include <Arduino.h>

void mqttTask(void *)
{
  TickType_t lastWake = xTaskGetTickCount();

  for (;;)
  {
    ensureWiFiConnected();
    ensureMqttConnected();
    gMqttClient.loop();

    vTaskDelayUntil(&lastWake, kMqttTaskPeriod);
  }
}
