"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useTheme as useNextTheme } from "next-themes";
import { useProfileContext } from "./ProfileContext";

export interface ThemeContextValue {
  // Dark/light theme
  theme: string | undefined;
  resolvedTheme: "light" | "dark" | undefined;
  isDark: boolean;
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleTheme: (position?: { x: number; y: number }) => void;

  // Custom colors
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  setColors: (colors: {
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
  }) => void;
  resetColors: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfileContext();
  const { theme, resolvedTheme, setTheme: setNextTheme } = useNextTheme();

  const hexToHsl = useCallback((hex: string | null): string => {
    if (!hex) return "";

    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }, []);

  const applyColors = useCallback(
    (colors: {
      primaryColor?: string | null;
      secondaryColor?: string | null;
      accentColor?: string | null;
    }) => {
      const root = document.documentElement;

      if (colors.primaryColor !== undefined) {
        if (colors.primaryColor) {
          const hsl = hexToHsl(colors.primaryColor);
          root.style.setProperty("--primary", hsl);
          root.style.setProperty("--ring", hsl);
        } else {
          root.style.removeProperty("--primary");
          root.style.removeProperty("--ring");
        }
      }

      if (colors.secondaryColor !== undefined) {
        if (colors.secondaryColor) {
          const hsl = hexToHsl(colors.secondaryColor);
          root.style.setProperty("--secondary", hsl);
        } else {
          root.style.removeProperty("--secondary");
        }
      }

      if (colors.accentColor !== undefined) {
        if (colors.accentColor) {
          const hsl = hexToHsl(colors.accentColor);
          root.style.setProperty("--accent", hsl);
        } else {
          root.style.removeProperty("--accent");
        }
      }
    },
    [hexToHsl],
  );

  const resetColors = useCallback(() => {
    const root = document.documentElement;
    root.style.removeProperty("--primary");
    root.style.removeProperty("--secondary");
    root.style.removeProperty("--accent");
    root.style.removeProperty("--ring");
  }, []);

  // Apply colors from profile on mount and when profile changes
  useEffect(() => {
    if (profile) {
      applyColors({
        primaryColor: profile.primaryColor,
        secondaryColor: profile.secondaryColor,
        accentColor: profile.accentColor,
      });
    } else {
      resetColors();
    }
  }, [profile, applyColors, resetColors]);

  const setTheme = useCallback(
    (newTheme: "light" | "dark" | "system") => {
      setNextTheme(newTheme);
    },
    [setNextTheme],
  );

  const toggleTheme = useCallback(
    (position?: { x: number; y: number }) => {
      const newTheme = resolvedTheme === "dark" ? "light" : "dark";
      setNextTheme(newTheme);
    },
    [resolvedTheme, setNextTheme],
  );

  const setColors = useCallback(
    (colors: {
      primaryColor?: string | null;
      secondaryColor?: string | null;
      accentColor?: string | null;
    }) => {
      applyColors(colors);
    },
    [applyColors],
  );

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme: resolvedTheme as "light" | "dark" | undefined,
      isDark: resolvedTheme === "dark",
      setTheme,
      toggleTheme,
      primaryColor: profile?.primaryColor || null,
      secondaryColor: profile?.secondaryColor || null,
      accentColor: profile?.accentColor || null,
      setColors,
      resetColors,
    }),
    [
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      profile,
      setColors,
      resetColors,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }

  return context;
}
