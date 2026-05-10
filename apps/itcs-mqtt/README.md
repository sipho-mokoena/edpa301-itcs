# ITCS MQTT (Aedes)

MQTT broker service for the monorepo using [Aedes](https://github.com/moscajs/aedes).

## Development

1. Build workspace packages:

```bash
vp run build
```

2. Start the MQTT broker in watch mode:

```bash
vp run itcs-mqtt#dev
```

## Environment

- `MQTT_HOST` (default: `0.0.0.0`)
- `MQTT_PORT` (default: `1883`)
