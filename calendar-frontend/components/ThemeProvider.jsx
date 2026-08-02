"use client";
import { useEffect } from "react";

/**
 * Applies the theme from appSettings to the <html> element.
 * - "dark"  → adds `.dark`
 * - "light" → removes `.dark`
 * - "system"/undefined → follows the OS prefers-color-scheme
 * Also listens for system changes while in "system" mode.
 */
export default function ThemeProvider({ appSettings = {} }) {
  useEffect(() => {
    const applyTheme = () => {
      const theme = appSettings.theme;
      const root = document.documentElement;

      if (theme === "dark") {
        root.classList.add("dark");
      } else if (theme === "light") {
        root.classList.remove("dark");
      } else {
        // Default: follow system preference
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };

    applyTheme();

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!appSettings.theme || appSettings.theme === "system") applyTheme();
    };
    mq.addEventListener?.("change", onChange);

    return () => mq.removeEventListener?.("change", onChange);
  }, [appSettings.theme]);

  return null;
}
