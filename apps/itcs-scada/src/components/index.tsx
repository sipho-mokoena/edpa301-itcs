import {
  AddPanelOptions,
  DockviewApi,
  DockviewReact,
  DockviewReadyEvent,
  IDockviewPanelProps,
  PaneviewReact,
  PaneviewApi,
  PaneviewReadyEvent,
  IPaneviewPanelProps,
  themeDark,
  themeLight,
} from "dockview-react";
import { formatDateTimeZA } from "utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import PowerSourceScadaSceneSvg, { PowerPath } from "~/components/graphics/power-source-scene";
import LevelCrossingSceneSvg from "~/components/graphics/level-crossing-scene";
import { useTheme } from "~/providers/theme";
import { useScadaDataStore } from "~/stores/scada-data";
import { useScadaUiStore } from "~/stores/scada-ui";

type ScadaPanelParams = {
  kind: "status" | "scene" | "power" | "controls" | "camera";
};

type PanelConfig = AddPanelOptions<ScadaPanelParams> & { title: string };

type StatusPaneParams = {
  section: "sensors" | "actuators";
};

const PANEL_CONFIGS: PanelConfig[] = [
  {
    id: "scene-panel",
    title: "SITE01-ITCS-SCADA",
    component: "panel",
    params: { kind: "scene" },
  },
  {
    id: "status-panel",
    title: "SENSORS AND ACTUATORS",
    component: "panel",
    params: { kind: "status" },
    position: {
      direction: "right",
      referencePanel: "scene-panel",
    },
  },
  {
    id: "controls-panel",
    title: "MANUAL CONTROLS",
    component: "panel",
    params: { kind: "controls" },
    position: {
      direction: "below",
      referencePanel: "status-panel",
    },
  },
];

const CAMERA_PANEL_CONFIG: PanelConfig = {
  id: "camera-panel",
  title: "CAMERA FEED",
  component: "panel",
  params: { kind: "camera" },
  floating: {
    width: 480,
    height: 320,
    x: 658,
    y: 362,
  },
};

const POWER_PANEL_CONFIG: PanelConfig = {
  id: "power-panel",
  title: "POWER SUPPLY STATUS",
  component: "panel",
  params: { kind: "power" },
  floating: {
    width: 300,
    height: 300,
    x: 48,
    y: 59,
  },
  minimumWidth: 320,
};

const ALL_PANEL_CONFIGS = [...PANEL_CONFIGS, CAMERA_PANEL_CONFIG, POWER_PANEL_CONFIG];

function getToneBadgeVariant(tone: "ok" | "warn" | "danger" | "neutral") {
  if (tone === "ok") return "default" as const;
  if (tone === "warn") return "secondary" as const;
  if (tone === "danger") return "destructive" as const;
  return "outline" as const;
}

const StatusPane = (props: IPaneviewPanelProps<StatusPaneParams>) => {
  const selectedSiteId = useScadaDataStore((state) => state.selectedSiteId);
  const selectedProcessingUnitIds = useScadaDataStore((state) => state.selectedProcessingUnitIds);
  const selectedSensorIds = useScadaDataStore((state) => state.selectedSensorIds);
  const selectedActuatorIds = useScadaDataStore((state) => state.selectedActuatorIds);
  const sensors = useScadaDataStore((state) => state.sensors);
  const actuators = useScadaDataStore((state) => state.actuators);
  const isSensorPane = props.params.section === "sensors";
  const label = isSensorPane ? "sensor" : "actuator";

  const activeProcessingUnitIds = selectedProcessingUnitIds;

  const visibleSensors = sensors.filter(
    (sensor) =>
      activeProcessingUnitIds.includes(sensor.processingUnitId) &&
      selectedSensorIds.includes(sensor.id),
  );

  const visibleActuators = actuators.filter(
    (actuator) =>
      activeProcessingUnitIds.includes(actuator.processingUnitId) &&
      selectedActuatorIds.includes(actuator.id),
  );

  const hasRows = selectedSiteId
    ? isSensorPane
      ? visibleSensors.length > 0
      : visibleActuators.length > 0
    : false;

  if (!hasRows) {
    return (
      <div className="h-full w-full p-3 text-sm text-neutral-500 dark:text-neutral-400">
        {selectedSiteId ? `No ${label} status data` : "Select a site in Cloud Configuration"}
      </div>
    );
  }

  return (
    <Card className="m-2">
      <CardContent className="space-y-2">
        {isSensorPane
          ? visibleSensors.map((sensor) => (
              <div
                key={sensor.id}
                className="flex items-center justify-between gap-2 text-sm pb-2 border-b"
              >
                <span>{sensor.label}</span>
                <Badge variant={getToneBadgeVariant(sensor.tone)}>{sensor.status}</Badge>
              </div>
            ))
          : visibleActuators.map((actuator) => (
              <div
                key={actuator.id}
                className="flex items-center justify-between gap-2 text-sm pb-2 border-b"
              >
                <span>{actuator.label}</span>
                <Badge variant={getToneBadgeVariant(actuator.tone)}>{actuator.status}</Badge>
              </div>
            ))}
      </CardContent>
    </Card>
  );
};

const statusPaneComponents = {
  status: StatusPane,
};

const StatusPaneView = () => {
  const onPaneReady = useCallback((event: PaneviewReadyEvent) => {
    const paneApi: PaneviewApi = event.api;

    paneApi.addPanel({
      id: "sensor-status-pane",
      title: "SENSORS",
      component: "status",
      params: { section: "sensors" },
    });

    paneApi.addPanel({
      id: "actuator-status-pane",
      title: "ACTUATORS",
      component: "status",
      params: { section: "actuators" },
    });
  }, []);

  return (
    <PaneviewReact
      className="h-full w-full"
      onReady={onPaneReady}
      components={statusPaneComponents}
    />
  );
};

const Panel = (props: IDockviewPanelProps<ScadaPanelParams>) => {
  const kind = props.params.kind;
  const selectedSiteId = useScadaDataStore((state) => state.selectedSiteId);
  const selectedFeedId = useScadaDataStore((state) => state.selectedFeedId);
  const cameraFeeds = useScadaDataStore((state) => state.cameraFeeds);
  const powerUnits = useScadaDataStore((state) => state.powerUnits);
  const feed = cameraFeeds.find((cameraFeed) => cameraFeed.id === selectedFeedId) ?? null;
  const selectedPowerUnit = powerUnits.find((powerUnit) => powerUnit.siteId === selectedSiteId);
  const controls = useScadaDataStore((state) => state.controls);
  const { theme } = useTheme();
  const [cameraDateTime, setCameraDateTime] = useState(() => new Date());
  const [activePowerPath, setActivePowerPath] = useState<PowerPath>("mains");

  useEffect(() => {
    if (kind !== "camera") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCameraDateTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [kind]);

  useEffect(() => {
    if (kind !== "power") {
      return;
    }

    if (!selectedPowerUnit) {
      setActivePowerPath("mains");
      return;
    }

    if (selectedPowerUnit.relayPath === "mains") {
      setActivePowerPath("mains");
      return;
    }

    if (selectedPowerUnit.solarBatteryAvailable) {
      setActivePowerPath("solar");
      return;
    }

    setActivePowerPath("battery");
  }, [kind, selectedPowerUnit]);

  if (kind === "scene") {
    return (
      <div className="h-full w-full relative overflow-hidden">
        <LevelCrossingSceneSvg className="h-full w-full" />
      </div>
    );
  }

  if (kind === "camera") {
    if (!selectedSiteId || !feed) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-black text-neutral-400 text-sm">
          {!selectedSiteId ? "Select a site in Cloud Configuration" : "No camera signal"}
        </div>
      );
    }

    return (
      <div className="relative h-full w-full overflow-hidden bg-black text-neutral-100">
        <video
          key={feed.id}
          className="absolute inset-0 h-full w-full object-cover"
          src="/train-intersection-video.mp4"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-x-0 top-0 z-10 bg-black/55 p-3 text-xs uppercase tracking-wide text-neutral-200">
          {feed.label} ({feed.cameraName})
        </div>
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between bg-black/55 p-3 text-xs text-neutral-200">
          <span className={feed.online ? "text-emerald-400" : "text-rose-400"}>
            {feed.online ? "ONLINE" : "OFFLINE"}
          </span>
          <span>{formatDateTimeZA(cameraDateTime)}</span>
        </div>
      </div>
    );
  }

  if (kind === "status") {
    return <StatusPaneView />;
  }

  if (kind === "power") {
    if (!selectedSiteId || !selectedPowerUnit) {
      return (
        <div className="h-full w-full flex items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
          Select a site in Cloud Configuration
        </div>
      );
    }

    return (
      <div className="h-full w-full overflow-y-auto ">
        <div className="max-w-full m-2 p-2 border border-border bg-black/40 dark:bg-white/10">
          <PowerSourceScadaSceneSvg
            isDark={theme === "dark"}
            activePath={activePowerPath}
            className="h-full w-full"
          />
        </div>
        <Card className="m-2">
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span>Mains Supply</span>
              <Badge variant={selectedPowerUnit.mainsAvailable ? "default" : "outline"}>
                {selectedPowerUnit.mainsAvailable ? "AVAILABLE" : "UNAVAILABLE"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Solar Battery Pack</span>
              <Badge variant={selectedPowerUnit.solarBatteryAvailable ? "default" : "outline"}>
                {selectedPowerUnit.solarBatteryAvailable ? "AVAILABLE" : "UNAVAILABLE"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Relay Input</span>
              <Badge variant="secondary">
                {selectedPowerUnit.relayPath === "mains" ? "MAINS" : "SOLAR BATTERY"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (kind === "controls") {
    return (
      <div className="h-full w-full p-2 space-y-2">
        <Card>
          <CardContent className="space-y-2">
            {controls.map((control) => (
              <Button
                key={control.id}
                type="button"
                variant={
                  control.tone === "danger"
                    ? "destructive"
                    : control.tone === "neutral"
                      ? "outline"
                      : "default"
                }
                className="w-full"
              >
                {control.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <div className="h-full w-full"></div>;
};

const components = {
  panel: Panel,
};

const DEFAULT_LAYOUT = {
    "state": {
        "theme": "dark",
        "closedPanelIds": [
            "camera-panel",
            "power-panel"
        ],
        "dockviewLayout": {
            "grid": {
                "root": {
                    "type": "branch",
                    "data": [
                        {
                            "type": "leaf",
                            "data": {
                                "views": [
                                    "scene-panel"
                                ],
                                "activeView": "scene-panel",
                                "id": "1"
                            },
                            "size": 1320
                        },
                        {
                            "type": "branch",
                            "data": [
                                {
                                    "type": "leaf",
                                    "data": {
                                        "views": [
                                            "status-panel"
                                        ],
                                        "activeView": "status-panel",
                                        "id": "2"
                                    },
                                    "size": 445
                                },
                                {
                                    "type": "leaf",
                                    "data": {
                                        "views": [
                                            "controls-panel"
                                        ],
                                        "activeView": "controls-panel",
                                        "id": "3"
                                    },
                                    "size": 445
                                }
                            ],
                            "size": 529
                        }
                    ],
                    "size": 890
                },
                "width": 1849,
                "height": 890,
                "orientation": "HORIZONTAL"
            },
            "panels": {
                "scene-panel": {
                    "id": "scene-panel",
                    "contentComponent": "panel",
                    "params": {
                        "kind": "scene"
                    },
                    "title": "SITE01-ITCS-SCADA"
                },
                "status-panel": {
                    "id": "status-panel",
                    "contentComponent": "panel",
                    "params": {
                        "kind": "status"
                    },
                    "title": "SENSORS AND ACTUATORS"
                },
                "controls-panel": {
                    "id": "controls-panel",
                    "contentComponent": "panel",
                    "params": {
                        "kind": "controls"
                    },
                    "title": "MANUAL CONTROLS"
                }
            },
            "activeGroup": "2"
        }
    },
    "version": 0
};

export default function ScadaLayout() {
  const { theme } = useTheme();
  const dockviewTheme = theme === "dark" ? themeDark : themeLight;

  const [dockApi, setDockApi] = useState<DockviewApi | null>(null);
  const closedPanelIds = useScadaUiStore((state) => state.closedPanelIds);
  const closePanel = useScadaUiStore((state) => state.closePanel);
  const reopenClosedPanel = useScadaUiStore((state) => state.reopenPanel);
  const resetClosedPanels = useScadaUiStore((state) => state.resetClosedPanels);
  const dockviewLayout = useScadaUiStore((state) => state.dockviewLayout);
  const setDockviewLayout = useScadaUiStore((state) => state.setDockviewLayout);

  const pendingRemoval = useRef<Set<string>>(new Set());

  const persistDockviewLayout = useCallback(
    (api: DockviewApi) => {
      const serializableApi = api as unknown as { toJSON?: () => unknown };
      const nextLayout = serializableApi.toJSON?.() ?? null;
      setDockviewLayout(nextLayout);
    },
    [setDockviewLayout],
  );

  const onReady = useCallback(
    (event: DockviewReadyEvent) => {
      const api = event.api;
      setDockApi(api);

      const serializableApi = api as unknown as {
        fromJSON?: (layout: unknown) => void;
        onDidLayoutChange?: (listener: () => void) => void;
      };

      if (dockviewLayout && serializableApi.fromJSON) {
        serializableApi.fromJSON(dockviewLayout);
      } else {
        resetClosedPanels();
        serializableApi.fromJSON?.(DEFAULT_LAYOUT);
        persistDockviewLayout(api);
      }

      serializableApi.onDidLayoutChange?.(() => {
        persistDockviewLayout(api);
      });

      api.onDidRemovePanel((panel) => {
        pendingRemoval.current.add(panel.id);
        setTimeout(() => {
          if (pendingRemoval.current.has(panel.id)) {
            pendingRemoval.current.delete(panel.id);
            closePanel(panel.id);
            persistDockviewLayout(api);
          }
        }, 0);
      });

      api.onDidAddPanel((panel) => {
        if (pendingRemoval.current.has(panel.id)) {
          pendingRemoval.current.delete(panel.id);
        }

        persistDockviewLayout(api);
      });
    },
    [closePanel, dockviewLayout, persistDockviewLayout, resetClosedPanels],
  );

  const reopenPanel = useCallback(
    (id: string) => {
      if (!dockApi) return;

      const config = ALL_PANEL_CONFIGS.find((c) => c.id === id);
      if (!config) return;

      let resolvedConfig: PanelConfig = { ...config };
      if ("position" in config && config.position && "referencePanel" in config.position) {
        const refId = config.position.referencePanel as string;
        const refExists = dockApi.panels.some((p) => p.id === refId);
        if (!refExists) {
          const { position: _position, ...rest } = resolvedConfig as PanelConfig & {
            position: unknown;
          };
          resolvedConfig = rest as PanelConfig;
        }
      }

      dockApi.addPanel(resolvedConfig);
      reopenClosedPanel(id);
    },
    [dockApi, reopenClosedPanel],
  );

  const closedPanels = ALL_PANEL_CONFIGS.filter((c) => closedPanelIds.includes(c.id));

  return (
    <div className="h-full min-h-0 w-full relative">
      <DockviewReact
        theme={dockviewTheme}
        className="scada-dockview h-full w-full"
        onReady={onReady}
        components={components}
      />
      {closedPanels.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 flex flex-row border-t border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 z-50">
          {closedPanels.map((config) => (
            <button
              key={config.id}
              onClick={() => reopenPanel(config.id)}
              className="px-3 py-1 text-xs border-r border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
            >
              {config.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
