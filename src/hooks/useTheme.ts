"use client";

import { useThemeContext } from "@/context/ThemeContext";
import { startThemeTransition } from "@/lib/view-transition";

export function useTheme() {
  const { theme, resolvedTheme, setTheme, toggleTheme, isDark } =
    useThemeContext();

  function changeTheme(
    nextTheme: "light" | "dark" | "system",
    position?: { x: number; y: number },
  ) {
    startThemeTransition(() => {
      setTheme(nextTheme);
    }, position);
  }

  function toggleWithTransition(position?: { x: number; y: number }) {
    startThemeTransition(() => {
      toggleTheme(position);
    }, position);
  }

  return {
    theme,
    resolvedTheme,
    isDark,
    setTheme: changeTheme,
    toggleTheme: toggleWithTransition,
  };
}
