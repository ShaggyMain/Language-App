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

  // 4b. Authored (only those that produce a renderable Exercise type the UI knows)
  const supported = (ex: Exercise): boolean => ex.type === "fill" || ex.type === "mcq";
  const supportedAuthored = shuffle(
    authored.filter((a) => supported(a.exercise)),
    rng,
  );
  let authoredAdded = 0;
  for (const a of supportedAuthored) {
    if (authoredAdded >= minAuthored) break;
    if (picked.find((p) => p.instanceHash === a.instanceHash)) continue;
    picked.push(a);
    authoredAdded++;
  }

  // 4c. Fill from generator pool, respecting mix
  const shuffledGen = shuffle(genPool, rng);
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
