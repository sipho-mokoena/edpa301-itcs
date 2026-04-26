import { useEffect, type ReactNode } from "react";
import { ScriptOnce } from "@tanstack/react-router";
import { THEME_STORAGE_KEY, useScadaUiStore } from "~/stores/scada-ui";

const themeScript = `(function() {
  try {
  var theme = localStorage.getItem('${THEME_STORAGE_KEY}');
    var resolved = theme === 'dark' ? 'dark' : 'light';
    var root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
  } catch (e) {
    document.documentElement.classList.add('light');
  }
})();`;

function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useScadaUiStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <>
      <ScriptOnce>{themeScript}</ScriptOnce>
      {children}
    </>
  );
}

export function useTheme() {
  const theme = useScadaUiStore((state) => state.theme);
  const setTheme = useScadaUiStore((state) => state.setTheme);
  return { theme, setTheme };
}

export default ThemeProvider;
