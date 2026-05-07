/**
 * Theme palettes + a hook that follows the user's preference (system /
 * dark / light). Tailwind classes use CSS variables set via NativeWind's
 * `vars()`; raw hex codes for navigation chrome / icons are read through
 * `useThemeColors()`.
 */

import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { vars } from "nativewind";
import {
  getCachedPreferences,
  loadPreferences,
  subscribePreferences,
  type Preferences,
} from "./preferences";

export type ThemeName = "dark" | "light";

export type ThemeColors = {
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  /** Brand colors are theme-agnostic but exposed here for convenience. */
  accentEn: string;
  accentDe: string;
  accentEs: string;
  success: string;
  warning: string;
  error: string;
};

const HEX = {
  dark: {
    bg: "#0b1220",
    surface: "#111a2e",
    border: "#1f2a44",
    text: "#e6ecf5",
    muted: "#8aa0c2",
  },
  light: {
    bg: "#f7f9fc",
    surface: "#ffffff",
    border: "#d2dceb",
    text: "#121826",
    muted: "#69738a",
  },
} as const;

const COMMON = {
  accentEn: "#3b82f6",
  accentDe: "#f59e0b",
  accentEs: "#ef4444",
  success: "#22c55e",
  warning: "#eab308",
  error: "#f43f5e",
};

export const COLORS: Record<ThemeName, ThemeColors> = {
  dark: { ...HEX.dark, ...COMMON },
  light: { ...HEX.light, ...COMMON },
};

const RGB = {
  dark: {
    "--color-bg": "11 18 32",
    "--color-surface": "17 26 46",
    "--color-border": "31 42 68",
    "--color-text": "230 236 245",
    "--color-muted": "138 160 194",
  },
  light: {
    "--color-bg": "247 249 252",
    "--color-surface": "255 255 255",
    "--color-border": "210 220 235",
    "--color-text": "18 24 38",
    "--color-muted": "105 115 138",
  },
};

export const THEME_VARS: Record<ThemeName, ReturnType<typeof vars>> = {
  dark: vars(RGB.dark),
  light: vars(RGB.light),
};

export function resolveTheme(prefs: Preferences, systemScheme: "light" | "dark" | null | undefined): ThemeName {
  if (prefs.theme === "dark") return "dark";
  if (prefs.theme === "light") return "light";
  return systemScheme === "light" ? "light" : "dark";
}

/** Returns the active theme name + color tokens. Subscribes to prefs + system. */
export function useTheme(): { name: ThemeName; colors: ThemeColors } {
  const system = useColorScheme();
  const [prefs, setPrefs] = useState<Preferences>(getCachedPreferences());

  useEffect(() => {
    void loadPreferences().then(setPrefs);
    const unsub = subscribePreferences(setPrefs);
    return () => {
      unsub();
    };
  }, []);

  const name = resolveTheme(prefs, system);
  return { name, colors: COLORS[name] };
}
