/**
 * Session composer. Picks N exercises for a session using:
 *   1. SRS-due cards (rehydrated from generator)
 *   2. Generator output (filtered against recent K-back hashes)
 *   3. Hand-authored exercises from the topic
 *
 * Then enforces a minimum mix of fill vs mcq exercises and shuffles
 * deterministically using `seed`.
 */

import type { Exercise, Topic, TopicTemplate } from "./types";
import type { LexiconBundle } from "./generator";
import { compileInstance, expandTemplate } from "./generator";
import type { Repos, StoredInstance } from "./db";

export type SelectorMode = "practice" | "path" | "review";

export type SessionItem = {
  exercise: Exercise;
  /** Stable identity for SRS / anti-repeat. Authored items use authored:<idx>. */
  instanceHash: string;
  /** Present only for generated items. */
  templateId?: string;
  slotIds?: Record<string, string>;
  /** Where the item came from — used for diagnostics / reporting. */
  origin: "srs" | "generator" | "authored";
};

export type SelectorOptions = {
  userId: string;
  mode: SelectorMode;
  count?: number;
  /** RNG seed for ordering. Default derived from mode + topic + day. */
  seed?: string;
  /** Override "now" for deterministic SRS due lookup. */
  now?: Date;
  /** How many recent sessions to look back for anti-repeat. */
  sessionsBack?: number;
  /** Override default mix targets (max MCQ proportion). */
  maxMcqRatio?: number;
};

const DEFAULT_COUNT = 10;
const DEFAULT_SESSIONS_BACK = 3;
const DEFAULT_MAX_MCQ_RATIO = 0.6;

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedNum(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function authoredHash(topicId: string, idx: number): string {
  return `auth:${topicId}:${idx}`;
}

function deduplicate(items: SessionItem[]): SessionItem[] {
  const seen = new Set<string>();
  const out: SessionItem[] = [];
  for (const it of items) {
    if (seen.has(it.instanceHash)) continue;
    seen.add(it.instanceHash);
    out.push(it);
  }
  return out;
}

export async function pickSessionExercises(
  topic: Topic,
  templates: TopicTemplate[],
  lex: LexiconBundle,
  repos: Repos,
  opts: SelectorOptions,
): Promise<SessionItem[]> {
  const count = opts.count ?? DEFAULT_COUNT;
  const sessionsBack = opts.sessionsBack ?? DEFAULT_SESSIONS_BACK;
  const maxMcqRatio = opts.maxMcqRatio ?? DEFAULT_MAX_MCQ_RATIO;
  const now = opts.now ?? new Date();
  const seedStr = opts.seed ?? `${opts.userId}:${topic.id}:${opts.mode}:${Math.floor(now.getTime() / 86400000)}`;
  const rng = mulberry32(seedNum(seedStr));

  /* Adaptive weights per exercise type, computed from history.
   *   weight = clamp(1 + (1 - accuracy) * 3, 0.5, 4)
   *   - Types user nails (acc ≥ 0.9) get neutral-to-low weight (~1.0–1.3)
   *   - Types user struggles with (acc 0.5) get 2.5× weight
   *   - Types user is failing (acc 0.0) get 4× weight
   *   - Untested types get neutral weight (1.0)
   *   - Floor of 5 attempts before stats kick in (avoid early bias)
   */
  const accuracy = await repos.log.accuracyByType(opts.userId, topic.id);
  function typeWeight(type: string): number {
    const stat = accuracy[type];
    if (!stat || stat.total < 5) return 1;
    const w = 1 + (1 - stat.pct) * 3;
    return Math.max(0.5, Math.min(4, w));
  }
  /**
   * Iteratively draws up to `n` items without replacement, weighted by
   * typeWeight. The returned ORDER itself is biased — items with higher
   * weight tend to come first — so callers can soft-cap with slice(0, k)
   * and still get the adaptive effect.
   */
  function pickWeighted<T extends { exercise: { type: string } }>(pool: T[], n: number): T[] {
    const taken: T[] = [];
    const remaining = pool.slice();
    const limit = Math.min(n, pool.length);
    for (let i = 0; i < limit && remaining.length > 0; i++) {
      const weights = remaining.map((it) => typeWeight(it.exercise.type));
      const total = weights.reduce((s, w) => s + w, 0);
      if (total <= 0) {
        taken.push(remaining[0]);
        remaining.shift();
        continue;
      }
      let roll = rng() * total;
      let idx = 0;
      for (; idx < weights.length; idx++) {
        roll -= weights[idx];
        if (roll <= 0) break;
      }
      idx = Math.min(idx, remaining.length - 1);
      taken.push(remaining[idx]);
      remaining.splice(idx, 1);
    }
    return taken;
  }

  /* 1. SRS-due (rehydrate via compileInstance) ─────────────────── */
  const dueLimit = Math.ceil(count * 0.3);
  const dueRaw = await repos.srs.due(opts.userId, topic.id, now, dueLimit);
  const dueItems: SessionItem[] = [];
  for (const d of dueRaw) {
    const tmpl = templates.find((t) => t.id === d.templateId);
    if (!tmpl) continue;
    const compiled = compileInstance(tmpl, d.slotIds, lex);
    if ("error" in compiled) continue;
    dueItems.push({
      exercise: compiled.exercise,
      instanceHash: compiled.instanceHash,
      templateId: tmpl.id,
      slotIds: compiled.slotIds,
      origin: "srs",
    });
  }

  /* 2. Generator pool, filtered by recent hashes ────────────────── */
  const recent = await repos.seen.recentHashes(opts.userId, topic.id, sessionsBack);
  const genPool: SessionItem[] = [];
  // expand each template with a topic-wide seed so consecutive sessions
  // see different surface forms (different templates rotate too)
  const perTemplate = Math.max(6, Math.ceil(count / Math.max(1, templates.length)) * 3);
  for (const t of shuffle(templates, rng)) {
    const items = expandTemplate(t, lex, { seed: `${seedStr}:${t.id}`, count: perTemplate });
    for (const it of items) {
      if (recent.has(it.instanceHash)) continue;
      genPool.push({
        exercise: it.exercise,
        instanceHash: it.instanceHash,
        templateId: t.id,
        slotIds: it.slotIds,
        origin: "generator",
      });
    }
  }

  /* 3. Hand-authored exercises ──────────────────────────────────── */
  const authored: SessionItem[] = topic.exercises.map((ex, idx) => ({
    exercise: ex,
    instanceHash: authoredHash(topic.id, idx),
    origin: "authored",
  }));

  /* 4. Compose with mix rules ──────────────────────────────────── */
  const target = count;
  const minAuthored = Math.min(Math.ceil(count * 0.3), authored.length);
  const picked: SessionItem[] = [];

  // 4a. SRS first (already deduped against itself by hash)
  for (const it of dueItems) {
    if (picked.length >= target) break;
    picked.push(it);
  }

  // 4b. Authored — UI now supports every type defined on Exercise; render all.
  // Weighted shuffle so weak types are favored.
  const supportedAuthored = pickWeighted(authored, authored.length);
  let authoredAdded = 0;
  for (const a of supportedAuthored) {
    if (authoredAdded >= minAuthored) break;
    if (picked.find((p) => p.instanceHash === a.instanceHash)) continue;
    picked.push(a);
    authoredAdded++;
  }

  // 4c. Fill from generator pool, respecting mix. Generator items are mostly
  // mcq/fill so the weighting still applies but matters less than for authored.
  const shuffledGen = pickWeighted(genPool, genPool.length);
  for (const it of shuffledGen) {
    if (picked.length >= target) break;
    if (picked.find((p) => p.instanceHash === it.instanceHash)) continue;
    const mcqCount = picked.filter((p) => p.exercise.type === "mcq").length + (it.exercise.type === "mcq" ? 1 : 0);
    if (mcqCount > Math.ceil((picked.length + 1) * maxMcqRatio)) {
      continue;
    }
    picked.push(it);
  }

  // 4d. Top up with anything left if still short (relax mix rule)
  if (picked.length < target) {
    for (const pool of [shuffledGen, supportedAuthored]) {
      for (const it of pool) {
        if (picked.length >= target) break;
        if (picked.find((p) => p.instanceHash === it.instanceHash)) continue;
        picked.push(it);
      }
    }
  }

  return shuffle(deduplicate(picked).slice(0, target), rng);
}

/* ───────────── helper for tests / app: persist seen + grade ───────────── */

export async function recordItemSeen(
  repos: Repos,
  userId: string,
  topicId: string,
  sessionId: number,
  item: SessionItem,
  correct: boolean,
): Promise<void> {
  if (item.origin === "authored" || !item.templateId || !item.slotIds) return;
  const instance: StoredInstance = {
    templateId: item.templateId,
    instanceHash: item.instanceHash,
    slotIds: item.slotIds,
  };
  await repos.seen.markSeen({ userId, topicId, sessionId, instance, correct });
}
