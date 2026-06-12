import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type StatusTone = "ok" | "warn" | "danger" | "neutral";

export type SensorStatus = {
  id: string;
  label: string;
  status: string;
  tone: StatusTone;
  updatedAt: string;
  processingUnitId: string;
};

export type ActuatorStatus = {
  id: string;
  label: string;
  status: string;
  tone: StatusTone;
  processingUnitId: string;
};

export type SiteSource = {
  id: string;
  label: string;
};

export type ProcessingUnitSource = {
  id: string;
  label: string;
  siteId: string;
  sensorIds: string[];
  actuatorIds: string[];
};

export type PowerUnitSource = {
  id: string;
  label: string;
  siteId: string;
  mainsAvailable: boolean;
  solarBatteryAvailable: boolean;
  relayPath: "mains" | "solar-battery";
};

export type PowerStatus = {
  mainPowerLabel: string;
  mainPowerStatus: string;
  mainPowerTone: StatusTone;
  backupBatteryLabel: string;
  backupBatteryStatus: string;
  backupBatteryTone: StatusTone;
  subsystems: string[];
};

export type CameraFeedStatus = {
  id: string;
  label: string;
  cameraName: string;
  siteId: string;
  endpointBaseUrl: string;
  online: boolean;
  lastHeartbeat: string;
};

export type CloudStatus = {
  apiConnection: string;
  apiConnectionTone: StatusTone;
  syncStatus: string;
  activeCommands: number;
  remoteOverride: string;
};

export type ControlAction = {
  id: string;
  label: string;
  tone: "primary" | "danger" | "neutral";
};

export type MqttConfig = {
  brokerUrl: string;
  clientId: string;
  telemetryTopic: string;
  commandTopic: string;
  stateTopic: string;
  availabilityTopic: string;
  ackTopic: string;
};

export type MqttFeedMessage = {
  id: string;
  topic: string;
  payload: string;
  receivedAt: string;
};

type ScadaDataState = {
  sites: SiteSource[];
  processingUnits: ProcessingUnitSource[];
  powerUnits: PowerUnitSource[];
  sensors: SensorStatus[];
  actuators: ActuatorStatus[];
  power: PowerStatus;
  cameraFeeds: CameraFeedStatus[];
  cloud: CloudStatus;
  controls: ControlAction[];
  mqtt: MqttConfig;
  mqttFeed: MqttFeedMessage[];
  selectedSiteId: string | null;
  selectedProcessingUnitIds: string[];
  selectedSensorIds: string[];
  selectedActuatorIds: string[];
  selectedFeedId: string | null;
  selectSite: (siteId: string | null) => void;
  toggleProcessingUnitSelection: (id: string) => void;
  toggleSensorSelection: (id: string) => void;
  toggleActuatorSelection: (id: string) => void;
  setSelectedFeedId: (id: string | null) => void;
  setSensorStatus: (id: string, updates: Partial<Omit<SensorStatus, "id">>) => void;
  setActuatorStatus: (id: string, updates: Partial<Omit<ActuatorStatus, "id">>) => void;
  setPowerStatus: (power: PowerStatus) => void;
  setCameraStatus: (id: string, updates: Partial<Omit<CameraFeedStatus, "id">>) => void;
  setCloudStatus: (updates: Partial<CloudStatus>) => void;
  setMqttConfig: (updates: Partial<MqttConfig>) => void;
  pushMqttFeedMessage: (message: Omit<MqttFeedMessage, "id" | "receivedAt">) => void;
  clearMqttFeed: () => void;
};

const now = () => new Date().toISOString();
const DATA_STORE_STORAGE_KEY = "scada-data-store-v2";
const MAX_MQTT_FEED_MESSAGES = 150;

export const useScadaDataStore = create<ScadaDataState>()(
  persist(
    (set) => ({
      sites: [
        {
          id: "DUT-ECE-ITCS-01",
          label: "DUT ECE ITCS Site 01",
        },
      ],
      processingUnits: [
        {
          id: "edge-unit-01",
          label: "Processing Unit 01",
          siteId: "DUT-ECE-ITCS-01",
          sensorIds: [
            "ir.train.approach",
            "ir.train.inside",
            "ir.train.leaving",
            "ldr.camera.night",
            "ultrasonic.south.vehicle",
            "ultrasonic.intersection.vehicle",
            "ultrasonic.north.vehicle",
          ],
          actuatorIds: [
            "warning.redLed",
            "warning.buzzer",
            "light.camera.night",
            "gate.servo.left",
            "gate.servo.right",
            "controller.fault",
          ],
        },
      ],
      powerUnits: [
        {
          id: "power-unit-main-relay",
          label: "Power Unit Main Relay",
          siteId: "DUT-ECE-ITCS-01",
          mainsAvailable: true,
          solarBatteryAvailable: true,
          relayPath: "mains",
        },
      ],
      sensors: [
        {
          id: "ir.train.approach",
          label: "IR Train Approach",
          status: "IDLE",
          tone: "ok",
          updatedAt: now(),
          processingUnitId: "edge-unit-01",
        },
        {
          id: "ir.train.inside",
          label: "IR Train Inside",
          status: "IDLE",
          tone: "ok",
          updatedAt: now(),
          processingUnitId: "edge-unit-01",
        },
        {
          id: "ir.train.leaving",
          label: "IR Train Leaving",
          status: "IDLE",
          tone: "ok",
          updatedAt: now(),
          processingUnitId: "edge-unit-01",
        },
        {
          id: "ldr.camera.night",
          label: "LDR Night Sensor",
          status: "IDLE",
          tone: "ok",
          updatedAt: now(),
          processingUnitId: "edge-unit-01",
        },
        {
          id: "ultrasonic.south.vehicle",
          label: "Ultrasonic South",
          status: "IDLE",
          tone: "ok",
          updatedAt: now(),
          processingUnitId: "edge-unit-01",
        },
        {
          id: "ultrasonic.intersection.vehicle",
          label: "Ultrasonic Intersection",
          status: "IDLE",
          tone: "ok",
          updatedAt: now(),
          processingUnitId: "edge-unit-01",
        },
        {
          id: "ultrasonic.north.vehicle",
          label: "Ultrasonic North",
          status: "IDLE",
          tone: "ok",
          updatedAt: now(),
          processingUnitId: "edge-unit-01",
        },
      ],
      actuators: [
        {
          id: "warning.redLed",
          label: "Red Warning LED",
          status: "IDLE",
          tone: "ok",
          processingUnitId: "edge-unit-01",
        },
        {
          id: "warning.buzzer",
          label: "Buzzer",
          status: "IDLE",
          tone: "ok",
          processingUnitId: "edge-unit-01",
        },
        {
          id: "light.camera.night",
          label: "Night Light",
          status: "IDLE",
          tone: "ok",
          processingUnitId: "edge-unit-01",
        },
        {
          id: "gate.servo.left",
          label: "Gate Servo Left",
          status: "OPEN",
          tone: "ok",
          processingUnitId: "edge-unit-01",
        },
        {
          id: "gate.servo.right",
          label: "Gate Servo Right",
          status: "OPEN",
          tone: "ok",
          processingUnitId: "edge-unit-01",
        },
        {
          id: "controller.fault",
          label: "Controller Fault",
          status: "ACTIVE",
          tone: "ok",
          processingUnitId: "edge-unit-01",
        },
      ],
      power: {
        mainPowerLabel: "Main Power (12V DC)",
        mainPowerStatus: "ACTIVE",
        mainPowerTone: "ok",
        backupBatteryLabel: "Backup Battery",
        backupBatteryStatus: "96% (Solar Charging)",
        backupBatteryTone: "ok",
        subsystems: ["Solar Panel", "Battery Pack", "Relay"],
      },
      cameraFeeds: [
        {
          id: "esp32-cam",
          label: "Live Camera Feed",
          cameraName: "CAM 1",
          siteId: "DUT-ECE-ITCS-01",
          endpointBaseUrl: "http://192.168.1.101",
          online: true,
          lastHeartbeat: now(),
        },
      ],
      cloud: {
        apiConnection: "SECURE",
        apiConnectionTone: "ok",
        syncStatus: "Last 3s",
        activeCommands: 0,
        remoteOverride: "INACTIVE",
      },
      controls: [
        {
          id: "reset-fault",
          label: "RESET FAULT",
          tone: "primary",
        },
        {
          id: "auto",
          label: "AUTO MODE",
          tone: "neutral",
        },
        {
          id: "gate-open",
          label: "GATE OPEN",
          tone: "primary",
        },
        {
          id: "gate-close",
          label: "GATE CLOSE",
          tone: "neutral",
        },
        {
          id: "warn-on",
          label: "WARNINGS ON",
          tone: "danger",
        },
        {
          id: "warn-off",
          label: "WARNINGS OFF",
          tone: "neutral",
        },
      ],
      mqtt: {
        brokerUrl: "ws://localhost:8888",
        clientId: `itcs-scada-${Math.random().toString(16).slice(2, 10)}`,
        telemetryTopic: "itcs/cu/telemetry",
        commandTopic: "itcs/cu/commands",
        stateTopic: "itcs/cu/state",
        availabilityTopic: "itcs/cu/availability",
        ackTopic: "itcs/cu/ack",
      },
      mqttFeed: [],
      selectedSiteId: "DUT-ECE-ITCS-01",
      selectedProcessingUnitIds: ["edge-unit-01"],
      selectedSensorIds: [
        "ir.train.approach",
        "ir.train.inside",
        "ir.train.leaving",
        "ldr.camera.night",
        "ultrasonic.south.vehicle",
        "ultrasonic.intersection.vehicle",
        "ultrasonic.north.vehicle",
      ],
      selectedActuatorIds: [
        "warning.redLed",
        "warning.buzzer",
        "light.camera.night",
        "gate.servo.left",
        "gate.servo.right",
        "controller.fault",
      ],
      selectedFeedId: "esp32-cam",
      selectSite: (siteId) => {
        set((state) => {
          if (state.selectedSiteId === siteId) {
            return state;
          }

          if (!siteId) {
            return {
              selectedSiteId: null,
              selectedProcessingUnitIds: [],
              selectedSensorIds: [],
              selectedActuatorIds: [],
              selectedFeedId: null,
            };
          }

          const defaultFeedId =
            state.cameraFeeds.find((feed) => feed.siteId === siteId)?.id ?? null;

          return {
            selectedSiteId: siteId,
            selectedProcessingUnitIds: [],
            selectedSensorIds: [],
            selectedActuatorIds: [],
            selectedFeedId: defaultFeedId,
          };
        });
      },
      toggleProcessingUnitSelection: (id) => {
        set((state) => {
          if (!state.selectedSiteId) {
            return state;
          }

          const isSelected = state.selectedProcessingUnitIds.includes(id);
          const nextProcessingUnitIds = isSelected
            ? state.selectedProcessingUnitIds.filter((processingUnitId) => processingUnitId !== id)
            : [...state.selectedProcessingUnitIds, id];

          const allowedSensorIds = new Set(
            state.processingUnits
              .filter((processingUnit) => nextProcessingUnitIds.includes(processingUnit.id))
              .flatMap((processingUnit) => processingUnit.sensorIds),
          );

          const allowedActuatorIds = new Set(
            state.processingUnits
              .filter((processingUnit) => nextProcessingUnitIds.includes(processingUnit.id))
              .flatMap((processingUnit) => processingUnit.actuatorIds),
          );

          return {
            selectedProcessingUnitIds: nextProcessingUnitIds,
            selectedSensorIds: state.selectedSensorIds.filter((sensorId) =>
              allowedSensorIds.has(sensorId),
            ),
            selectedActuatorIds: state.selectedActuatorIds.filter((actuatorId) =>
              allowedActuatorIds.has(actuatorId),
            ),
          };
        });
      },
      toggleSensorSelection: (id) => {
        set((state) => {
          if (!state.selectedSiteId) {
            return state;
          }

          const allowedSensorIds = new Set(
            state.processingUnits
              .filter((processingUnit) =>
                state.selectedProcessingUnitIds.includes(processingUnit.id),
              )
              .flatMap((processingUnit) => processingUnit.sensorIds),
          );

          if (!allowedSensorIds.has(id)) {
            return state;
          }

          return {
            selectedSensorIds: state.selectedSensorIds.includes(id)
              ? state.selectedSensorIds.filter((sensorId) => sensorId !== id)
              : [...state.selectedSensorIds, id],
          };
        });
      },
      toggleActuatorSelection: (id) => {
        set((state) => {
          if (!state.selectedSiteId) {
            return state;
          }

          const allowedActuatorIds = new Set(
            state.processingUnits
              .filter((processingUnit) =>
                state.selectedProcessingUnitIds.includes(processingUnit.id),
              )
              .flatMap((processingUnit) => processingUnit.actuatorIds),
          );

          if (!allowedActuatorIds.has(id)) {
            return state;
          }

          return {
            selectedActuatorIds: state.selectedActuatorIds.includes(id)
              ? state.selectedActuatorIds.filter((actuatorId) => actuatorId !== id)
              : [...state.selectedActuatorIds, id],
          };
        });
      },
      setSelectedFeedId: (id) => {
        set((state) => {
          if (!state.selectedSiteId) {
            return state;
          }

          if (!id) {
            return { selectedFeedId: null };
          }

          const selectedFeed = state.cameraFeeds.find((feed) => feed.id === id);
          if (!selectedFeed || selectedFeed.siteId !== state.selectedSiteId) {
            return state;
          }

          return { selectedFeedId: id };
        });
      },
      setSensorStatus: (id, updates) => {
        set((state) => ({
          sensors: state.sensors.map((sensor) =>
            sensor.id === id
              ? {
                  ...sensor,
                  ...updates,
                  updatedAt: now(),
                }
              : sensor,
          ),
        }));
      },
      setActuatorStatus: (id, updates) => {
        set((state) => ({
          actuators: state.actuators.map((actuator) =>
            actuator.id === id
              ? {
                  ...actuator,
                  ...updates,
                }
              : actuator,
          ),
        }));
      },
      setPowerStatus: (power) => {
        set({ power });
      },
      setCameraStatus: (id, updates) => {
        set((state) => ({
          cameraFeeds: state.cameraFeeds.map((feed) =>
            feed.id === id
              ? {
                  ...feed,
                  ...updates,
                }
              : feed,
          ),
        }));
      },
      setCloudStatus: (updates) => {
        set((state) => ({
          cloud: {
            ...state.cloud,
            ...updates,
          },
        }));
      },
      setMqttConfig: (updates) => {
        set((state) => ({
          mqtt: {
            ...state.mqtt,
            ...updates,
          },
        }));
      },
      pushMqttFeedMessage: (message) => {
        set((state) => {
          const nextMessage: MqttFeedMessage = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
            topic: message.topic,
            payload: message.payload,
            receivedAt: now(),
          };

          const nextFeed = [nextMessage, ...state.mqttFeed];
          if (nextFeed.length > MAX_MQTT_FEED_MESSAGES) {
            nextFeed.length = MAX_MQTT_FEED_MESSAGES;
          }

          return { mqttFeed: nextFeed };
        });
      },
      clearMqttFeed: () => {
        set({ mqttFeed: [] });
      },
    }),
    {
      name: DATA_STORE_STORAGE_KEY,
      storage:
        typeof window === "undefined" ? undefined : createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        sites: state.sites,
        processingUnits: state.processingUnits,
        powerUnits: state.powerUnits,
        sensors: state.sensors,
        actuators: state.actuators,
        power: state.power,
        cameraFeeds: state.cameraFeeds,
        cloud: state.cloud,
        controls: state.controls,
        mqtt: state.mqtt,
        mqttFeed: state.mqttFeed,
      }),
    },
  ),
);
