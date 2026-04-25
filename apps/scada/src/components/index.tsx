import {
  AddPanelOptions,
  DockviewApi,
  DockviewReact,
  DockviewReadyEvent,
  IDockviewPanelProps,
  themeDark,
  themeLight,
} from "dockview-react";
import { useCallback, useRef, useState } from "react";
import { useTheme } from "~/providers/theme";

type ScadaPanelParams = {
  kind: "status" | "scene" | "power" | "controls" | "camera";
};

type PanelConfig = AddPanelOptions<ScadaPanelParams> & { title: string };

const PANEL_CONFIGS: PanelConfig[] = [
  {
    id: "status-panel",
    title: "Main Control Unit Status",
    component: "panel",
    params: { kind: "status" },
    minimumWidth: 320,
  },
  {
    id: "scene-panel",
    title: "DUT-EDPA301-ITCS-SCADA",
    component: "panel",
    params: { kind: "scene" },
    position: {
      direction: "right",
      referencePanel: "status-panel",
    },
  },
  {
    id: "power-panel",
    title: "Power Supply Status",
    component: "panel",
    params: { kind: "power" },
    position: {
      direction: "right",
      referencePanel: "scene-panel",
    },
    minimumWidth: 320,
  },
  {
    id: "controls-panel",
    title: "System Cores and Controls",
    component: "panel",
    params: { kind: "controls" },
    position: {
      direction: "below",
      referencePanel: "power-panel",
    },
  },
];

const CAMERA_PANEL_CONFIG: PanelConfig = {
  id: "camera-panel",
  title: "Camera Feed",
  component: "panel",
  params: { kind: "camera" },
  floating: {
    width: 480,
    height: 320,
    x: 80,
    y: 80,
  },
};

const ALL_PANEL_CONFIGS = [...PANEL_CONFIGS, CAMERA_PANEL_CONFIG];

const Panel = (props: IDockviewPanelProps<ScadaPanelParams>) => {
  const kind = props.params.kind;

  if (kind === "scene") {
    return (
      <div className="h-full w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 h-screen w-screen flex items-center justify-center bg-linear-to-br from-green-800 to-green-600" />
      </div>
    );
  }

  if (kind === "camera") {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black text-neutral-400 text-sm">
        No camera signal
      </div>
    );
  }

  if (kind === "status") {
    return <div className="h-full w-full"></div>;
  }

  if (kind === "power") {
    return <div className="h-full w-full"></div>;
  }

  return <div className="h-full w-full"></div>;
};

const components = {
  panel: Panel,
};

export default function ScadaLayout() {
  const { theme } = useTheme();
  const dockviewTheme = theme === "dark" ? themeDark : themeLight;

  const [dockApi, setDockApi] = useState<DockviewApi | null>(null);
  const [closedPanelIds, setClosedPanelIds] = useState<Set<string>>(new Set());

  const pendingRemoval = useRef<Set<string>>(new Set());

  const onReady = useCallback((event: DockviewReadyEvent) => {
    const api = event.api;
    setDockApi(api);

    for (const config of PANEL_CONFIGS) {
      api.addPanel(config);
    }

    api.addPanel(CAMERA_PANEL_CONFIG);

    api.onDidRemovePanel((panel) => {
      pendingRemoval.current.add(panel.id);
      setTimeout(() => {
        if (pendingRemoval.current.has(panel.id)) {
          pendingRemoval.current.delete(panel.id);
          setClosedPanelIds((prev) => new Set([...prev, panel.id]));
        }
      }, 0);
    });

    api.onDidAddPanel((panel) => {
      if (pendingRemoval.current.has(panel.id)) {
        pendingRemoval.current.delete(panel.id);
      }
    });
  }, []);

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
      setClosedPanelIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [dockApi],
  );

  const closedPanels = ALL_PANEL_CONFIGS.filter((c) => closedPanelIds.has(c.id));

  return (
    <div className="h-full min-h-0 w-full relative">
      <DockviewReact
        theme={dockviewTheme}
        className="h-full w-full"
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
