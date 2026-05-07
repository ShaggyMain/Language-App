/**
 * Template-based Exercise generator. Combines a TopicTemplate with a
 * Lexicon to produce concrete `Exercise` instances. Output schema is
 * unchanged — generated exercises validate against the same `Exercise`
 * zod schema as hand-authored content.
 *
 * Determinism: every call with the same `seed` produces the same output,
 * which lets the SRS layer rehydrate stored (template_id, slot_ids) pairs
 * without persisting rendered text.
 */

import type {
  CefrLevel,
  Exercise,
  Language,
  Lexicon,
  LexiconEntry,
  Pos,
  Slot,
  TopicTemplate,
} from "./types";
import { applyInflector as applyEn, type InflectCtx } from "./inflect/en";

const CEFR_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];

export type LexiconBundle = {
  language: Language;
  byPos: Record<Pos, LexiconEntry[]>;
  byId: Record<string, LexiconEntry>;
};

export function buildLexiconBundle(language: Language, lexicons: Lexicon[]): LexiconBundle {
  const byPos: Record<Pos, LexiconEntry[]> = {
    verb: [],
    noun: [],
    adj: [],
    person: [],
    place: [],
    time: [],
  };
  const byId: Record<string, LexiconEntry> = {};
  for (const lex of lexicons) {
    if (lex.language !== language) continue;
    for (const e of lex.entries) {
      byPos[e.pos].push(e);
      byId[e.id] = e;
    }
  }
  return { language, byPos, byId };
}

/* ───────────────────────── seeded RNG ───────────────────────── */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ───────────────────────── instance hash ───────────────────────── */

export function instanceHash(templateId: string, slotIds: Record<string, string>): string {
  const parts = Object.keys(slotIds)
    .sort()
    .map((k) => `${k}=${slotIds[k]}`);
  const str = `${templateId}|${parts.join("|")}`;
  let h1 = 2166136261 >>> 0;
  let h2 = 0x811c9dc5 >>> 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 16777619) >>> 0;
    h2 = Math.imul(h2 ^ c, 2654435761) >>> 0;
  }
  return (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).slice(0, 12);
}

/* ───────────────────────── slot filtering ───────────────────────── */

function cefrLeq(level: CefrLevel, max: CefrLevel): boolean {
  return CEFR_ORDER.indexOf(level) <= CEFR_ORDER.indexOf(max);
}

function entryMatches(entry: LexiconEntry, slot: Slot): boolean {
  if (entry.pos !== slot.pos) return false;
  const f = slot.filter;
  if (!f) return true;
  if (f.cefrMax && !cefrLeq(entry.cefr, f.cefrMax)) return false;
  if (f.tags && f.tags.length) {
    const tags = entry.tags ?? [];
    if (!f.tags.some((t) => tags.includes(t))) return false;
  }
  if (f.irregular !== undefined && (entry.forms?.irregular ?? false) !== f.irregular) return false;
  if (f.countable !== undefined && entry.forms?.countable !== f.countable) return false;
  if (f.agreement && entry.forms?.agreement !== f.agreement) return false;
  if (f.article && entry.forms?.article !== f.article) return false;
  return true;
}

function candidatesFor(slot: Slot, lex: LexiconBundle): LexiconEntry[] {
  return lex.byPos[slot.pos].filter((e) => entryMatches(e, slot));
}

/* ───────────────────────── pattern rendering ───────────────────────── */

const TOKEN_RE = /\{([a-zA-Z_][\w]*)(?::([a-zA-Z_0-9.]+)(?:\(([^)]*)\))?)?\}/g;

function getInflector(language: Language) {
  switch (language) {
    case "en":
      return applyEn;
    default:
      throw new Error(`No inflection registry for language "${language}"`);
  }
}

function render(
  pattern: string,
  language: Language,
  slots: Record<string, LexiconEntry>,
): string {
  const ctx: InflectCtx = { slots };
  const apply = getInflector(language);
  return pattern.replace(TOKEN_RE, (_full, name: string, modifier?: string, argsRaw?: string) => {
    const entry = slots[name];
    if (!entry) throw new Error(`Pattern references unknown slot "${name}"`);
    if (!modifier) return entry.lemma;
    const args = argsRaw ? argsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    return apply(modifier, entry, args, ctx);
  });
}

/* ───────────────────────── slot iteration ───────────────────────── */

type ChoiceMap = Record<string, LexiconEntry>;

function pickSlots(template: TopicTemplate, lex: LexiconBundle, rng: () => number): ChoiceMap | null {
  const choice: ChoiceMap = {};
  for (const slot of template.slots) {
    if (slot.bind) {
      const src = choice[slot.bind];
      if (!src) throw new Error(`Slot "${slot.name}" binds to unknown slot "${slot.bind}"`);
      choice[slot.name] = src;
      continue;
    }
    const candidates = candidatesFor(slot, lex);
    if (candidates.length === 0) return null;
    choice[slot.name] = candidates[Math.floor(rng() * candidates.length)];
  }
  return choice;
}

function slotIdsOf(choice: ChoiceMap): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(choice)) out[k] = choice[k].id;
  return out;
}

/* ───────────────────────── public API ───────────────────────── */

export type ExpandOptions = {
  seed?: string;
  count?: number;
  cefrMax?: CefrLevel;
};

export type GeneratedItem = {
  exercise: Exercise;
  templateId: string;
  instanceHash: string;
  slotIds: Record<string, string>;
};

/**
 * Try to produce up to `count` unique Exercise instances for a template.
 * Deduplicates by instanceHash. Bails after `count * 6` attempts in case
 * the template's slot space is small.
 */
export function expandTemplate(
  template: TopicTemplate,
  lex: LexiconBundle,
  opts: ExpandOptions = {},
): GeneratedItem[] {
  const count = opts.count ?? 8;
  const seed = opts.seed ?? `${template.id}:default`;
  const rng = mulberry32(seedFromString(seed));
  const out: GeneratedItem[] = [];
  const seen = new Set<string>();
  const maxAttempts = Math.max(count * 6, 24);

  for (let i = 0; i < maxAttempts && out.length < count; i++) {
    const choice = pickSlots(template, lex, rng);
    if (!choice) break;
    const slotIds = slotIdsOf(choice);
    const hash = instanceHash(template.id, slotIds);
    if (seen.has(hash)) continue;
    seen.add(hash);
    const item = compileWithChoice(template, choice, slotIds, hash, rng);
    if (item) out.push(item);
  }
  return out;
}

/**
 * Rehydrate a single Exercise from a (templateId, slotIds) pair. Used by
 * the SRS layer when scheduling a previously-seen instance.
 */
export function compileInstance(
  template: TopicTemplate,
  slotIds: Record<string, string>,
  lex: LexiconBundle,
): GeneratedItem | { error: string } {
  const choice: ChoiceMap = {};
  for (const slot of template.slots) {
    if (slot.bind) {
      const src = choice[slot.bind];
      if (!src) return { error: `Bind slot "${slot.bind}" missing in compileInstance` };
      choice[slot.name] = src;
      continue;
    }
    const id = slotIds[slot.name];
    if (!id) return { error: `Missing slotId for "${slot.name}"` };
    const entry = lex.byId[id];
    if (!entry) return { error: `Unknown lexicon entry "${id}"` };
    choice[slot.name] = entry;
  }
  const hash = instanceHash(template.id, slotIdsOf(choice));
  // Deterministic RNG keyed on the instance — ensures option order is stable.
  const rng = mulberry32(seedFromString(`${template.id}|${hash}`));
  const item = compileWithChoice(template, choice, slotIdsOf(choice), hash, rng);
  if (!item) return { error: "Failed to render exercise" };
  return item;
}

function compileWithChoice(
  template: TopicTemplate,
  choice: ChoiceMap,
  slotIds: Record<string, string>,
  hash: string,
  rng: () => number,
): GeneratedItem | null {
  try {
    const prompt = render(template.pattern, template.language, choice);
    const answers = template.answerPatterns.map((p) => render(p, template.language, choice));
    if (answers.some((a) => a.includes("{") || a.includes("}"))) return null;
    if (prompt.includes("{") || prompt.includes("}")) return null;

    if (template.produces === "fill") {
      const exercise: Exercise = {
        type: "fill",
        prompt,
        answers,
        ...(template.hint ? { hint: template.hint } : {}),
        ...(template.explanation ? { explanation: template.explanation } : {}),
      };
      return { exercise, templateId: template.id, instanceHash: hash, slotIds };
    }

    // produces === "mcq"
    const correct = answers[0];
    const distractors: string[] = [];
    for (const dp of template.distractorPatterns) {
      try {
        const rendered = render(dp, template.language, choice);
        if (!distractors.includes(rendered) && rendered !== correct) {
          distractors.push(rendered);
        }
      } catch {
        // skip distractor that fails to render (e.g. inflector mismatch)
      }
    }
    if (distractors.length < 1) return null;
    const options = shuffle([correct, ...distractors.slice(0, 3)], rng);
    const answer = options.indexOf(correct);
    if (answer < 0) return null;
    const exercise: Exercise = {
      type: "mcq",
      prompt,
      options,
      answer,
      ...(template.explanation ? { explanation: template.explanation } : {}),
    };
    return { exercise, templateId: template.id, instanceHash: hash, slotIds };
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(`[generator] ${template.id}: ${(e as Error).message}`);
    }
    return null;
  }
}

export const __test = { mulberry32, seedFromString, render, candidatesFor };
