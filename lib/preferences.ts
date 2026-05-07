/**
 * AsyncStorage-backed user preferences. Synchronously cached after first
 * read so React components can render preferences without flashing a
 * loading state on every screen. Falls back to defaults on first launch.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CefrLevel, Language } from "./types";

export type Preferences = {
  onboarded: boolean;
  defaultLanguage: Language;
  selfReportedLevel: CefrLevel;
  /** TTS speech rate; 1.0 is the default Speech.speak rate. */
  ttsRate: number;
  theme: "dark" | "light" | "system";
  /** How many sessions per day count as a "completed" goal day. */
  dailyGoal: number;
};

const DEFAULTS: Preferences = {
  onboarded: false,
  defaultLanguage: "en",
  selfReportedLevel: "A1",
  ttsRate: 0.9,
  theme: "system",
  dailyGoal: 1,
};

const KEY = "lang-app:preferences:v1";

let cached: Preferences | null = null;
const listeners = new Set<(p: Preferences) => void>();

export async function loadPreferences(): Promise<Preferences> {
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Preferences>;
      cached = { ...DEFAULTS, ...parsed };
    } else {
      cached = { ...DEFAULTS };
    }
  } catch {
    cached = { ...DEFAULTS };
  }
  return cached;
}

export function getCachedPreferences(): Preferences {
  return cached ?? DEFAULTS;
}

export async function savePreferences(patch: Partial<Preferences>): Promise<Preferences> {
  const current = cached ?? (await loadPreferences());
  const next: Preferences = { ...current, ...patch };
  cached = next;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort
  }
  for (const fn of listeners) fn(next);
  return next;
}

export function subscribePreferences(fn: (p: Preferences) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function resetPreferences(): Promise<Preferences> {
  cached = { ...DEFAULTS };
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // best-effort
  }
  for (const fn of listeners) fn(cached);
  return cached;
}
