/**
 * Resolves the current "user_id" used as a primary-key prefix in the local
 * repos. When the user is signed in via Supabase, that's their auth.uid().
 * Otherwise it's the literal string "local". Local-only data stays under
 * "local" forever — we don't migrate it on first sign-in (that's a separate
 * feature: see syncMergeLocalIntoCloud).
 */

import { supabase } from "./supabase";

const LOCAL = "local";
let cached: string = LOCAL;
const listeners = new Set<(uid: string) => void>();

export function currentUserId(): string {
  return cached;
}

export function isSignedIn(): boolean {
  return cached !== LOCAL;
}

export async function refreshAuthState(): Promise<string> {
  if (!supabase) {
    cached = LOCAL;
    return cached;
  }
  const { data } = await supabase.auth.getUser();
  cached = data.user?.id ?? LOCAL;
  return cached;
}

export function subscribeAuthState(fn: (uid: string) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    cached = session?.user?.id ?? LOCAL;
    for (const fn of listeners) fn(cached);
  });
}
