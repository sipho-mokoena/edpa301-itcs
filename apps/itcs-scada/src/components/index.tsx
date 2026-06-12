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

import DigitalTwinSceneSvg from "~/components/graphics/new-digital-twin";
import { useTheme } from "~/providers/theme";
import { useScadaDataStore } from "~/stores/scada-data";
import { useScadaUiStore } from "~/stores/scada-ui";
import { publishCommand } from "~/lib/mqtt-client";

type ScadaPanelParams = {
  kind: "status" | "scene" | "controls" | "camera" | "telementry";
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
  {
    id: "telementry-panel",
    title: "TELEMENTRY FEED",
    component: "panel",
    params: { kind: "telementry" },
    position: {
      direction: "below",
      referencePanel: "controls-panel",
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

const ALL_PANEL_CONFIGS = [...PANEL_CONFIGS, CAMERA_PANEL_CONFIG];

function getToneBadgeVariant(tone: "ok" | "warn" | "danger" | "neutral") {
  if (tone === "ok") return "default" as const;
  if (tone === "warn") return "secondary" as const;
  if (tone === "danger") return "destructive" as const;
  return "outline" as const;
}

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
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
  const feed = cameraFeeds.find((cameraFeed) => cameraFeed.id === selectedFeedId) ?? null;
  const controls = useScadaDataStore((state) => state.controls);
  const cloud = useScadaDataStore((state) => state.cloud);
  const mqttFeed = useScadaDataStore((state) => state.mqttFeed);
  const clearMqttFeed = useScadaDataStore((state) => state.clearMqttFeed);
  const [cameraDateTime, setCameraDateTime] = useState(() => new Date());

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

  if (kind === "scene") {
    return (
      <div className="h-full w-full relative overflow-hidden">
        <DigitalTwinSceneSvg className="h-full w-full" />
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

    const endpointBaseUrl = normalizeBaseUrl(feed.endpointBaseUrl ?? "");
    const streamUrl = endpointBaseUrl ? `${endpointBaseUrl}/stream` : "";
    const captureUrl = endpointBaseUrl ? `${endpointBaseUrl}/capture` : "";
    const isConfigured = endpointBaseUrl.length > 0;

    return (
      <div className="relative h-full w-full overflow-hidden bg-black text-neutral-100">
        {isConfigured ? (
          <img
            key={`${feed.id}-${streamUrl}`}
            className="absolute inset-0 h-full w-full object-cover"
            src={streamUrl}
            alt={`${feed.cameraName} live stream`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-400">
            Configure camera endpoint in Cloud Configuration.
          </div>
        )}
        <div className="absolute inset-x-0 top-0 z-10 bg-black/55 p-3 text-xs uppercase tracking-wide text-neutral-200">
          {feed.label} ({feed.cameraName})
        </div>
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-2 bg-black/55 p-3 text-xs text-neutral-200">
          <span className={isConfigured ? "text-emerald-400" : "text-rose-400"}>
            {isConfigured ? "ENDPOINT CONFIGURED" : "NO ENDPOINT"}
          </span>
          <div className="flex items-center gap-2">
            {captureUrl && (
              <a
                href={captureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-neutral-500 px-2 py-1 hover:bg-white/10"
              >
                Capture JPG
              </a>
            )}
            <span>{formatDateTimeZA(cameraDateTime)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (kind === "status") {
    return <StatusPaneView />;
  }

  if (kind === "controls") {
    const commandMap: Record<string, string> = {
      "reset-fault": "RESET_FAULT",
      auto: "AUTO",
      "gate-open": "GATE_OPEN",
      "gate-close": "GATE_CLOSE",
      "warn-on": "WARN_ON",
      "warn-off": "WARN_OFF",
    };

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
                onClick={() => publishCommand(commandMap[control.id] ?? control.id)}
              >
                {control.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (kind === "telementry") {
    return (
      <div className="h-full w-full p-2">
        <Card className="h-full border border-border/80 bg-card/90">
          <CardContent className="flex h-full min-h-0 flex-col gap-3">
            <div className="flex flex-col gap-2 border-b border-border/80 pb-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">MQTT Message Monitor</p>
                <p className="text-xs text-muted-foreground">
                  {mqttFeed.length} buffered message{mqttFeed.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={getToneBadgeVariant(cloud.apiConnectionTone)}>
                  {cloud.apiConnection}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => clearMqttFeed()}
                  disabled={mqttFeed.length === 0}
                >
                  Clear
                </Button>
              </div>
            </div>

            {mqttFeed.length === 0 ? (
              <div className="flex min-h-0 flex-1 items-center rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                Waiting for incoming ESP32 MQTT messages.
              </div>
            ) : (
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {mqttFeed.map((message) => (
                  <div key={message.id} className="rounded-md border border-border p-2 text-xs">
                    <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <Badge variant="outline" className="max-w-full sm:max-w-[70%] truncate">
                        {message.topic}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(message.receivedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded bg-muted/40 p-2 font-mono text-[11px] leading-relaxed">
                      {message.payload}
                    </pre>
                  </div>
                ))}
              </div>
            )}
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
  state: {
    theme: "dark",
    closedPanelIds: ["camera-panel"],
    dockviewLayout: {
      grid: {
        root: {
          type: "branch",
          data: [
            {
              type: "leaf",
              data: {
                views: ["scene-panel"],
                activeView: "scene-panel",
                id: "1",
              },
              size: 1320,
            },
            {
              type: "branch",
              data: [
                {
                  type: "leaf",
                  data: {
                    views: ["status-panel"],
                    activeView: "status-panel",
                    id: "2",
                  },
                  size: 445,
                },
                {
                  type: "leaf",
                  data: {
                    views: ["controls-panel"],
                    activeView: "controls-panel",
                    id: "3",
                  },
                  size: 445,
                },
              ],
              size: 529,
            },
          ],
          size: 890,
        },
        width: 1849,
        height: 890,
        orientation: "HORIZONTAL",
      },
      panels: {
        "scene-panel": {
          id: "scene-panel",
          contentComponent: "panel",
          params: {
            kind: "scene",
          },
          title: "SITE01-ITCS-SCADA",
        },
        "status-panel": {
          id: "status-panel",
          contentComponent: "panel",
          params: {
            kind: "status",
          },
          title: "SENSORS AND ACTUATORS",
        },
        "controls-panel": {
          id: "controls-panel",
          contentComponent: "panel",
          params: {
            kind: "controls",
          },
          title: "MANUAL CONTROLS",
        },
      },
      activeGroup: "2",
    },
  },
  version: 0,
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
        DEFAULT_LAYOUT.state.closedPanelIds.forEach((id) => closePanel(id));
        serializableApi.fromJSON?.(DEFAULT_LAYOUT.state.dockviewLayout);
        persistDockviewLayout(api);
      }

      PANEL_CONFIGS.forEach((config) => {
        const panelExists = api.panels.some((panel) => panel.id === config.id);
        if (!panelExists) {
          api.addPanel(config);
        }
      });

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
