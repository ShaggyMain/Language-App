/**
 * Mastery — derived from accuracy stats + path pass status. A simple
 * 0…1 score that the home/path/practice screens can render as a ring
 * or progress bar.
 *
 * Formula:
 *   passed component (40%) — 1.0 if topic ever passed, else 0
 *   accuracy component (60%) — average of per-type accuracy across types
 *                              the user has actually attempted (≥3 attempts)
 *
 * Untouched topics return 0 — UI should render that as "not started".
 */

import type { Repos } from "./db";

export type Mastery = {
  /** 0..1 — composite score. */
  score: number;
  /** Per-topic detail for UI. */
  passed: boolean;
  accuracy: number;
  attempts: number;
};

const PASSED_WEIGHT = 0.4;
const ACCURACY_WEIGHT = 0.6;
const MIN_ATTEMPTS_FOR_ACCURACY = 3;

export async function masteryFor(repos: Repos, userId: string, topicId: string): Promise<Mastery> {
  const passed = (await repos.log.passedTopicIds(userId)).has(topicId);
  const stats = await repos.log.accuracyByType(userId, topicId);

  let attempts = 0;
  let accuracySum = 0;
  let accuracyCount = 0;
  for (const t of Object.values(stats)) {
    attempts += t.total;
    if (t.total >= MIN_ATTEMPTS_FOR_ACCURACY) {
      accuracySum += t.pct;
      accuracyCount += 1;
    }
  }
  const accuracy = accuracyCount > 0 ? accuracySum / accuracyCount : 0;
  const passedScore = passed ? 1 : 0;
  const score = passedScore * PASSED_WEIGHT + accuracy * ACCURACY_WEIGHT;
  return { score, passed, accuracy, attempts };
}

export async function masteryMap(
  repos: Repos,
  userId: string,
  topicIds: string[],
): Promise<Record<string, Mastery>> {
  const out: Record<string, Mastery> = {};
  await Promise.all(
    topicIds.map(async (id) => {
      out[id] = await masteryFor(repos, userId, id);
    }),
  );
  return out;
}
