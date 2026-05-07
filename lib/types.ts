import { z } from "zod";

export const Language = z.enum(["en", "de", "es"]);
export type Language = z.infer<typeof Language>;

export const CefrLevel = z.enum(["A1", "A2", "B1", "B2", "C1"]);
export type CefrLevel = z.infer<typeof CefrLevel>;

export const Category = z.enum([
  "tenses",
  "verbs",
  "parts-of-speech",
  "voice",
  "moods",
  "syntax",
  "articles",
  "cases",
  "pronouns",
  "adjectives",
  "prepositions",
  "other",
]);
export type Category = z.infer<typeof Category>;

const TheoryBlock = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), markdown: z.string() }),
  z.object({
    kind: z.literal("table"),
    title: z.string().optional(),
    headers: z.array(z.string()),
    rows: z.array(z.array(z.string())),
  }),
  z.object({
    kind: z.literal("examples"),
    items: z.array(z.object({ source: z.string(), translation: z.string().optional() })),
  }),
]);
export type TheoryBlock = z.infer<typeof TheoryBlock>;

const baseExercise = { explanation: z.string().optional() };

export const Exercise = z.discriminatedUnion("type", [
  z.object({
    ...baseExercise,
    type: z.literal("mcq"),
    prompt: z.string(),
    options: z.array(z.string()).min(2).max(6),
    answer: z.number().int().nonnegative(),
  }),
  z.object({
    ...baseExercise,
    type: z.literal("fill"),
    prompt: z.string(),
    answers: z.array(z.string()).min(1),
    hint: z.string().optional(),
  }),
  z.object({
    ...baseExercise,
    type: z.literal("translate"),
    from: z.string(),
    to: Language,
    source: z.string(),
    answers: z.array(z.string()).min(1),
  }),
  z.object({
    ...baseExercise,
    type: z.literal("order"),
    prompt: z.string().optional(),
    tokens: z.array(z.string()).min(2),
    answer: z.array(z.string()).min(2),
  }),
  z.object({
    ...baseExercise,
    type: z.literal("conjugate"),
    verb: z.string(),
    tense: z.string(),
    persons: z.array(z.object({ person: z.string(), answer: z.string() })),
  }),
  z.object({
    ...baseExercise,
    type: z.literal("match"),
    pairs: z.array(z.object({ left: z.string(), right: z.string() })).min(3),
  }),
  z.object({
    ...baseExercise,
    type: z.literal("transform"),
    instruction: z.string(),
    source: z.string(),
    answers: z.array(z.string()).min(1),
  }),
  z.object({
    ...baseExercise,
    type: z.literal("dictation"),
    audioText: z.string(),
    answers: z.array(z.string()).min(1),
  }),
  z.object({
    ...baseExercise,
    type: z.literal("errorFix"),
    sentence: z.string(),
    answers: z.array(z.string()).min(1),
  }),
]);
export type Exercise = z.infer<typeof Exercise>;

export const Topic = z.object({
  id: z.string(),
  language: Language,
  category: Category,
  title: z.string(),
  summary: z.string(),
  cefrLevel: CefrLevel,
  prerequisites: z.array(z.string()).default([]),
  theory: z.array(TheoryBlock),
  exercises: z.array(Exercise).min(1),
});
export type Topic = z.infer<typeof Topic>;

/* ───────────────────────── Lexicon + Templates ─────────────────────────
 * Generator layer: TopicTemplate is a parameterized sentence that, when
 * combined with a Lexicon, produces concrete `Exercise` instances. Schemas
 * here are validated by zod but kept permissive on `forms` because each
 * language's inflection table has its own shape.
 * ────────────────────────────────────────────────────────────────────── */

export const Pos = z.enum(["verb", "noun", "adj", "person", "place", "time", "preposition"]);
export type Pos = z.infer<typeof Pos>;

export const Agreement = z.enum(["1sg", "2sg", "3sg", "1pl", "2pl", "3pl"]);
export type Agreement = z.infer<typeof Agreement>;

export const Gender = z.enum(["m", "f", "n"]);
export type Gender = z.infer<typeof Gender>;

const VerbPresent = z.object({
  "1sg": z.string().optional(),
  "2sg": z.string().optional(),
  "3sg": z.string(),
  "1pl": z.string().optional(),
  "2pl": z.string().optional(),
  "3pl": z.string().optional(),
});

const Forms = z
  .object({
    // verb
    present: VerbPresent.optional(),
    past: z.string().optional(),
    pastParticiple: z.string().optional(),
    gerund: z.string().optional(),
    irregular: z.boolean().optional(),
    // noun
    plural: z.string().optional(),
    countable: z.boolean().optional(),
    article: z.enum(["a", "an"]).optional(),
    gender: Gender.optional(),
    /** German nominative article ("der" / "die" / "das"). */
    articleNom: z.string().optional(),
    /** German accusative article ("den" / "die" / "das"). */
    articleAkk: z.string().optional(),
    /** Spanish definite article ("el" / "la" / "los" / "las"). */
    articleEs: z.string().optional(),
    // person
    agreement: Agreement.optional(),
    pronounSubject: z.string().optional(),
    pronounObject: z.string().optional(),
    /** Possessive adjective ("my", "your", "his", "her", "its", "our", "their"). */
    possessiveAdj: z.string().optional(),
    /** Possessive pronoun ("mine", "yours", ...). */
    possessivePron: z.string().optional(),
    // adjective
    comparative: z.string().optional(),
    superlative: z.string().optional(),
    // preposition / time / place — semantic categories (e.g. "place", "time")
    category: z.string().optional(),
  })
  .partial();
export type Forms = z.infer<typeof Forms>;

export const LexiconEntry = z.object({
  id: z.string(),
  lemma: z.string(),
  pos: Pos,
  cefr: CefrLevel,
  freqRank: z.number().int().positive().optional(),
  tags: z.array(z.string()).default([]),
  gloss: z.object({ pl: z.string() }),
  forms: Forms.optional(),
});
export type LexiconEntry = z.infer<typeof LexiconEntry>;

export const Lexicon = z.object({
  language: Language,
  entries: z.array(LexiconEntry),
});
export type Lexicon = z.infer<typeof Lexicon>;

export const SlotFilter = z
  .object({
    cefrMax: CefrLevel.optional(),
    tags: z.array(z.string()).optional(),
    irregular: z.boolean().optional(),
    countable: z.boolean().optional(),
    agreement: Agreement.optional(),
    article: z.enum(["a", "an"]).optional(),
    gender: Gender.optional(),
    category: z.string().optional(),
  })
  .partial();
export type SlotFilter = z.infer<typeof SlotFilter>;

export const Slot = z.object({
  name: z.string(),
  pos: Pos,
  filter: SlotFilter.optional(),
  /** If set, copy the chosen entry from another slot (e.g. agreement binding). */
  bind: z.string().optional(),
});
export type Slot = z.infer<typeof Slot>;

export const TopicTemplate = z.object({
  id: z.string(),
  topicId: z.string(),
  language: Language,
  produces: z.enum(["mcq", "fill"]),
  slots: z.array(Slot),
  /** Sentence with `___` for blank and `{slot}` placeholders. */
  pattern: z.string(),
  /** Filler(s) for the blank. First entry is the canonical answer. */
  answerPatterns: z.array(z.string()).min(1),
  /** Manual distractor patterns for MCQ. Rendered like answerPatterns. */
  distractorPatterns: z.array(z.string()).default([]),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  weight: z.number().positive().default(1),
  tags: z.array(z.string()).default([]),
});
export type TopicTemplate = z.infer<typeof TopicTemplate>;
