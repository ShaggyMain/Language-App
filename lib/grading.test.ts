import { describe, expect, it } from "@jest/globals";
import { grade, normalize, similarity } from "./grading";

describe("normalize", () => {
  it("lowercases and trims", () => {
    expect(normalize("  Hello  ")).toBe("hello");
  });
  it("treats it's and its as equal after normalization", () => {
    expect(normalize("It's mine.")).toBe(normalize("Its mine"));
  });
  it("strips punctuation and collapses spaces", () => {
    expect(normalize("Hello,   world!!")).toBe("hello world");
  });
  it("normalizes curly apostrophes", () => {
    expect(normalize("don’t")).toBe(normalize("don't"));
    expect(normalize("don’t")).toBe(normalize("dont"));
  });
});

describe("grade — exact and normalized matches", () => {
  it("accepts exact answer", () => {
    const r = grade("She goes to school.", ["She goes to school."]);
    expect(r.correct).toBe(true);
    expect(r.reason).toBe("exact");
  });
  it("accepts case-insensitive answer", () => {
    const r = grade("she goes to school", ["She goes to school."]);
    expect(r.correct).toBe(true);
    expect(r.score).toBe(1);
  });
  it("accepts its instead of it's", () => {
    const r = grade("its mine", ["It's mine."]);
    expect(r.correct).toBe(true);
  });
  it("accepts when only punctuation differs", () => {
    const r = grade("Hello world", ["Hello, world!"]);
    expect(r.correct).toBe(true);
  });
});

describe("grade — near misses", () => {
  it("flags near miss for missing -es ending", () => {
    const r = grade("She go to school", ["She goes to school"]);
    expect(r.correct).toBe(false);
    expect(r.reason).toBe("near");
    expect(r.score).toBeGreaterThan(0.7);
    expect(r.score).toBeLessThan(0.95);
  });
  it("returns the closest accepted answer", () => {
    const r = grade("I am go to school", [
      "I go to school",
      "I am going to school",
    ]);
    expect(r.closest).toBe("I am going to school");
  });
});

describe("grade — wrong answers", () => {
  it("marks completely different input as wrong", () => {
    const r = grade("banana banana banana", ["She goes to school"]);
    expect(r.correct).toBe(false);
    expect(r.reason).toBe("wrong");
    expect(r.score).toBeLessThan(0.7);
  });
});

describe("grade — multilingual smoke tests", () => {
  it("German exact match", () => {
    const r = grade("Ich habe gegessen", ["Ich habe gegessen."]);
    expect(r.correct).toBe(true);
  });
  it("Spanish exact match", () => {
    const r = grade("voy a la escuela", ["Voy a la escuela."]);
    expect(r.correct).toBe(true);
  });
});

describe("similarity", () => {
  it("returns 1 for identical strings", () => {
    expect(similarity("abc", "abc")).toBe(1);
  });
  it("returns 0 for completely different lengths", () => {
    expect(similarity("", "abc")).toBe(0);
  });
});
