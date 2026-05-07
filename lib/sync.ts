/**
 * Best-effort cloud sync. Only runs when:
 *   - Supabase is configured (env vars present)
 *   - A user is signed in
 *
 * What we sync:
 *   - srs_cards: the spaced-repetition schedule per (user, instance) — high
 *     value, small footprint, the thing users actually want roaming.
 *   - passed_lessons: which Path lessons are unlocked.
 *
 * What stays local-only:
 *   - seen_instances (just K-back anti-repeat, doesn't need to roam)
 *   - session_log (large, low value across devices)
 *
 * Strategy is "last-write-wins by last_review / last_passed_at". For MVP we
 * push the user's full local set after each session and pull the full remote
 * set on sign-in. Both small enough to be cheap.
 */

import { supabase } from "./supabase";
import { currentUserId, isSignedIn } from "./auth";
import type { Repos, StoredInstance } from "./db";
import type { Card, State } from "ts-fsrs";

type CloudCardRow = {
  user_id: string;
  topic_id: string;
  instance_hash: string;
  template_id: string;
  slot_ids: Record<string, string>;
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: number | null;
};

type CloudPassedRow = {
  user_id: string;
  topic_id: string;
  first_passed_at: number;
  last_passed_at: number;
  pass_count: number;
};

function rowToCard(r: CloudCardRow): { instance: StoredInstance; topicId: string; card: Card } {
  return {
    topicId: r.topic_id,
    instance: { templateId: r.template_id, instanceHash: r.instance_hash, slotIds: r.slot_ids },
    card: {
      due: new Date(r.due),
      stability: r.stability,
      difficulty: r.difficulty,
      elapsed_days: r.elapsed_days,
      scheduled_days: r.scheduled_days,
      reps: r.reps,
      lapses: r.lapses,
      state: r.state as State,
      last_review: r.last_review ? new Date(r.last_review) : undefined,
    },
  };
}

/** Pull remote → local. Called on sign-in. */
export async function syncPull(repos: Repos): Promise<void> {
  if (!supabase || !isSignedIn()) return;
  const uid = currentUserId();

  try {
    const { data: cards } = await supabase
      .from("srs_cards")
      .select("*")
      .eq("user_id", uid)
      .returns<CloudCardRow[]>();

    if (cards) {
      for (const r of cards) {
        const { topicId, instance, card } = rowToCard(r);
        await repos.srs.upsertCard({ userId: uid, topicId, instance, card });
      }
    }

    const { data: passed } = await supabase
      .from("passed_lessons")
      .select("*")
      .eq("user_id", uid)
      .returns<CloudPassedRow[]>();

    if (passed) {
      for (const r of passed) {
        await repos.log.markPassed({ userId: uid, topicId: r.topic_id, at: r.last_passed_at });
      }
    }
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[sync] pull failed:", (e as Error).message);
    }
  }
}

/**
 * Push a single SRS update to cloud. Called from SessionRunner after every
 * graded item. Cheap: one row per call, last-write-wins.
 */
export async function syncPushSrs(
  topicId: string,
  instance: StoredInstance,
  card: Card,
): Promise<void> {
  if (!supabase || !isSignedIn()) return;
  const uid = currentUserId();
  try {
    await supabase.from("srs_cards").upsert(
      {
        user_id: uid,
        topic_id: topicId,
        instance_hash: instance.instanceHash,
        template_id: instance.templateId,
        slot_ids: instance.slotIds,
        due: card.due.getTime(),
        stability: card.stability,
        difficulty: card.difficulty,
        elapsed_days: card.elapsed_days,
        scheduled_days: card.scheduled_days,
        reps: card.reps,
        lapses: card.lapses,
        state: card.state as number,
        last_review: card.last_review ? card.last_review.getTime() : null,
      },
      { onConflict: "user_id,instance_hash" },
    );
  } catch {
    // best-effort
  }
}

/** Push a passed lesson. Called from SessionRunner on Path session pass. */
export async function syncPushPassed(topicId: string, at: number): Promise<void> {
  if (!supabase || !isSignedIn()) return;
  const uid = currentUserId();
  try {
    await supabase.from("passed_lessons").upsert(
      {
        user_id: uid,
        topic_id: topicId,
        first_passed_at: at,
        last_passed_at: at,
        pass_count: 1,
      },
      { onConflict: "user_id,topic_id", ignoreDuplicates: false },
    );
  } catch {
    // best-effort
  }
}
