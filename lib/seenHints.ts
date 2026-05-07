/**
 * Tracks which one-time hints the user has already seen, so we can show
 * "Tap tokens to build the sentence" the first time they hit an Order
 * exercise but not on the next 50 they do. Persisted in AsyncStorage.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "lang-app:seen-hints:v1";
let cached: Set<string> | null = null;

async function ensure(): Promise<Set<string>> {
  if (cached) return cached;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cached = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    cached = new Set();
  }
  return cached;
}

export async function hasSeenHint(id: string): Promise<boolean> {
  const set = await ensure();
  return set.has(id);
}

export async function markHintSeen(id: string): Promise<void> {
  const set = await ensure();
  if (set.has(id)) return;
  set.add(id);
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(Array.from(set)));
  } catch {
    // best-effort
  }
}

/** Sync read; returns true if we've definitely seen it (cache populated). */
export function hasSeenHintCached(id: string): boolean {
  return cached?.has(id) ?? false;
}
