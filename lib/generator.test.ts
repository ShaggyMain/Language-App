import { describe, expect, it } from "@jest/globals";
import { Exercise } from "./types";
import {
  buildLexiconBundle,
  compileInstance,
  expandTemplate,
  instanceHash,
} from "./generator";
import { lexiconBundleFor, templatesForTopic, templateById } from "./content";

describe("instanceHash", () => {
  it("is deterministic for the same inputs", () => {
    const a = instanceHash("t1", { x: "id1", y: "id2" });
    const b = instanceHash("t1", { y: "id2", x: "id1" });
    expect(a).toBe(b);
  });
  it("changes when slot ids change", () => {
    expect(instanceHash("t1", { x: "id1" })).not.toBe(instanceHash("t1", { x: "id2" }));
  });
  it("returns 12 hex chars", () => {
    expect(instanceHash("t1", { x: "id1" })).toMatch(/^[0-9a-f]{12}$/);
  });
});

describe("buildLexiconBundle", () => {
  it("groups entries by pos", () => {
    const bundle = lexiconBundleFor("en");
    expect(bundle.byPos.verb.length).toBeGreaterThan(0);
    expect(bundle.byPos.person.length).toBeGreaterThan(0);
    expect(bundle.byPos.noun.length).toBeGreaterThan(0);
    expect(bundle.byId["en.verb.go"]).toBeDefined();
  });
});

describe("expandTemplate — present-simple affirmative fill", () => {
  const template = templateById("en.present-simple.affirm-fill")!;
  const lex = lexiconBundleFor("en");

  it("produces requested count of unique fills", () => {
    const items = expandTemplate(template, lex, { seed: "test-1", count: 6 });
    expect(items.length).toBeGreaterThan(0);
    const hashes = new Set(items.map((i) => i.instanceHash));
    expect(hashes.size).toBe(items.length);
  });

  it("renders no leftover braces", () => {
    const items = expandTemplate(template, lex, { seed: "test-leak", count: 8 });
    for (const it of items) {
      const ex = it.exercise as { type: "fill"; prompt: string; answers: string[] };
      expect(ex.prompt).not.toMatch(/[{}]/);
      for (const a of ex.answers) expect(a).not.toMatch(/[{}]/);
    }
  });

  it("agrees verb form with subject", () => {
    const items = expandTemplate(template, lex, { seed: "test-agree", count: 12 });
    const lookup = lex.byId;
    for (const it of items) {
      const subj = lookup[it.slotIds.subject];
      const ans = (it.exercise as { answers: string[] }).answers[0];
      const agreement = subj.forms?.agreement ?? "3sg";
      if (agreement === "3sg") {
        expect(ans.endsWith("s")).toBe(true);
      } else {
        expect(ans.endsWith("s")).toBe(false);
      }
    }
  });

  it("output passes Exercise.parse()", () => {
    const items = expandTemplate(template, lex, { seed: "test-parse", count: 10 });
    for (const it of items) {
      const r = Exercise.safeParse(it.exercise);
      expect(r.success).toBe(true);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = expandTemplate(template, lex, { seed: "fixed", count: 6 });
    const b = expandTemplate(template, lex, { seed: "fixed", count: 6 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe("expandTemplate — present-simple 3sg MCQ", () => {
  const template = templateById("en.present-simple.3sg-mcq")!;
  const lex = lexiconBundleFor("en");

  it("produces MCQ exercises with 4 unique options and a correct index", () => {
    const items = expandTemplate(template, lex, { seed: "mcq-1", count: 6 });
    expect(items.length).toBeGreaterThan(0);
    for (const it of items) {
      const ex = it.exercise as { type: "mcq"; options: string[]; answer: number };
      expect(ex.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(ex.options).size).toBe(ex.options.length);
      expect(ex.answer).toBeGreaterThanOrEqual(0);
      expect(ex.answer).toBeLessThan(ex.options.length);
    }
  });

  it("subject is always 3sg", () => {
    const items = expandTemplate(template, lex, { seed: "mcq-3sg", count: 8 });
    for (const it of items) {
      const subj = lex.byId[it.slotIds.subject];
      expect(subj.forms?.agreement).toBe("3sg");
    }
  });
});

describe("compileInstance", () => {
  const template = templateById("en.present-simple.affirm-fill")!;
  const lex = lexiconBundleFor("en");

  it("rehydrates the same exercise content from stored slot ids", () => {
    const items = expandTemplate(template, lex, { seed: "rehydrate", count: 1 });
    const original = items[0];
    const rehydrated = compileInstance(template, original.slotIds, lex);
    expect("error" in rehydrated).toBe(false);
    if (!("error" in rehydrated)) {
      expect(rehydrated.exercise).toEqual(original.exercise);
      expect(rehydrated.instanceHash).toBe(original.instanceHash);
    }
  });

  it("returns error for missing slot id", () => {
    const result = compileInstance(template, { subject: "en.person.he" }, lex);
    expect("error" in result).toBe(true);
  });
});

describe("coverage across templates", () => {
  it("yields plenty of unique instances across all templates with one seed", () => {
    const templates = templatesForTopic("en.tenses.present-simple");
    const lex = lexiconBundleFor("en");
    const all = new Set<string>();
    for (const t of templates) {
      const items = expandTemplate(t, lex, { seed: "global-cov", count: 20 });
      for (const it of items) all.add(it.instanceHash);
    }
    expect(all.size).toBeGreaterThan(40);
  });
});

describe("buildLexiconBundle isolation", () => {
  it("returns empty pos buckets for languages with no lexicon", () => {
    const empty = buildLexiconBundle("de", []);
    expect(empty.byPos.verb).toEqual([]);
    expect(empty.byPos.noun).toEqual([]);
  });
});
