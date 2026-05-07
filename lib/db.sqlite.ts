/**
 * expo-sqlite-backed implementation of the Repos. Lazy-loaded by lib/db.ts
 * so jest (which has no native module) silently falls back to memory.
 */

import * as SQLite from "expo-sqlite";
import type { Card } from "ts-fsrs";
import { State } from "ts-fsrs";
import type { DueCard, Repos, SeenRepo, SessionLogRepo, SrsRepo, StoredInstance } from "./db";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS seen_instances (
  user_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  instance_hash TEXT NOT NULL,
  template_id TEXT NOT NULL,
  slot_ids_json TEXT NOT NULL,
  session_id INTEGER NOT NULL,
  last_seen INTEGER NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, instance_hash)
);
CREATE INDEX IF NOT EXISTS idx_seen_topic ON seen_instances (user_id, topic_id, session_id);

CREATE TABLE IF NOT EXISTS srs_cards (
  user_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  instance_hash TEXT NOT NULL,
  template_id TEXT NOT NULL,
  slot_ids_json TEXT NOT NULL,
  due INTEGER NOT NULL,
  stability REAL NOT NULL,
  difficulty REAL NOT NULL,
  elapsed_days REAL NOT NULL,
  scheduled_days REAL NOT NULL,
  reps INTEGER NOT NULL,
  lapses INTEGER NOT NULL,
  state INTEGER NOT NULL,
  last_review INTEGER,
  PRIMARY KEY (user_id, instance_hash)
);
CREATE INDEX IF NOT EXISTS idx_srs_due ON srs_cards (user_id, topic_id, due);

CREATE TABLE IF NOT EXISTS session_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  summary_json TEXT
);
`;

type CardRow = {
  template_id: string;
  instance_hash: string;
  slot_ids_json: string;
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

function rowToCard(r: CardRow): Card {
  return {
    due: new Date(r.due),
    stability: r.stability,
    difficulty: r.difficulty,
    elapsed_days: r.elapsed_days,
    scheduled_days: r.scheduled_days,
    reps: r.reps,
    lapses: r.lapses,
    state: r.state as State,
    last_review: r.last_review ? new Date(r.last_review) : undefined,
  };
}

function rowToInstance(r: CardRow): StoredInstance {
  return {
    templateId: r.template_id,
    instanceHash: r.instance_hash,
    slotIds: JSON.parse(r.slot_ids_json),
  };
}

export async function createSqliteRepos(): Promise<Repos> {
  const db = await SQLite.openDatabaseAsync("language-app.db");
  await db.execAsync(SCHEMA);

  const seen: SeenRepo = {
    async markSeen({ userId, topicId, sessionId, instance, correct }) {
      const slotJson = JSON.stringify(instance.slotIds);
      const now = Date.now();
      await db.runAsync(
        `INSERT INTO seen_instances (user_id, topic_id, instance_hash, template_id, slot_ids_json, session_id, last_seen, correct_count, wrong_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, instance_hash) DO UPDATE SET
           last_seen = excluded.last_seen,
           session_id = excluded.session_id,
           correct_count = correct_count + ?,
           wrong_count = wrong_count + ?`,
        [
          userId,
          topicId,
          instance.instanceHash,
          instance.templateId,
          slotJson,
          sessionId,
          now,
          correct ? 1 : 0,
          correct ? 0 : 1,
          correct ? 1 : 0,
          correct ? 0 : 1,
        ],
      );
    },

    async recentHashes(userId, topicId, sessionsBack) {
      const sessions = await db.getAllAsync<{ session_id: number }>(
        `SELECT DISTINCT session_id FROM seen_instances
         WHERE user_id = ? AND topic_id = ?
         ORDER BY session_id DESC LIMIT ?`,
        [userId, topicId, sessionsBack],
      );
      if (sessions.length === 0) return new Set();
      const ids = sessions.map((s) => s.session_id);
      const placeholders = ids.map(() => "?").join(",");
      const rows = await db.getAllAsync<{ instance_hash: string }>(
        `SELECT instance_hash FROM seen_instances WHERE session_id IN (${placeholders})`,
        ids,
      );
      return new Set(rows.map((r) => r.instance_hash));
    },
  };

  const srs: SrsRepo = {
    async getCard(userId, instanceHash) {
      const row = await db.getAllAsync<CardRow>(
        `SELECT * FROM srs_cards WHERE user_id = ? AND instance_hash = ? LIMIT 1`,
        [userId, instanceHash],
      );
      return row[0] ? rowToCard(row[0]) : null;
    },
    async upsertCard({ userId, topicId, instance, card }) {
      const slotJson = JSON.stringify(instance.slotIds);
      await db.runAsync(
        `INSERT INTO srs_cards
          (user_id, topic_id, instance_hash, template_id, slot_ids_json,
           due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id, instance_hash) DO UPDATE SET
           due = excluded.due,
           stability = excluded.stability,
           difficulty = excluded.difficulty,
           elapsed_days = excluded.elapsed_days,
           scheduled_days = excluded.scheduled_days,
           reps = excluded.reps,
           lapses = excluded.lapses,
           state = excluded.state,
           last_review = excluded.last_review`,
        [
          userId,
          topicId,
          instance.instanceHash,
          instance.templateId,
          slotJson,
          card.due.getTime(),
          card.stability,
          card.difficulty,
          card.elapsed_days,
          card.scheduled_days,
          card.reps,
          card.lapses,
          card.state as number,
          card.last_review ? card.last_review.getTime() : null,
        ],
      );
    },
    async due(userId, topicId, now, limit) {
      const rows = await db.getAllAsync<CardRow>(
        `SELECT * FROM srs_cards
         WHERE user_id = ? AND topic_id = ? AND due <= ?
         ORDER BY due ASC LIMIT ?`,
        [userId, topicId, now.getTime(), limit],
      );
      const out: DueCard[] = rows.map((r) => ({ ...rowToInstance(r), topicId, card: rowToCard(r) }));
      return out;
    },
  };

  const log: SessionLogRepo = {
    async startSession({ userId, topicId, startedAt }) {
      const r = await db.runAsync(
        `INSERT INTO session_log (user_id, topic_id, started_at) VALUES (?, ?, ?)`,
        [userId, topicId, startedAt],
      );
      return r.lastInsertRowId as number;
    },
    async finishSession({ sessionId, finishedAt, summary }) {
      await db.runAsync(
        `UPDATE session_log SET finished_at = ?, summary_json = ? WHERE id = ?`,
        [finishedAt, JSON.stringify(summary), sessionId],
      );
    },
  };

  return { seen, srs, log };
}
