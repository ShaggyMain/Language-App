/**
 * Session reducer. Holds the in-memory state for a 10-question session:
 * cursor, per-item user input, grading result, timestamps. The screen
 * dispatches actions and renders from state — persistence is handled by
 * the host (selector + repos at session start, markSeen + srs.upsert
 * after each grade).
 */

import type { GradeResult } from "./grading";
import type { SessionItem } from "./selector";

export type SessionMode = "practice" | "path" | "review";

export type SessionPhase = "answering" | "showing-result" | "finished";

export type SessionStateItem = SessionItem & {
  result?: GradeResult;
  userInput?: string;
  durationMs?: number;
  startedAt?: number;
};

export type SessionState = {
  topicId: string;
  mode: SessionMode;
  items: SessionStateItem[];
  cursor: number;
  phase: SessionPhase;
  startedAt: number;
};

export type SessionAction =
  | { type: "START"; topicId: string; mode: SessionMode; items: SessionItem[]; now?: number }
  | { type: "BEGIN_ITEM"; now?: number }
  | { type: "SUBMIT"; userInput: string; result: GradeResult; now?: number }
  | { type: "NEXT" }
  | { type: "SKIP" }
  | { type: "FINISH" };

export function initialState(): SessionState {
  return { topicId: "", mode: "practice", items: [], cursor: 0, phase: "finished", startedAt: 0 };
}

export function reduce(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "START": {
      const now = action.now ?? Date.now();
      return {
        topicId: action.topicId,
        mode: action.mode,
        items: action.items.map((it) => ({ ...it })),
        cursor: 0,
        phase: action.items.length === 0 ? "finished" : "answering",
        startedAt: now,
      };
    }
    case "BEGIN_ITEM": {
      const items = state.items.slice();
      if (state.cursor >= items.length) return state;
      const cur = items[state.cursor];
      if (cur.startedAt) return state;
      items[state.cursor] = { ...cur, startedAt: action.now ?? Date.now() };
      return { ...state, items };
    }
    case "SUBMIT": {
      if (state.phase !== "answering" || state.cursor >= state.items.length) return state;
      const items = state.items.slice();
      const cur = items[state.cursor];
      const now = action.now ?? Date.now();
      items[state.cursor] = {
        ...cur,
        result: action.result,
        userInput: action.userInput,
        durationMs: cur.startedAt ? now - cur.startedAt : undefined,
      };
      return { ...state, items, phase: "showing-result" };
    }
    case "NEXT": {
      if (state.phase !== "showing-result") return state;
      const next = state.cursor + 1;
      if (next >= state.items.length) {
        return { ...state, cursor: next, phase: "finished" };
      }
      return { ...state, cursor: next, phase: "answering" };
    }
    case "SKIP": {
      if (state.cursor >= state.items.length) return state;
      const next = state.cursor + 1;
      if (next >= state.items.length) return { ...state, cursor: next, phase: "finished" };
      return { ...state, cursor: next, phase: "answering" };
    }
    case "FINISH":
      return { ...state, phase: "finished" };
    default:
      return state;
  }
}

export type SessionSummary = {
  total: number;
  answered: number;
  correct: number;
  overall: number;
  byType: Record<string, { total: number; correct: number; pct: number }>;
  passedPath: boolean;
  durationMs: number;
};

export function summarize(state: SessionState, now: number = Date.now()): SessionSummary {
  const total = state.items.length;
  let answered = 0;
  let correct = 0;
  const byType: Record<string, { total: number; correct: number; pct: number }> = {};

  for (const it of state.items) {
    const type = it.exercise.type;
    if (!byType[type]) byType[type] = { total: 0, correct: 0, pct: 0 };
    byType[type].total++;
    if (it.result) {
      answered++;
      if (it.result.correct) {
        correct++;
        byType[type].correct++;
      }
    }
  }
  for (const k of Object.keys(byType)) {
    const e = byType[k];
    e.pct = e.total ? e.correct / e.total : 0;
  }
  const overall = total ? correct / total : 0;
  const passedPath =
    overall >= 0.8 && Object.values(byType).every((e) => (e.total ? e.pct >= 0.7 : true));

  return {
    total,
    answered,
    correct,
    overall,
    byType,
    passedPath,
    durationMs: state.startedAt ? now - state.startedAt : 0,
  };
}
