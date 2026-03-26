import { useEffect } from "react";
import useThemeStore from "./useThemeStore";

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    // Set the theme attribute on the document element
    document.documentElement.setAttribute("data-theme", theme);
    // Also set it on the body for backward compatibility
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setTheme(e.matches ? "dark" : "light");
      }
    };

    // Set initial theme based on system preference if not already set
    if (!localStorage.getItem("theme")) {
      setTheme(mediaQuery.matches ? "dark" : "light");
    }

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [setTheme]);

  return <>{children}</>;
}

export default ThemeProvider;
