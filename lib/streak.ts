/**
 * Daily streak + per-day session counter, persisted to AsyncStorage.
 *
 * Rules:
 *   - "Today" is determined by the user's local date (YYYY-MM-DD).
 *   - Finishing a session bumps `todayCount`. The first finish on a new
 *     calendar day also bumps the streak: if yesterday was a goal-met day
 *     (or the streak is fresh) → streak += 1, otherwise streak resets to 1.
 *   - `streak` decays to 0 on read if the user missed a full day after
 *     their last session — handled inside `loadStreak`.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCachedPreferences, loadPreferences } from "./preferences";

export type Streak = {
  streak: number;
  todayCount: number;
  lastDate: string; // YYYY-MM-DD or ""
};

const DEFAULTS: Streak = { streak: 0, todayCount: 0, lastDate: "" };
const KEY = "lang-app:streak:v1";

let cached: Streak | null = null;
const listeners = new Set<(s: Streak) => void>();

function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayStr(d: Date = new Date()): string {
  const yest = new Date(d);
  yest.setDate(yest.getDate() - 1);
  return todayStr(yest);
}

/**
 * If the user is reading the streak on a day after their last activity,
 * decide whether the streak is still alive. We do NOT touch `todayCount`
 * here — that field is "count for `lastDate`", and `bumpStreak` uses it
 * to decide whether yesterday's goal was met before it gets overwritten.
 */
function decayIfStale(s: Streak, now: Date): Streak {
  const today = todayStr(now);
  if (!s.lastDate) return s;
  if (s.lastDate === today) return s;
  if (s.lastDate === yesterdayStr(now)) return s;
  // Two or more days since last activity → streak is dead. We keep
  // lastDate / todayCount intact so the next bump still sees them
  // when computing "did the previous day meet the goal?" (it didn't).
  return { ...s, streak: 0 };
}

/** Today's session count derived from the persisted record. */
export function todaysCount(s: Streak, now: Date = new Date()): number {
  return s.lastDate === todayStr(now) ? s.todayCount : 0;
}

async function persist(next: Streak): Promise<void> {
  cached = next;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort
  }
  for (const fn of listeners) fn(next);
}

export async function loadStreak(now: Date = new Date()): Promise<Streak> {
  if (cached) {
    const decayed = decayIfStale(cached, now);
    if (decayed !== cached) await persist(decayed);
    return cached;
  }
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  const parsed: Streak = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Streak>) } : { ...DEFAULTS };
  const decayed = decayIfStale(parsed, now);
  if (decayed !== parsed) await persist(decayed);
  else cached = decayed;
  return cached!;
}

export function getCachedStreak(): Streak {
  return cached ?? DEFAULTS;
}

export async function bumpStreak(now: Date = new Date()): Promise<Streak> {
  const prefs = getCachedPreferences().dailyGoal ? getCachedPreferences() : await loadPreferences();
  const goal = prefs.dailyGoal;
  const today = todayStr(now);
  const current = await loadStreak(now);

  let next: Streak;
  if (current.lastDate === today) {
    next = { ...current, todayCount: current.todayCount + 1 };
  } else {
    // first session of a new day
    const continued = current.lastDate === yesterdayStr(now);
    const wasGoalMet = current.todayCount >= goal;
    const newStreakBase = continued && wasGoalMet ? current.streak : 0;
    next = {
      streak: newStreakBase + 1,
      todayCount: 1,
      lastDate: today,
    };
  }
  await persist(next);
  return next;
}

export function subscribeStreak(fn: (s: Streak) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function resetStreak(): Promise<Streak> {
  await persist({ ...DEFAULTS });
  return cached!;
}
