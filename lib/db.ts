/**
 * Persistence layer for sessions. Two implementations:
 *   - MemoryRepos: in-process, synchronous, used by tests + as a fallback
 *     when expo-sqlite isn't available (e.g. web preview).
 *   - SqliteRepos: backed by expo-sqlite. Lazy-loaded so jest can run.
 *
 * What we store:
 *   - seen_instances: which generated instances a user has encountered, used
 *     for K-back anti-repeat. Stores templateId + slotIds (NOT rendered text).
 *   - srs_cards: ts-fsrs Card per instanceHash for spaced repetition.
 *   - session_log: completed sessions, for stats.
 */

import type { Card } from "ts-fsrs";

export type StoredInstance = {
  templateId: string;
  instanceHash: string;
  slotIds: Record<string, string>;
};

export type SeenRecord = StoredInstance & {
  topicId: string;
  userId: string;
  lastSeen: number;
  correctCount: number;
  wrongCount: number;
  sessionId: number;
};

export type DueCard = StoredInstance & {
  topicId: string;
  card: Card;
};

export interface SeenRepo {
  markSeen(input: {
    userId: string;
    topicId: string;
    sessionId: number;
    instance: StoredInstance;
    correct: boolean;
  }): Promise<void>;
  /** Return instance hashes seen in the last `sessionsBack` sessions for this topic. */
  recentHashes(userId: string, topicId: string, sessionsBack: number): Promise<Set<string>>;
}

export interface SrsRepo {
  getCard(userId: string, instanceHash: string): Promise<Card | null>;
  upsertCard(input: {
    userId: string;
    topicId: string;
    instance: StoredInstance;
    card: Card;
  }): Promise<void>;
  due(userId: string, topicId: string, now: Date, limit: number): Promise<DueCard[]>;
}

export interface SessionLogRepo {
  /** Allocate a fresh sessionId. Used by SeenRepo to group instances. */
  startSession(input: { userId: string; topicId: string; startedAt: number }): Promise<number>;
  finishSession(input: { sessionId: number; finishedAt: number; summary: object }): Promise<void>;
  /** Record that this user passed this topic (≥80% overall, ≥70% per type). */
  markPassed(input: { userId: string; topicId: string; at: number }): Promise<void>;
  /** Topic ids the user has ever passed — used by path gating. */
  passedTopicIds(userId: string): Promise<Set<string>>;
}

export type Repos = {
  seen: SeenRepo;
  srs: SrsRepo;
  log: SessionLogRepo;
};

/* ───────────────────────── in-memory impl ───────────────────────── */

export function createMemoryRepos(): Repos {
  const seenRows: SeenRecord[] = [];
  const cards = new Map<string, { userId: string; topicId: string; instance: StoredInstance; card: Card }>();
  let nextSessionId = 1;
  const sessions = new Map<number, { userId: string; topicId: string; startedAt: number; finishedAt?: number; summary?: object }>();
  const passed = new Map<string, Set<string>>(); // userId → topicIds

  const seen: SeenRepo = {
    async markSeen({ userId, topicId, sessionId, instance, correct }) {
      const existing = seenRows.find(
        (r) => r.userId === userId && r.instanceHash === instance.instanceHash,
      );
      const now = Date.now();
      if (existing) {
        existing.lastSeen = now;
        existing.sessionId = sessionId;
        if (correct) existing.correctCount += 1;
        else existing.wrongCount += 1;
      } else {
        seenRows.push({
          ...instance,
          topicId,
          userId,
          sessionId,
          lastSeen: now,
          correctCount: correct ? 1 : 0,
          wrongCount: correct ? 0 : 1,
        });
      }
    },

    async recentHashes(userId, topicId, sessionsBack) {
      const sids = Array.from(
        new Set(
          seenRows
            .filter((r) => r.userId === userId && r.topicId === topicId)
            .map((r) => r.sessionId),
        ),
      )
        .sort((a, b) => b - a)
        .slice(0, sessionsBack);
      const ids = new Set(sids);
      return new Set(seenRows.filter((r) => ids.has(r.sessionId)).map((r) => r.instanceHash));
    },
  };

  const srs: SrsRepo = {
    async getCard(userId, instanceHash) {
      const e = cards.get(`${userId}:${instanceHash}`);
      return e ? e.card : null;
    },
    async upsertCard({ userId, topicId, instance, card }) {
      cards.set(`${userId}:${instance.instanceHash}`, { userId, topicId, instance, card });
    },
    async due(userId, topicId, now, limit) {
      const out: DueCard[] = [];
      for (const e of cards.values()) {
        if (e.userId !== userId || e.topicId !== topicId) continue;
        if (e.card.due.getTime() <= now.getTime()) {
          out.push({ ...e.instance, topicId, card: e.card });
        }
        if (out.length >= limit) break;
      }
      return out;
    },
  };

  const log: SessionLogRepo = {
    async startSession({ userId, topicId, startedAt }) {
      const id = nextSessionId++;
      sessions.set(id, { userId, topicId, startedAt });
      return id;
    },
    async finishSession({ sessionId, finishedAt, summary }) {
      const s = sessions.get(sessionId);
      if (s) {
        s.finishedAt = finishedAt;
        s.summary = summary;
      }
    },
    async markPassed({ userId, topicId }) {
      let set = passed.get(userId);
      if (!set) {
        set = new Set();
        passed.set(userId, set);
      }
      set.add(topicId);
    },
    async passedTopicIds(userId) {
      return new Set(passed.get(userId) ?? []);
    },
  };

  return { seen, srs, log };
}

/* ───────────────────────── runtime selection ─────────────────────────
 * On native we want SQLite-backed persistence. On web preview / jest we
 * fall back to memory. The async loader is cached after first success.
 * ────────────────────────────────────────────────────────────────────── */

let cached: Repos | null = null;
let pending: Promise<Repos> | null = null;

/**
 * Detects a browser environment without importing react-native (which would
 * break the jest config). Web build → memory repos; expo-sqlite's web shim
 * has been flaky during bundle init and we don't need persistence on web.
 */
function isBrowser(): boolean {
  return typeof document !== "undefined" && typeof window !== "undefined";
}

export async function getRepos(): Promise<Repos> {
  if (cached) return cached;
  if (pending) return pending;
  pending = (async () => {
    if (isBrowser()) {
      cached = createMemoryRepos();
      return cached;
    }
    try {
      const mod = await import("./db.sqlite");
      cached = await mod.createSqliteRepos();
    } catch {
      cached = createMemoryRepos();
    }
    return cached!;
  })();
  return pending;
}

/** Test hook: replace the cached repos (used by the React provider in tests). */
export function _setReposForTests(repos: Repos | null): void {
  cached = repos;
  pending = null;
}
