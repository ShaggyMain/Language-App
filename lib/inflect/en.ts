import type { Agreement, LexiconEntry } from "../types";

/**
 * English inflection registry. Each function takes the slot's chosen entry and
 * a context with other slots' entries, and returns the rendered string.
 *
 * Pattern syntax in templates: `{slot:modifier(arg1,arg2)}`. Args reference
 * other slot names. `{slot}` (no modifier) returns the lemma verbatim.
 */

export type InflectCtx = {
  slots: Record<string, LexiconEntry>;
};

export type Inflector = (entry: LexiconEntry, args: string[], ctx: InflectCtx) => string;

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

function regular3sg(lemma: string): string {
  if (/(s|x|z|ch|sh|o)$/i.test(lemma)) return lemma + "es";
  if (/[^aeiou]y$/i.test(lemma)) return lemma.slice(0, -1) + "ies";
  return lemma + "s";
}

function regularGerund(lemma: string): string {
  if (/[^aeiou]e$/i.test(lemma)) return lemma.slice(0, -1) + "ing";
  if (/ie$/i.test(lemma)) return lemma.slice(0, -2) + "ying";
  return lemma + "ing";
}

function guessArticle(lemma: string): "a" | "an" {
  const first = lemma.trim()[0]?.toLowerCase() ?? "";
  return VOWELS.has(first) ? "an" : "a";
}

function present3sg(verb: LexiconEntry): string {
  return verb.forms?.present?.["3sg"] ?? regular3sg(verb.lemma);
}

function presentForAgreement(verb: LexiconEntry, agreement: Agreement): string {
  const direct = verb.forms?.present?.[agreement];
  if (direct) return direct;
  return agreement === "3sg" ? present3sg(verb) : verb.lemma;
}

function lookupSubject(name: string, ctx: InflectCtx): LexiconEntry {
  const subj = ctx.slots[name];
  if (!subj) {
    throw new Error(`Inflector references unknown slot "${name}"`);
  }
  return subj;
}

function agreementOf(subject: LexiconEntry): Agreement {
  return subject.forms?.agreement ?? "3sg";
}

function regularPast(lemma: string): string {
  if (/e$/i.test(lemma)) return lemma + "d";
  if (/[^aeiou]y$/i.test(lemma)) return lemma.slice(0, -1) + "ied";
  return lemma + "ed";
}

function regularComparative(lemma: string): string {
  if (lemma.length <= 6) {
    if (/e$/i.test(lemma)) return lemma + "r";
    if (/[^aeiou]y$/i.test(lemma)) return lemma.slice(0, -1) + "ier";
    return lemma + "er";
  }
  return `more ${lemma}`;
}

export const inflectors: Record<string, Inflector> = {
  /** Verb base form (lemma). */
  base: (entry) => entry.lemma,

  /** Verb gerund: forms.gerund or regular rule. */
  gerund: (entry) => entry.forms?.gerund ?? regularGerund(entry.lemma),

  /** Verb 3rd person singular. */
  "present.3sg": (entry) => present3sg(entry),

  /** Verb agreeing with subject slot. Usage: {verb:present.agree(subject)} */
  "present.agree": (entry, args, ctx) => {
    const subj = lookupSubject(args[0] ?? "subject", ctx);
    return presentForAgreement(entry, agreementOf(subj));
  },

  /**
   * Verb gerund with `is/are/am` based on subject agreement (present continuous).
   * Used as a distractor for present simple. Usage: {verb:cont.agree(subject)}
   */
  "cont.agree": (entry, args, ctx) => {
    const subj = lookupSubject(args[0] ?? "subject", ctx);
    const ag = agreementOf(subj);
    const aux = ag === "1sg" ? "am" : ag === "3sg" ? "is" : "are";
    return `${aux} ${entry.forms?.gerund ?? regularGerund(entry.lemma)}`;
  },

  /**
   * "do/does + base" auxiliary form for negation/questions.
   * Usage: {verb:do.negate(subject)} → "doesn't work" / "don't work"
   */
  "do.negate": (entry, args, ctx) => {
    const subj = lookupSubject(args[0] ?? "subject", ctx);
    const aux = agreementOf(subj) === "3sg" ? "doesn't" : "don't";
    return `${aux} ${entry.lemma}`;
  },

  /** Wrong auxiliary distractor: swap don't↔doesn't. */
  "do.negate.wrong": (entry, args, ctx) => {
    const subj = lookupSubject(args[0] ?? "subject", ctx);
    const aux = agreementOf(subj) === "3sg" ? "don't" : "doesn't";
    return `${aux} ${entry.lemma}`;
  },

  /** Subject-form pronoun if defined, else lemma. */
  "pron.subject": (entry) => entry.forms?.pronounSubject ?? entry.lemma,

  /** Object-form pronoun. */
  "pron.object": (entry) => entry.forms?.pronounObject ?? entry.lemma,

  /** Noun plural. */
  plural: (entry) => entry.forms?.plural ?? entry.lemma + "s",

  /** Indefinite article: "a" or "an" matching the noun. */
  article: (entry) => entry.forms?.article ?? guessArticle(entry.lemma),

  /** Wrong article distractor: swap a↔an. */
  "article.wrong": (entry) => {
    const correct = entry.forms?.article ?? guessArticle(entry.lemma);
    return correct === "a" ? "an" : "a";
  },

  /** "be" auxiliary agreeing with subject — am/is/are. */
  "be.agree": (_entry, args, ctx) => {
    const subj = lookupSubject(args[0] ?? "subject", ctx);
    const ag = agreementOf(subj);
    return ag === "1sg" ? "am" : ag === "3sg" ? "is" : "are";
  },

  /** Wrong "be" form distractor: shift the auxiliary by one slot. */
  "be.agree.wrong": (_entry, args, ctx) => {
    const subj = lookupSubject(args[0] ?? "subject", ctx);
    const ag = agreementOf(subj);
    return ag === "1sg" ? "is" : ag === "3sg" ? "are" : "am";
  },

  /** Verb past form. */
  past: (entry) => entry.forms?.past ?? regularPast(entry.lemma),

  /** Wrong past form: present 3sg as a distractor. */
  "past.wrong": (entry) => present3sg(entry),

  /** Past participle (for perfect tenses + passive). */
  pastParticiple: (entry) =>
    entry.forms?.pastParticiple ?? entry.forms?.past ?? regularPast(entry.lemma),

  /**
   * Present perfect agreeing with subject: "have/has + past participle".
   * Usage: {verb:perf.agree(subject)}
   */
  "perf.agree": (entry, args, ctx) => {
    const subj = lookupSubject(args[0] ?? "subject", ctx);
    const aux = agreementOf(subj) === "3sg" ? "has" : "have";
    const pp = entry.forms?.pastParticiple ?? entry.forms?.past ?? regularPast(entry.lemma);
    return `${aux} ${pp}`;
  },

  /** Wrong perfect form: swap auxiliary. */
  "perf.agree.wrong": (entry, args, ctx) => {
    const subj = lookupSubject(args[0] ?? "subject", ctx);
    const aux = agreementOf(subj) === "3sg" ? "have" : "has";
    const pp = entry.forms?.pastParticiple ?? entry.forms?.past ?? regularPast(entry.lemma);
    return `${aux} ${pp}`;
  },

  /**
   * Passive form agreeing with subject: "is/are + past participle".
   * Usage: {verb:passive.agree(subject)}
   */
  "passive.agree": (entry, args, ctx) => {
    const subj = lookupSubject(args[0] ?? "subject", ctx);
    const ag = agreementOf(subj);
    const aux = ag === "1sg" ? "am" : ag === "3sg" ? "is" : "are";
    const pp = entry.forms?.pastParticiple ?? entry.forms?.past ?? regularPast(entry.lemma);
    return `${aux} ${pp}`;
  },

  /** Possessive adjective of the subject (my / your / his / her / our / their). */
  "pron.poss": (entry) => entry.forms?.possessiveAdj ?? `${entry.lemma}'s`,

  /** Adjective comparative ("er" / "more"). */
  comparative: (entry) => entry.forms?.comparative ?? regularComparative(entry.lemma),

  /** Adjective superlative. */
  superlative: (entry) =>
    entry.forms?.superlative ?? (entry.lemma.length <= 6 ? `${entry.lemma}est` : `most ${entry.lemma}`),
};

export function applyInflector(name: string, entry: LexiconEntry, args: string[], ctx: InflectCtx): string {
  const fn = inflectors[name];
  if (!fn) throw new Error(`Unknown inflector "${name}" for language "en"`);
  return fn(entry, args, ctx);
}
