"use client";
import { useEffect } from "react";

/**
 * Reads `appSettings.theme` ("light" | "dark" | "system") and
 * toggles the `dark` class on <html> so Tailwind dark: variants work.
 */
export default function ThemeProvider({ appSettings }) {
  useEffect(() => {
    const theme = appSettings?.theme || "light";
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // "system"
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  }, [appSettings?.theme]);

  return null;
}
