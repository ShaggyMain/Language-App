/**
 * XP — gamification layer over the existing session/grading data.
 *
 * Awarded XP per finished session:
 *   - 10 XP per correct answer (`summary.correct * 10`)
 *   - +30 perfect-session bonus when the user nailed every item
 *   - +20 streak bonus when this finish keeps a streak alive
 *   - +50 first-pass bonus the very first time a Path lesson is passed
 *
 * Total XP is persisted in AsyncStorage and exposed via a tiny store/
 * listener pattern so the home screen can animate increments.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SessionSummary } from "./session";

export type XpState = {
  total: number;
  /** XP gained in the most recent session. Used for the home-screen ping. */
  lastDelta: number;
  /** Timestamp of last update — drives "+15 XP" badges fading on home. */
  lastUpdatedAt: number;
};

export type XpBreakdown = {
  base: number;
  perfect: number;
  streak: number;
  pathFirstPass: number;
  total: number;
};

const KEY = "lang-app:xp:v1";
const DEFAULTS: XpState = { total: 0, lastDelta: 0, lastUpdatedAt: 0 };

let cached: XpState | null = null;
const listeners = new Set<(s: XpState) => void>();

export function computeSessionXp(input: {
  summary: SessionSummary;
  streakAlive: boolean;
  firstPathPass: boolean;
}): XpBreakdown {
  const base = Math.max(0, input.summary.correct) * 10;
  const perfect =
    input.summary.total > 0 && input.summary.correct === input.summary.total ? 30 : 0;
  const streak = input.streakAlive ? 20 : 0;
  const pathFirstPass = input.firstPathPass ? 50 : 0;
  return { base, perfect, streak, pathFirstPass, total: base + perfect + streak + pathFirstPass };
}

async function persist(next: XpState): Promise<void> {
  cached = next;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort
  }
  for (const fn of listeners) fn(next);
}

export async function loadXp(): Promise<XpState> {
  if (cached) return cached;
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  cached = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<XpState>) } : { ...DEFAULTS };
  return cached;
}

export function getCachedXp(): XpState {
  return cached ?? DEFAULTS;
}

export async function awardXp(delta: number, now: number = Date.now()): Promise<XpState> {
  const cur = await loadXp();
  const next: XpState = {
    total: cur.total + delta,
    lastDelta: delta,
    lastUpdatedAt: now,
  };
  await persist(next);
  return next;
}

export function subscribeXp(fn: (s: XpState) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function resetXp(): Promise<XpState> {
  await persist({ ...DEFAULTS });
  return cached!;
}

/**
 * Levels are a soft visual layer on top of total XP. Curve is exponential:
 * level N requires `100 * 1.4^(N-1)` cumulative XP. Keeps early levels short
 * (rewarding the first hour) and late levels long (sustaining engagement).
 */
export function levelForXp(total: number): { level: number; intoLevel: number; perLevel: number; pct: number } {
  let level = 1;
  let consumed = 0;
  let next = 100;
  while (total >= consumed + next) {
    consumed += next;
    level += 1;
    next = Math.round(next * 1.4);
  }
  const intoLevel = total - consumed;
  return { level, intoLevel, perLevel: next, pct: next > 0 ? intoLevel / next : 0 };
}
