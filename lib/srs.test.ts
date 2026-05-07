import { describe, expect, it } from "@jest/globals";
import type { GradeResult } from "./grading";
import { isDue, newCard, ratingFromGrade, review } from "./srs";

const make = (over: Partial<GradeResult> = {}): GradeResult => ({
  correct: true,
  score: 1,
  closest: "ok",
  diff: [],
  reason: "exact",
  ...over,
});

describe("ratingFromGrade", () => {
  it("perfect → good", () => {
    expect(ratingFromGrade(make())).toBe("good");
  });
  it("correct but not perfect → hard", () => {
    expect(ratingFromGrade(make({ correct: true, score: 0.95 }))).toBe("hard");
  });
  it("wrong but near → again", () => {
    expect(ratingFromGrade(make({ correct: false, score: 0.8, reason: "near" }))).toBe("again");
  });
  it("wrong → again", () => {
    expect(ratingFromGrade(make({ correct: false, score: 0.2, reason: "wrong" }))).toBe("again");
  });
});

describe("review", () => {
  it("creates a card from null and schedules it forward", () => {
    const now = new Date("2024-01-01T10:00:00Z");
    const card = review(null, "good", now);
    expect(card.reps).toBeGreaterThan(0);
    expect(card.due.getTime()).toBeGreaterThan(now.getTime());
  });

  it("again rating reschedules sooner than good", () => {
    const now = new Date("2024-01-01T10:00:00Z");
    const c1 = review(newCard(now), "again", now);
    const c2 = review(newCard(now), "good", now);
    expect(c1.due.getTime()).toBeLessThan(c2.due.getTime());
  });
});

describe("isDue", () => {
  it("new card scheduled in the future is not due", () => {
    const now = new Date();
    const card = review(null, "good", now);
    expect(isDue(card, now)).toBe(false);
  });
});
