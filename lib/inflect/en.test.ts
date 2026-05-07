import { describe, expect, it } from "@jest/globals";
import type { LexiconEntry } from "../types";
import { applyInflector } from "./en";

const work: LexiconEntry = {
  id: "v.work",
  lemma: "work",
  pos: "verb",
  cefr: "A1",
  tags: [],
  gloss: { pl: "pracować" },
  forms: { irregular: false, present: { "3sg": "works" }, gerund: "working" },
};

const study: LexiconEntry = {
  id: "v.study",
  lemma: "study",
  pos: "verb",
  cefr: "A1",
  tags: [],
  gloss: { pl: "studiować" },
  forms: { irregular: false, present: { "3sg": "studies" }, gerund: "studying" },
};

const she: LexiconEntry = {
  id: "p.she",
  lemma: "she",
  pos: "person",
  cefr: "A1",
  tags: [],
  gloss: { pl: "ona" },
  forms: { agreement: "3sg" },
};

const we: LexiconEntry = {
  id: "p.we",
  lemma: "we",
  pos: "person",
  cefr: "A1",
  tags: [],
  gloss: { pl: "my" },
  forms: { agreement: "1pl" },
};

const apple: LexiconEntry = {
  id: "n.apple",
  lemma: "apple",
  pos: "noun",
  cefr: "A1",
  tags: [],
  gloss: { pl: "jabłko" },
  forms: { countable: true, plural: "apples", article: "an" },
};

describe("inflect/en", () => {
  it("present.agree picks 3sg for he/she/it", () => {
    expect(applyInflector("present.agree", work, ["subject"], { slots: { subject: she } })).toBe("works");
  });

  it("present.agree returns base for plural subject", () => {
    expect(applyInflector("present.agree", work, ["subject"], { slots: { subject: we } })).toBe("work");
  });

  it("present.3sg uses verb table directly", () => {
    expect(applyInflector("present.3sg", study, [], { slots: {} })).toBe("studies");
  });

  it("regular3sg fallback for unknown verb", () => {
    const watch: LexiconEntry = {
      id: "v.watch",
      lemma: "watch",
      pos: "verb",
      cefr: "A1",
      tags: [],
      gloss: { pl: "x" },
    };
    expect(applyInflector("present.3sg", watch, [], { slots: {} })).toBe("watches");
  });

  it("do.negate picks doesn't for 3sg, don't otherwise", () => {
    expect(applyInflector("do.negate", work, ["subject"], { slots: { subject: she } })).toBe("doesn't work");
    expect(applyInflector("do.negate", work, ["subject"], { slots: { subject: we } })).toBe("don't work");
  });

  it("do.negate.wrong inverts the auxiliary", () => {
    expect(applyInflector("do.negate.wrong", work, ["subject"], { slots: { subject: she } })).toBe("don't work");
  });

  it("article and article.wrong invert correctly", () => {
    expect(applyInflector("article", apple, [], { slots: {} })).toBe("an");
    expect(applyInflector("article.wrong", apple, [], { slots: {} })).toBe("a");
  });

  it("cont.agree builds 'is/are/am +ing'", () => {
    expect(applyInflector("cont.agree", work, ["subject"], { slots: { subject: she } })).toBe("is working");
    expect(applyInflector("cont.agree", work, ["subject"], { slots: { subject: we } })).toBe("are working");
  });
});
