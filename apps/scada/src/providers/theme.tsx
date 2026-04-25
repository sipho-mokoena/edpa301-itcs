import { ScriptOnce } from '@tanstack/react-router'

const themeScript = `(function() {
  try {
    const theme = localStorage.getItem('theme') || 'auto';
    const resolved = theme === 'auto'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.classList.add(resolved);
  } catch (e) {}
})();`

function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScriptOnce children={themeScript} />
      {children}
    </>
  )
}

export default ThemeProvider