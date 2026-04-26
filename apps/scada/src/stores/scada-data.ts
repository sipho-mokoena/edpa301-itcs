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
};

const now = () => new Date().toISOString();
const DATA_STORE_STORAGE_KEY = "scada-data-store";

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
            "inductive-sensor-1",
            "momentary-switch-1",
            "momentary-switch-2",
            "inductive-sensor-a",
            "inductive-sensor-2",
            "ultrasonic-sensor-1-detect",
            "ultrasonic-sensor-1-barrier",
            "ultrasonic-sensor-2",
          ],
          actuatorIds: [
            "actuator-momentary-switch-1",
            "servo-motor-1",
            "servo-motor-2",
            "leds",
            "buzzer-1",
            "buzzer-2",
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
          id: "inductive-sensor-1",
          label: "Inductive Sensor 1",
          status: "TRAIN DETECTED",
          tone: "ok",
          updatedAt: now(),
          processingUnitId: "edge-unit-01",
        },
        {
          id: "momentary-switch-1",
          label: "Momentary Switch 1",
          status: "BARRIER DOWN YES",
          tone: "warn",
          updatedAt: now(),
          processingUnitId: "edge-unit-01",
        },
        {
          id: "momentary-switch-2",
          label: "Momentary Switch 2",
          status: "BARRIER DOWN YES",
          tone: "warn",
          updatedAt: now(),
          processingUnitId: "edge-unit-01",
        },
        {
          id: "inductive-sensor-a",
          label: "Inductive Sensor 1",
          status: "YES",
          tone: "warn",
          updatedAt: now(),
          processingUnitId: "edge-unit-01",
        },
        {
          id: "inductive-sensor-2",
          label: "Inductive Sensor 2",
          status: "YES",
          tone: "warn",
          updatedAt: now(),
          processingUnitId: "edge-unit-01",
        },
        {
          id: "ultrasonic-sensor-1-detect",
          label: "Ultrasonic Sensor 1",
          status: "TRAIN DETECTED",
          tone: "ok",
          updatedAt: now(),
          processingUnitId: "edge-unit-01",
        },
        {
          id: "ultrasonic-sensor-1-barrier",
          label: "Ultrasonic Sensor 1",
          status: "BARRIER DOWN",
          tone: "warn",
          updatedAt: now(),
          processingUnitId: "edge-unit-01",
        },
        {
          id: "ultrasonic-sensor-2",
          label: "Ultrasonic Sensor 2",
          status: "ACTIVE",
          tone: "ok",
          updatedAt: now(),
          processingUnitId: "edge-unit-01",
        },
      ],
      actuators: [
        {
          id: "actuator-momentary-switch-1",
          label: "Momentary Switch 1",
          status: "YES",
          tone: "ok",
          processingUnitId: "edge-unit-01",
        },
        {
          id: "servo-motor-1",
          label: "Servo Motor 1",
          status: "90° (Closed)",
          tone: "ok",
          processingUnitId: "edge-unit-01",
        },
        {
          id: "servo-motor-2",
          label: "Servo Motor 2",
          status: "90° (Closed)",
          tone: "ok",
          processingUnitId: "edge-unit-01",
        },
        {
          id: "leds",
          label: "LEDs",
          status: "Flashing RED",
          tone: "danger",
          processingUnitId: "edge-unit-01",
        },
        {
          id: "buzzer-1",
          label: "Buzzer",
          status: "ACTIVE",
          tone: "ok",
          processingUnitId: "edge-unit-01",
        },
        {
          id: "buzzer-2",
          label: "Buzzer",
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
          id: "emergency-stop",
          label: "EMERGENCY STOP",
          tone: "danger",
        },
        {
          id: "manual-open",
          label: "Manual Open Barriers",
          tone: "primary",
        },
        {
          id: "manual-close",
          label: "Manual Close Barriers",
          tone: "neutral",
        },
      ],
      selectedSiteId: null,
      selectedProcessingUnitIds: [],
      selectedSensorIds: [],
      selectedActuatorIds: [],
      selectedFeedId: null,
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
        selectedSiteId: state.selectedSiteId,
        selectedProcessingUnitIds: state.selectedProcessingUnitIds,
        selectedSensorIds: state.selectedSensorIds,
        selectedActuatorIds: state.selectedActuatorIds,
        selectedFeedId: state.selectedFeedId,
      }),
    },
  ),
);
