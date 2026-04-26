import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type Theme = "light" | "dark";

type ScadaUiState = {
  theme: Theme;
  closedPanelIds: string[];
  dockviewLayout: unknown | null;
  setTheme: (theme: Theme) => void;
  closePanel: (panelId: string) => void;
  reopenPanel: (panelId: string) => void;
  resetClosedPanels: () => void;
  setDockviewLayout: (layout: unknown | null) => void;
};

const STORAGE_KEY = "theme";
const UI_STORE_STORAGE_KEY = "scada-ui-store";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY);
  return storedTheme === "dark" ? "dark" : "light";
}

export const useScadaUiStore = create<ScadaUiState>()(
  persist(
    (set) => ({
      theme: getInitialTheme(),
      closedPanelIds: [],
      dockviewLayout: null,
      setTheme: (theme) => {
        set({ theme });
      },
      closePanel: (panelId) => {
        set((state) => {
          if (state.closedPanelIds.includes(panelId)) {
            return state;
          }

          return {
            closedPanelIds: [...state.closedPanelIds, panelId],
          };
        });
      },
      reopenPanel: (panelId) => {
        set((state) => ({
          closedPanelIds: state.closedPanelIds.filter((id) => id !== panelId),
        }));
      },
      resetClosedPanels: () => {
        set({ closedPanelIds: [] });
      },
      setDockviewLayout: (layout) => {
        set({ dockviewLayout: layout });
      },
    }),
    {
      name: UI_STORE_STORAGE_KEY,
      storage:
        typeof window === "undefined" ? undefined : createJSONStorage(() => window.localStorage),
      partialize: (state) => ({
        theme: state.theme,
        closedPanelIds: state.closedPanelIds,
        dockviewLayout: state.dockviewLayout,
      }),
    },
  ),
);

export { STORAGE_KEY as THEME_STORAGE_KEY };
