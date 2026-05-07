import { describe, expect, it } from "@jest/globals";
import type { GradeResult } from "./grading";
import { initialState, reduce, summarize, type SessionState } from "./session";
import type { SessionItem } from "./selector";

const grade = (correct: boolean, score = correct ? 1 : 0): GradeResult => ({
  correct,
  score,
  closest: "ok",
  diff: [],
  reason: correct ? "exact" : "wrong",
});

const sampleItems = (): SessionItem[] => [
  {
    exercise: { type: "fill", prompt: "_", answers: ["a"] },
    instanceHash: "h1",
    origin: "generator",
  },
  {
    exercise: { type: "mcq", prompt: "_", options: ["a", "b"], answer: 0 },
    instanceHash: "h2",
    origin: "generator",
  },
  {
    exercise: { type: "fill", prompt: "_", answers: ["b"] },
    instanceHash: "h3",
    origin: "authored",
  },
];

const start = (): SessionState =>
  reduce(initialState(), {
    type: "START",
    topicId: "t",
    mode: "practice",
    items: sampleItems(),
    now: 1000,
  });

describe("session reducer", () => {
  it("START initializes with cursor=0 and phase=answering", () => {
    const s = start();
    expect(s.cursor).toBe(0);
    expect(s.phase).toBe("answering");
    expect(s.items.length).toBe(3);
    expect(s.startedAt).toBe(1000);
  });

  it("SUBMIT moves into showing-result and stores grade", () => {
    let s = start();
    s = reduce(s, { type: "BEGIN_ITEM", now: 1100 });
    s = reduce(s, { type: "SUBMIT", userInput: "a", result: grade(true), now: 1500 });
    expect(s.phase).toBe("showing-result");
    expect(s.items[0].result?.correct).toBe(true);
    expect(s.items[0].userInput).toBe("a");
    expect(s.items[0].durationMs).toBe(400);
  });

  it("NEXT advances cursor and returns to answering", () => {
    let s = start();
    s = reduce(s, { type: "SUBMIT", userInput: "a", result: grade(true) });
    s = reduce(s, { type: "NEXT" });
    expect(s.cursor).toBe(1);
    expect(s.phase).toBe("answering");
  });

  it("FINISH after the last item", () => {
    let s = start();
    for (let i = 0; i < 3; i++) {
      s = reduce(s, { type: "SUBMIT", userInput: "x", result: grade(true) });
      s = reduce(s, { type: "NEXT" });
    }
    expect(s.phase).toBe("finished");
    expect(s.cursor).toBe(3);
  });

  it("SKIP advances without grading", () => {
    let s = start();
    s = reduce(s, { type: "SKIP" });
    expect(s.cursor).toBe(1);
    expect(s.items[0].result).toBeUndefined();
  });

  it("SUBMIT is ignored after results phase", () => {
    let s = start();
    s = reduce(s, { type: "SUBMIT", userInput: "a", result: grade(true) });
    const before = s;
    s = reduce(s, { type: "SUBMIT", userInput: "b", result: grade(false) });
    expect(s).toEqual(before);
  });
});

describe("summarize", () => {
  it("computes overall + per-type", () => {
    let s = start();
    s = reduce(s, { type: "SUBMIT", userInput: "a", result: grade(true) });
    s = reduce(s, { type: "NEXT" });
    s = reduce(s, { type: "SUBMIT", userInput: "a", result: grade(true) });
    s = reduce(s, { type: "NEXT" });
    s = reduce(s, { type: "SUBMIT", userInput: "wrong", result: grade(false) });
    s = reduce(s, { type: "NEXT" });
    const sum = summarize(s, 5000);
    expect(sum.total).toBe(3);
    expect(sum.answered).toBe(3);
    expect(sum.correct).toBe(2);
    expect(sum.overall).toBeCloseTo(2 / 3);
    expect(sum.byType.fill.total).toBe(2);
    expect(sum.byType.mcq.total).toBe(1);
  });

  it("passedPath requires both overall ≥ 0.8 and per-type ≥ 0.7", () => {
    let s = start();
    s = reduce(s, { type: "SUBMIT", userInput: "a", result: grade(true) });
    s = reduce(s, { type: "NEXT" });
    s = reduce(s, { type: "SUBMIT", userInput: "a", result: grade(true) });
    s = reduce(s, { type: "NEXT" });
    s = reduce(s, { type: "SUBMIT", userInput: "a", result: grade(true) });
    s = reduce(s, { type: "NEXT" });
    expect(summarize(s).passedPath).toBe(true);
  });
});
