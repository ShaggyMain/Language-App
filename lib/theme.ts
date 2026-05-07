/**
 * Theme tokens. Light theme is parked behind a settings flag for now;
 * making it production-grade required reworking every NativeWind class
 * in the app, which broke the web bundle. Until we ship a proper
 * dark-mode-class-toggle plumbing through tailwind, theme is dark.
 */

export type ThemeName = "dark";

export type ThemeColors = {
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accentEn: string;
  accentDe: string;
  accentEs: string;
  success: string;
  warning: string;
  error: string;
};

export const COLORS: Record<ThemeName, ThemeColors> = {
  dark: {
    bg: "#0b1220",
    surface: "#111a2e",
    border: "#1f2a44",
    text: "#e6ecf5",
    muted: "#8aa0c2",
    accentEn: "#3b82f6",
    accentDe: "#f59e0b",
    accentEs: "#ef4444",
    success: "#22c55e",
    warning: "#eab308",
    error: "#f43f5e",
  },
};

export function useTheme(): { name: ThemeName; colors: ThemeColors } {
  return { name: "dark", colors: COLORS.dark };
}
