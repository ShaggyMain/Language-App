#!/usr/bin/env -S npx tsx
/**
 * Generates additional TopicTemplate variants for an existing topic using
 * Claude. Output is written to content/proposals/<topicId>/<timestamp>.json
 * for human review before being merged into content/templates/<lang>/.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/generate-templates.ts <topicId> [count] [model]
 *
 * Examples:
 *   npx tsx scripts/generate-templates.ts en.tenses.present-simple 5
 *   npx tsx scripts/generate-templates.ts es.verbs.gustar 8 claude-opus-4-7
 *
 * Prompt-cache breakpoints are placed around the static schema/lexicon
 * preamble so re-runs against the same topic are cheap.
 */

import Anthropic from "@anthropic-ai/sdk";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import {
  allTopics,
  lexiconBundleFor,
  templatesForTopic,
} from "../lib/content";
import { TopicTemplate, type Language } from "../lib/types";
import { compileInstance, expandTemplate } from "../lib/generator";
import { inflectors as inflectorsEn } from "../lib/inflect/en";
import { inflectors as inflectorsDe } from "../lib/inflect/de";
import { inflectors as inflectorsEs } from "../lib/inflect/es";

const INFLECTORS_BY_LANG: Record<Language, Record<string, unknown>> = {
  en: inflectorsEn,
  de: inflectorsDe,
  es: inflectorsEs,
};

const DEFAULT_MODEL = "claude-sonnet-4-6";

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function ok(msg: string): void {
  console.log(`✓ ${msg}`);
}

function info(msg: string): void {
  console.log(`  ${msg}`);
}

async function main(): Promise<void> {
  const [topicId, countArg, modelArg] = process.argv.slice(2);
  if (!topicId) fail("Usage: generate-templates.ts <topicId> [count] [model]");
  const count = countArg ? parseInt(countArg, 10) : 5;
  const model = modelArg ?? DEFAULT_MODEL;
  if (!Number.isFinite(count) || count < 1) fail("count must be a positive integer");
  if (!process.env.ANTHROPIC_API_KEY) fail("Set ANTHROPIC_API_KEY before running.");

  const topic = allTopics().find((t) => t.id === topicId);
  if (!topic) fail(`Topic "${topicId}" not found in content/.`);

  const language = topic.language;
  const lex = lexiconBundleFor(language);
  const existing = templatesForTopic(topicId);
  const inflectors = Object.keys(INFLECTORS_BY_LANG[language]).sort();

  ok(`Topic: ${topic.title} [${topicId}] (${language.toUpperCase()})`);
  info(`Existing templates: ${existing.length}`);
  info(`Lexicon size: ${Object.keys(lex.byId).length} entries`);
  info(`Available inflectors: ${inflectors.join(", ")}`);
  info(`Asking ${model} for ${count} new template(s)...\n`);

  const client = new Anthropic();
  const message = await client.messages.create({
    model,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: buildSchemaContext(language, lex, inflectors),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: buildUserPrompt(topic, existing, count),
      },
    ],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const parsed = parseTemplates(text);
  ok(`Model returned ${parsed.length} candidate template(s).`);

  const valid: typeof parsed = [];
  for (const t of parsed) {
    const issue = validateCandidate(t, topic.language, lex);
    const id =
      t && typeof t === "object" && "id" in t && typeof t.id === "string" ? t.id : "<no-id>";
    if (issue) {
      console.warn(`  ⚠ ${id}: ${issue}`);
      continue;
    }
    valid.push(t);
  }
  ok(`${valid.length}/${parsed.length} passed schema + render validation.`);

  if (valid.length === 0) {
    console.warn("  No valid templates produced. Inspect the model output above.");
    console.log("\n--- raw response ---\n" + text);
    return;
  }

  const dir = join(process.cwd(), "content", "proposals", topicId);
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = join(dir, `${stamp}.json`);
  writeFileSync(path, JSON.stringify(valid, null, 2) + "\n", "utf8");

  ok(`Wrote ${valid.length} proposal(s) to ${path}`);
  info(`Review them, then move good ones to content/templates/${language}/<file>.json`);
  info(`and import the file in lib/content.ts.`);
}

const SYSTEM_PROMPT = `You are a language-learning content generator producing JSON
TopicTemplate objects. Each template, combined with a lexicon, generates
hundreds of unique grammar exercises (fill-in-the-blank or multiple choice).

Rules:
- Output ONLY a JSON array — no prose, no markdown fences, no commentary.
- Every template must satisfy the schema and use only the listed inflectors.
- For "fill" templates, reveal the base form of any verb/adjective slot in
  parentheses next to the blank, e.g. "{subject} ___ ({verb}) every day."
  (so the user knows which lemma to conjugate).
- For "mcq" templates, distractorPatterns must produce wrong answers that
  are recognizably different from the correct answer (no duplicates).
- Each template id must be unique and follow the pattern <lang>.<topic-slug>.<variant>.
- Patterns must produce semantically reasonable sentences for an A1-A2 learner;
  prefer common nouns/verbs from the lexicon's tags.
- Slot filters can use cefrMax, tags, agreement, gender, irregular, countable,
  category — only fields valid for that pos.`;

function buildSchemaContext(
  language: Language,
  lex: ReturnType<typeof lexiconBundleFor>,
  inflectors: string[],
): string {
  const sampleEntries = Object.values(lex.byId).slice(0, 12);
  const sampleByPos = (pos: string) =>
    Object.values(lex.byId).filter((e) => e.pos === pos).slice(0, 4);

  return `## Schema (TypeScript-style)

type TopicTemplate = {
  id: string;
  topicId: string;
  language: "${language}";
  produces: "fill" | "mcq";
  slots: Slot[];
  pattern: string;          // sentence with ___ for blank and {slot} placeholders
  answerPatterns: string[]; // first is canonical; one per accepted form
  distractorPatterns?: string[]; // mcq only, ≥1
  hint?: string;
  explanation?: string;
  tags?: string[];
};

type Slot = {
  name: string;
  pos: "verb" | "noun" | "adj" | "person" | "place" | "time" | "preposition";
  filter?: {
    cefrMax?: "A1" | "A2" | "B1" | "B2" | "C1";
    tags?: string[];
    agreement?: "1sg" | "2sg" | "3sg" | "1pl" | "2pl" | "3pl";
    gender?: "m" | "f" | "n";
    irregular?: boolean;
    countable?: boolean;
    article?: "a" | "an";
    category?: string;
  };
};

## Pattern syntax
- Plain text passes through unchanged.
- "{slot}" inserts the slot entry's lemma.
- "{slot:modifier}" applies a registered inflector to the slot.
- "{slot:modifier(arg)}" passes another slot's name as an argument
  (e.g. "{verb:present.agree(subject)}" agrees verb with subject's person).

## Available ${language.toUpperCase()} inflectors
${inflectors.map((m) => `- ${m}`).join("\n")}

## Sample lexicon entries

verbs:
${JSON.stringify(sampleByPos("verb"), null, 2)}

persons:
${JSON.stringify(sampleByPos("person"), null, 2)}

nouns:
${JSON.stringify(sampleByPos("noun"), null, 2)}

(There are ~${Object.keys(lex.byId).length} entries total in this language's lexicon.)`;
}

function buildUserPrompt(
  topic: ReturnType<typeof allTopics>[number],
  existing: ReturnType<typeof templatesForTopic>,
  count: number,
): string {
  const existingIds = existing.map((t) => t.id).join(", ");
  return `Generate ${count} NEW TopicTemplate(s) for this topic:

- topicId: "${topic.id}"
- language: "${topic.language}"
- title: "${topic.title}"
- summary: "${topic.summary}"
- CEFR: ${topic.cefrLevel}

Existing templates (style reference — DO NOT duplicate ids: ${existingIds || "none"}):

${JSON.stringify(existing, null, 2)}

Cover variations the existing set misses: alternative tenses/aspects, negation, questions,
different person/gender combinations, edge cases. Each new template should produce
sentences that are CLEARLY different from the existing templates.

Return ONLY the JSON array of new templates. No markdown, no commentary.`;
}

function parseTemplates(text: string): unknown[] {
  // Be permissive: if the model wrapped its answer in ```json fences, strip them.
  let body = text.trim();
  const fence = body.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/m);
  if (fence) body = fence[1].trim();

  // If the body starts with `[`, parse directly. Otherwise try to locate the
  // first array in the response (model occasionally adds a preamble).
  const start = body.indexOf("[");
  const end = body.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    fail("Model output did not contain a JSON array.");
  }
  body = body.slice(start, end + 1);

  try {
    const parsed = JSON.parse(body) as unknown;
    if (!Array.isArray(parsed)) fail("Top-level value is not an array.");
    return parsed as unknown[];
  } catch (e) {
    fail(`Failed to parse JSON array: ${(e as Error).message}`);
  }
}

function validateCandidate(
  raw: unknown,
  language: Language,
  lex: ReturnType<typeof lexiconBundleFor>,
): string | null {
  const r = TopicTemplate.safeParse(raw);
  if (!r.success) {
    return r.error.issues
      .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("; ");
  }
  if (r.data.language !== language) {
    return `language mismatch (got ${r.data.language})`;
  }
  // Try to actually render — catches missing inflectors / impossible slot filters.
  const items = expandTemplate(r.data, lex, { seed: "validate", count: 3 });
  if (items.length === 0) {
    return "expandTemplate produced 0 items (slot filter too narrow or inflector missing)";
  }
  // Round-trip through compileInstance for at least one item.
  const sanity = compileInstance(r.data, items[0].slotIds, lex);
  if ("error" in sanity) {
    return `compileInstance failed: ${sanity.error}`;
  }
  return null;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
