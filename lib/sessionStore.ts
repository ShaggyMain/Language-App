/**
 * Module-level cache holding the most recently finished session. The Practice
 * / Path screens write here on FINISH; the Results screen reads it on mount.
 * Avoids serializing complex state through expo-router params.
 */

import type { SessionState, SessionSummary } from "./session";

type Stash = { state: SessionState; summary: SessionSummary };

let stash: Stash | null = null;

export function publishSession(state: SessionState, summary: SessionSummary): void {
  stash = { state, summary };
}

export function consumeSession(): Stash | null {
  const s = stash;
  return s;
}
