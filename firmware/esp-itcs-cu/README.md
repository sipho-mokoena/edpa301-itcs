# ESP-ITCS-CU — Crossing Unit

ESP32-based railway crossing controller. Reads IR obstacle sensors and ultrasonic
sensors to detect train approach/presence/leaving, controls gate servos and warning
lights, and publishes telemetry over MQTT.

## Hardware Pinout

| Pin | Function               |
|-----|------------------------|
| 23  | Buzzer (PWM, 2kHz)     |
| 22  | Red Warning LED        |
| 32  | Servo 1 (Gate Left)    |
| 33  | Servo 2 (Gate Right)   |
| 14  | Ultrasonic Trigger     |
| 26  | Ultrasonic Echo 1 (South) |
| 25  | Ultrasonic Echo 2 (Intersection) |
| 27  | Ultrasonic Echo 3 (North) |
| 9   | IR Train Approach      |
| 10  | IR Train Inside        |
| 13  | IR Train Leaving       |
| 17  | LDR Digital (Night)    |
| 16  | Night Light LED        |
| 18  | Limit Switch 1 (Gate Closed Left)  |
| 19  | Limit Switch 2 (Gate Closed Right) |

## State Machine

```
IDLE → TRAIN_APPROACHING → TRAIN_INSIDE → TRAIN_LEAVING → IDLE
  ↑                                                        |
  └──────────────────── FAULT ───────────────────────────────┘
```

- **IDLE**: Gates open, warnings off. Transitions to APPROACHING on IR approach sensor.
- **TRAIN_APPROACHING**: Gates close, warnings on. Transitions to INSIDE on IR inside sensor.
- **TRAIN_INSIDE**: Gates closed, warnings on. Transitions to LEAVING on IR leaving sensor
  (and approach + inside sensors clear).
- **TRAIN_LEAVING**: Gates remain closed. Transitions to IDLE after 2s clear timeout.
- **FAULT**: Entered if gate fails to close within 7s of command. Gates stay closed,
  warnings stay on. Requires remote RESET_FAULT command.

## MQTT Topics

| Topic                    | Direction | Description                      |
|--------------------------|-----------|----------------------------------|
| `itcs/cu/telemetry`      | Publish   | Sensor/actuator state changes    |
| `itcs/cu/commands`       | Subscribe | Remote control commands          |
| `itcs/cu/state`          | Publish   | Full state snapshot (500ms)      |
| `itcs/cu/availability`   | Publish   | Birth (ONLINE) / last will (OFFLINE) |

### Commands (exact match)

- `RESET_FAULT` — Clear fault, return to IDLE
- `AUTO` — Restore automatic control
- `GATE_OPEN` — Force gates open (override, non-train only)
- `GATE_CLOSE` — Force gates closed (override, non-train only)
- `WARN_ON` — Force warnings on (override, non-train only)
- `WARN_OFF` — Force warnings off (override, non-train only)

## Build & Flash

```bash
pio run -t upload
pio device monitor -b 115200
```

## Configuration

Copy credentials from `include/secrets.h` — edit the `#define` values for
your WiFi SSID/password and MQTT broker. The file is in `.gitignore` and
will not be committed.

## Dependencies

| Library         | Version  | Source         |
|-----------------|----------|----------------|
| ESP32Servo      | ^3.2.0   | madhephaestus  |
| PubSubClient    | ^2.8     | knolleary      |
| ArduinoJson     | ^6.21.5  | bblanchon      |

## FreeRTOS Tasks

| Task            | Stack | Prio | Core | Period | Role                    |
|-----------------|-------|------|------|--------|-------------------------|
| sensorTask      | 4096  | 3    | 1    | 50ms   | Read sensors, debounce  |
| controlTask     | 4096  | 4    | 1    | 20ms   | State machine logic     |
| actuatorTask    | 4096  | 3    | 1    | 20ms   | Drive servos, lights    |
| mqttTask        | 6144  | 2    | 0    | 20ms   | WiFi, MQTT loop         |
| telemetryTask   | 6144  | 2    | 0    | 500ms  | Publish state changes   |
