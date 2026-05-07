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

  /** Subject-form pronoun ("yo", "tú", ...). */
  "pron.subject": (entry) => entry.forms?.pronounSubject ?? entry.lemma,
  /** Object-form pronoun ("me", "te", "lo", ...). */
  "pron.object": (entry) => entry.forms?.pronounObject ?? entry.lemma,

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

  /** Indefinite article matching gender + number — un/una/unos/unas. */
  "article.indef": (entry) => {
    const g = genderOf(entry);
    const plural = pluralOf(entry);
    if (plural) return g === "f" ? "unas" : "unos";
    return g === "f" ? "una" : "un";
  },

  "article.indef.wrong": (entry) => {
    const correct = (() => {
      const g = genderOf(entry);
      return pluralOf(entry) ? (g === "f" ? "unas" : "unos") : g === "f" ? "una" : "un";
    })();
    return correct === "un" ? "una" : correct === "una" ? "un" : correct === "unos" ? "unas" : "unos";
  },

  /** Plural form of a noun. Spanish plurals are mostly +s / +es. */
  plural: (entry) => entry.forms?.plural ?? (entry.lemma.match(/[aeiouáéíóú]$/i) ? entry.lemma + "s" : entry.lemma + "es"),

  /** Past participle: -ar → -ado, -er/-ir → -ido. Irregulars from forms.pastParticiple. */
  pastParticiple: (entry) => {
    if (entry.forms?.pastParticiple) return entry.forms.pastParticiple;
    const lemma = entry.lemma;
    if (lemma.endsWith("ar")) return lemma.slice(0, -2) + "ado";
    if (lemma.endsWith("er") || lemma.endsWith("ir")) return lemma.slice(0, -2) + "ido";
    return lemma;
  },

  /**
   * Present perfect (pretérito perfecto): "he/has/ha/hemos/habéis/han + participle".
   * Usage: {verb:perf.agree(subject)}
   */
  "perf.agree": (entry, args, ctx) => {
    const subj = lookupSlot(args[0] ?? "subject", ctx);
    const ag = agreementOf(subj);
    const aux: Record<Agreement, string> = {
      "1sg": "he",
      "2sg": "has",
      "3sg": "ha",
      "1pl": "hemos",
      "2pl": "habéis",
      "3pl": "han",
    };
    const pp = entry.forms?.pastParticiple ?? (entry.lemma.endsWith("ar") ? entry.lemma.slice(0, -2) + "ado" : entry.lemma.slice(0, -2) + "ido");
    return `${aux[ag]} ${pp}`;
  },

  /**
   * "me/te/le gusta(n)" — quirky Spanish construction. The "subject" of
   * gustar is the thing that pleases; the experiencer is in indirect-object
   * form. Usage: {experiencer:gustar.indirect} returns "me/te/le/nos/os/les".
   */
  "gustar.indirect": (entry) => {
    const ag = agreementOf(entry);
    return ag === "1sg" ? "me" : ag === "2sg" ? "te" : ag === "1pl" ? "nos" : ag === "2pl" ? "os" : ag === "3pl" ? "les" : "le";
  },
};

export function applyInflector(name: string, entry: LexiconEntry, args: string[], ctx: InflectCtx): string {
  const fn = inflectors[name];
  if (!fn) throw new Error(`Unknown inflector "${name}" for language "es"`);
  return fn(entry, args, ctx);
}
