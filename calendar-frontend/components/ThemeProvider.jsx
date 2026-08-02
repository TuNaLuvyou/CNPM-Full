"use client";
import { useEffect } from "react";

/**
 * Ensures light mode is always applied by removing any `dark` class from <html>.
 */
export default function ThemeProvider() {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return null;
}

