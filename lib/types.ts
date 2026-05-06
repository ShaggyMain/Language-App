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

const Exercise = z.discriminatedUnion("type", [
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
