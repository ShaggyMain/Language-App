import { describe, expect, it } from "@jest/globals";
import { computeSessionXp, levelForXp } from "./xp";
import type { SessionSummary } from "./session";

const summary = (overrides: Partial<SessionSummary> = {}): SessionSummary => ({
  total: 10,
  answered: 10,
  correct: 8,
  overall: 0.8,
  byType: {},
  passedPath: false,
  durationMs: 60_000,
  ...overrides,
});

describe("computeSessionXp", () => {
  it("base = correct * 10", () => {
    expect(computeSessionXp({ summary: summary({ correct: 7 }), streakAlive: false, firstPathPass: false })).toMatchObject({
      base: 70,
      total: 70,
    });
  });

  it("adds perfect bonus when all correct", () => {
    const r = computeSessionXp({ summary: summary({ correct: 10 }), streakAlive: false, firstPathPass: false });
    expect(r.perfect).toBe(30);
    expect(r.total).toBe(130);
  });

  it("adds streak bonus + path bonus", () => {
    const r = computeSessionXp({ summary: summary({ correct: 8 }), streakAlive: true, firstPathPass: true });
    expect(r.streak).toBe(20);
    expect(r.pathFirstPass).toBe(50);
    expect(r.total).toBe(150);
  });

  it("never goes negative", () => {
    expect(computeSessionXp({ summary: summary({ correct: 0 }), streakAlive: false, firstPathPass: false }).total).toBe(0);
  });
});

describe("levelForXp", () => {
  it("level 1 at 0 XP", () => {
    expect(levelForXp(0)).toMatchObject({ level: 1, intoLevel: 0, perLevel: 100 });
  });
  it("level 2 at 100 XP", () => {
    expect(levelForXp(100).level).toBe(2);
  });
  it("level 3 at 240 XP (100 + 140)", () => {
    expect(levelForXp(240).level).toBe(3);
  });
  it("pct is between 0 and 1", () => {
    const r = levelForXp(50);
    expect(r.pct).toBeCloseTo(0.5);
  });
});
