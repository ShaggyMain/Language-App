import type { Agreement, Gender, LexiconEntry } from "../types";

export type InflectCtx = {
  slots: Record<string, LexiconEntry>;
};

export type Inflector = (entry: LexiconEntry, args: string[], ctx: InflectCtx) => string;

function lookupSlot(name: string, ctx: InflectCtx): LexiconEntry {
  const e = ctx.slots[name];
  if (!e) throw new Error(`German inflector references unknown slot "${name}"`);
  return e;
}

function agreementOf(p: LexiconEntry): Agreement {
  return p.forms?.agreement ?? "3sg";
}

function genderOf(n: LexiconEntry): Gender {
  return n.forms?.gender ?? "n";
}

/** Regular German weak verb conjugation in Präsens. */
function regularPresent(lemma: string, ag: Agreement): string {
  const stem = lemma.replace(/en$/, "");
  switch (ag) {
    case "1sg":
      return stem + "e";
    case "2sg":
      return stem + "st";
    case "3sg":
      return stem + "t";
    case "1pl":
    case "3pl":
      return stem + "en";
    case "2pl":
      return stem + "t";
  }
}

function presentForm(verb: LexiconEntry, ag: Agreement): string {
  return verb.forms?.present?.[ag] ?? regularPresent(verb.lemma, ag);
}

const NOM_BY_GENDER: Record<Gender, string> = { m: "der", f: "die", n: "das" };
const AKK_BY_GENDER: Record<Gender, string> = { m: "den", f: "die", n: "das" };

export const inflectors: Record<string, Inflector> = {
  base: (e) => e.lemma,

  /** Verb conjugated for subject. */
  "present.agree": (entry, args, ctx) => {
    const subj = lookupSlot(args[0] ?? "subject", ctx);
    return presentForm(entry, agreementOf(subj));
  },

  /** Wrong agreement distractor: shift to a wrong person form. */
  "present.agree.wrong": (entry, args, ctx) => {
    const subj = lookupSlot(args[0] ?? "subject", ctx);
    const ag = agreementOf(subj);
    const wrong: Agreement = ag === "3sg" ? "1sg" : "3sg";
    return presentForm(entry, wrong);
  },

  /** Nominative definite article matching the noun's gender. */
  "art.nom": (entry) => entry.forms?.articleNom ?? NOM_BY_GENDER[genderOf(entry)],

  /** Accusative definite article matching the noun's gender. */
  "art.akk": (entry) => entry.forms?.articleAkk ?? AKK_BY_GENDER[genderOf(entry)],

  /** Wrong nominative article — pick a different gender's article. */
  "art.nom.wrong": (entry) => {
    const correct = entry.forms?.articleNom ?? NOM_BY_GENDER[genderOf(entry)];
    return correct === "der" ? "die" : correct === "die" ? "das" : "der";
  },

  /** Wrong accusative article — pick a different gender's. */
  "art.akk.wrong": (entry) => {
    const correct = entry.forms?.articleAkk ?? AKK_BY_GENDER[genderOf(entry)];
    return correct === "den" ? "die" : correct === "die" ? "das" : "den";
  },

  /**
   * Negation article "kein" agreeing with the noun's gender (nominativ).
   * Usage: {noun:kein.nom}
   */
  "kein.nom": (entry) => {
    const g = genderOf(entry);
    return g === "f" ? "keine" : "kein";
  },

  /**
   * Negation article "kein" in accusative.
   * Usage: {noun:kein.akk}
   */
  "kein.akk": (entry) => {
    const g = genderOf(entry);
    if (g === "m") return "keinen";
    if (g === "f") return "keine";
    return "kein";
  },

  /** Wrong "kein" form distractor — pick a different gender's. */
  "kein.akk.wrong": (entry) => {
    const correct = entry.forms?.gender === "m" ? "keinen" : entry.forms?.gender === "f" ? "keine" : "kein";
    return correct === "keinen" ? "keine" : correct === "keine" ? "kein" : "keinen";
  },

  /** Noun plural form (German plurals are highly irregular — uses forms.plural). */
  plural: (entry) => entry.forms?.plural ?? entry.lemma,
};

export function applyInflector(name: string, entry: LexiconEntry, args: string[], ctx: InflectCtx): string {
  const fn = inflectors[name];
  if (!fn) throw new Error(`Unknown inflector "${name}" for language "de"`);
  return fn(entry, args, ctx);
}
