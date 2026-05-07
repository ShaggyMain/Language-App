import type { Agreement, Gender, LexiconEntry } from "../types";

export type InflectCtx = {
  slots: Record<string, LexiconEntry>;
};

export type Inflector = (entry: LexiconEntry, args: string[], ctx: InflectCtx) => string;

function lookupSlot(name: string, ctx: InflectCtx): LexiconEntry {
  const e = ctx.slots[name];
  if (!e) throw new Error(`Spanish inflector references unknown slot "${name}"`);
  return e;
}

function agreementOf(p: LexiconEntry): Agreement {
  return p.forms?.agreement ?? "3sg";
}

function genderOf(n: LexiconEntry): Gender {
  return n.forms?.gender ?? "m";
}

const REGULAR_AR: Record<Agreement, string> = {
  "1sg": "o",
  "2sg": "as",
  "3sg": "a",
  "1pl": "amos",
  "2pl": "áis",
  "3pl": "an",
};

const REGULAR_ER: Record<Agreement, string> = {
  "1sg": "o",
  "2sg": "es",
  "3sg": "e",
  "1pl": "emos",
  "2pl": "éis",
  "3pl": "en",
};

const REGULAR_IR: Record<Agreement, string> = {
  "1sg": "o",
  "2sg": "es",
  "3sg": "e",
  "1pl": "imos",
  "2pl": "ís",
  "3pl": "en",
};

function regularPresent(lemma: string, ag: Agreement): string {
  if (lemma.endsWith("ar")) return lemma.slice(0, -2) + REGULAR_AR[ag];
  if (lemma.endsWith("er")) return lemma.slice(0, -2) + REGULAR_ER[ag];
  if (lemma.endsWith("ir")) return lemma.slice(0, -2) + REGULAR_IR[ag];
  return lemma;
}

function presentForm(verb: LexiconEntry, ag: Agreement): string {
  return verb.forms?.present?.[ag] ?? regularPresent(verb.lemma, ag);
}

function pluralOf(n: LexiconEntry): boolean {
  return ["1pl", "2pl", "3pl"].includes(n.forms?.agreement ?? "3sg");
}

function articleFor(n: LexiconEntry, plural: boolean): string {
  if (n.forms?.articleEs) return n.forms.articleEs;
  const g = genderOf(n);
  if (plural) return g === "f" ? "las" : "los";
  return g === "f" ? "la" : "el";
}

export const inflectors: Record<string, Inflector> = {
  base: (e) => e.lemma,

  /** Verb conjugated for subject (present indicative). */
  "present.agree": (entry, args, ctx) => {
    const subj = lookupSlot(args[0] ?? "subject", ctx);
    return presentForm(entry, agreementOf(subj));
  },

  "present.agree.wrong": (entry, args, ctx) => {
    const subj = lookupSlot(args[0] ?? "subject", ctx);
    const ag = agreementOf(subj);
    const wrong: Agreement = ag === "3sg" ? "1sg" : "3sg";
    return presentForm(entry, wrong);
  },

  /** Definite article — singular form. */
  article: (entry) => articleFor(entry, pluralOf(entry)),

  /** Wrong article — flip gender. */
  "article.wrong": (entry) => {
    const correct = articleFor(entry, pluralOf(entry));
    return correct === "el" ? "la" : correct === "la" ? "el" : correct === "los" ? "las" : "los";
  },
};

export function applyInflector(name: string, entry: LexiconEntry, args: string[], ctx: InflectCtx): string {
  const fn = inflectors[name];
  if (!fn) throw new Error(`Unknown inflector "${name}" for language "es"`);
  return fn(entry, args, ctx);
}
