import { Lexicon, Topic, TopicTemplate, type Language } from "./types";

// EN topics — original 15
import enPresentSimple from "../content/en/present-simple.json";
import enArticles from "../content/en/articles.json";
import enPresentContinuous from "../content/en/present-continuous.json";
import enPastSimple from "../content/en/past-simple.json";
import enPlurals from "../content/en/plurals.json";
import enComparatives from "../content/en/comparatives.json";
import enModals from "../content/en/modals.json";
import enPrepositions from "../content/en/prepositions.json";
import enPossessives from "../content/en/possessives.json";
import enDemonstratives from "../content/en/demonstratives.json";
import enPresentPerfect from "../content/en/present-perfect.json";
import enFutureGoingTo from "../content/en/future-going-to.json";
import enConditionalsFirst from "../content/en/conditionals-first.json";
import enPassiveVoice from "../content/en/passive-voice.json";
import enModalsAdvanced from "../content/en/modals-advanced.json";
// EN topics — A1 additions
import enDefiniteArticle from "../content/en/definite-article.json";
import enObjectPronouns from "../content/en/object-pronouns.json";
import enImperatives from "../content/en/imperatives.json";
import enAdjectivesBasic from "../content/en/adjectives-basic.json";
import enThereIsAre from "../content/en/there-is-are.json";
import enAdverbsFrequency from "../content/en/adverbs-frequency.json";
import enConjunctionsBasic from "../content/en/conjunctions-basic.json";
import enQuestionsBasic from "../content/en/questions-basic.json";
// EN topics — A2 additions
import enSuperlatives from "../content/en/superlatives.json";
import enAdverbsManner from "../content/en/adverbs-manner.json";
import enPastContinuous from "../content/en/past-continuous.json";
import enFutureWill from "../content/en/future-will.json";
import enUsedTo from "../content/en/used-to.json";
import enPresentPerfectVsPast from "../content/en/present-perfect-vs-past.json";
import enConjunctionsAdvanced from "../content/en/conjunctions-advanced.json";
import enPrepositionsMovement from "../content/en/prepositions-movement.json";
import enRelativeClausesBasic from "../content/en/relative-clauses-basic.json";
import enQuestionTags from "../content/en/question-tags.json";
// EN topics — B1 additions
import enPastPerfect from "../content/en/past-perfect.json";
import enPresentPerfectContinuous from "../content/en/present-perfect-continuous.json";
import enSecondConditional from "../content/en/second-conditional.json";
import enGerundsInfinitives from "../content/en/gerunds-infinitives.json";
import enReportedSpeech from "../content/en/reported-speech.json";
import enDefiningRelativeClauses from "../content/en/defining-relative-clauses.json";
import enPhrasalVerbsBasic from "../content/en/phrasal-verbs-basic.json";
import enFutureContinuous from "../content/en/future-continuous.json";
// EN topics — B2 additions
import enThirdConditional from "../content/en/third-conditional.json";
import enMixedConditionals from "../content/en/mixed-conditionals.json";
import enReportedSpeechQuestions from "../content/en/reported-speech-questions.json";
import enWishRegret from "../content/en/wish-regret.json";
import enNonDefiningRelativeClauses from "../content/en/non-defining-relative-clauses.json";
import enModalsDeduction from "../content/en/modals-deduction.json";
import enCausative from "../content/en/causative.json";
import enFuturePerfect from "../content/en/future-perfect.json";
// EN topics — C1 additions
import enInversion from "../content/en/inversion.json";
import enCleftSentences from "../content/en/cleft-sentences.json";
import enSubjunctive from "../content/en/subjunctive.json";
import enModalsPerfect from "../content/en/modals-perfect.json";
import enDiscourseMarkers from "../content/en/discourse-markers.json";

// EN lexicons
import enPersons from "../content/lexicons/en/persons.json";
import enVerbs from "../content/lexicons/en/verbs.json";
import enNouns from "../content/lexicons/en/nouns.json";
import enPlaces from "../content/lexicons/en/places.json";
import enTimeMarkers from "../content/lexicons/en/timeMarkers.json";
import enAdjectives from "../content/lexicons/en/adjectives.json";
import enPrepositionsLex from "../content/lexicons/en/prepositions.json";

// EN templates
import enTplPresentSimple from "../content/templates/en/present-simple.json";
import enTplArticles from "../content/templates/en/articles.json";
import enTplPresentContinuous from "../content/templates/en/present-continuous.json";
import enTplPastSimple from "../content/templates/en/past-simple.json";
import enTplPlurals from "../content/templates/en/plurals.json";
import enTplComparatives from "../content/templates/en/comparatives.json";
import enTplModals from "../content/templates/en/modals.json";
import enTplPrepositions from "../content/templates/en/prepositions.json";
import enTplPossessives from "../content/templates/en/possessives.json";
import enTplDemonstratives from "../content/templates/en/demonstratives.json";
import enTplPresentPerfect from "../content/templates/en/present-perfect.json";
import enTplFutureGoingTo from "../content/templates/en/future-going-to.json";
import enTplConditionalsFirst from "../content/templates/en/conditionals-first.json";
import enTplPassiveVoice from "../content/templates/en/passive-voice.json";
import enTplModalsAdvanced from "../content/templates/en/modals-advanced.json";

// DE — original 9
import deArticlesNominativ from "../content/de/articles-nominativ.json";
import deArticlesAkkusativ from "../content/de/articles-akkusativ.json";
import deSeinHaben from "../content/de/sein-haben.json";
import dePresentRegular from "../content/de/present-regular.json";
import deModalverben from "../content/de/modalverben.json";
import deNegation from "../content/de/negation.json";
import dePlural from "../content/de/plural.json";
import dePersonalpronomen from "../content/de/personalpronomen.json";
import deWfragen from "../content/de/wfragen.json";
// DE — A1 additions
import dePossessivpronomen from "../content/de/possessivpronomen.json";
import deImperativ from "../content/de/imperativ.json";
import deJaNeinFragen from "../content/de/ja-nein-fragen.json";
import deTrennbareVerben from "../content/de/trennbare-verben.json";
import dePraepositionen from "../content/de/praepositionen.json";
// DE — A2 additions
import deDativ from "../content/de/dativ.json";
import dePerfekt from "../content/de/perfekt.json";
import deKomparativSuperlativ from "../content/de/komparativ-superlativ.json";
import deWechselpraepositionen from "../content/de/wechselpraepositionen.json";
import deKonjunktionen from "../content/de/konjunktionen.json";
import dePraeteritum from "../content/de/praeteritum.json";
import deRelativsaetze from "../content/de/relativsaetze.json";
import deReflexiveVerben from "../content/de/reflexive-verben.json";
// DE — B1 additions
import dePassiv from "../content/de/passiv.json";
import deGenitiv from "../content/de/genitiv.json";
import deInfinitivZu from "../content/de/infinitiv-zu.json";
import deFuturI from "../content/de/futur-I.json";
import deKonjunktivII from "../content/de/konjunktiv-II.json";
import deNebensaetzeErweitert from "../content/de/nebensaetze-erweitert.json";
import dePlusquamperfekt from "../content/de/plusquamperfekt.json";
// DE — B2 additions
import dePassivPraeteritum from "../content/de/passiv-praeteritum.json";
import deZweiteiligeKonnektoren from "../content/de/zweiteilige-konnektoren.json";
import deKonjunktivI from "../content/de/konjunktiv-I.json";
import deModalpartikeln from "../content/de/modalpartikeln.json";
import dePersons from "../content/lexicons/de/persons.json";
import deVerbs from "../content/lexicons/de/verbs.json";
import deNouns from "../content/lexicons/de/nouns.json";
import deTplArticlesNominativ from "../content/templates/de/articles-nominativ.json";
import deTplArticlesAkkusativ from "../content/templates/de/articles-akkusativ.json";
import deTplSeinHaben from "../content/templates/de/sein-haben.json";
import deTplPresentRegular from "../content/templates/de/present-regular.json";
import deTplModalverben from "../content/templates/de/modalverben.json";
import deTplNegation from "../content/templates/de/negation.json";
import deTplPlural from "../content/templates/de/plural.json";
import deTplPersonalpronomen from "../content/templates/de/personalpronomen.json";
import deTplWfragen from "../content/templates/de/wfragen.json";

// ES
import esArticles from "../content/es/articles.json";
import esSerEstar from "../content/es/ser-estar.json";
import esPresentAr from "../content/es/present-ar.json";
import esPresentErIr from "../content/es/present-er-ir.json";
import esArticlesIndefinite from "../content/es/articles-indefinite.json";
import esPlural from "../content/es/plural.json";
import esGustar from "../content/es/gustar.json";
import esPossessives from "../content/es/possessives.json";
import esPreteritoPerfecto from "../content/es/preterito-perfecto.json";
import esPreguntas from "../content/es/preguntas.json";
import esPersons from "../content/lexicons/es/persons.json";
import esVerbs from "../content/lexicons/es/verbs.json";
import esNouns from "../content/lexicons/es/nouns.json";
import esTplArticles from "../content/templates/es/articles.json";
import esTplSerEstar from "../content/templates/es/ser-estar.json";
import esTplPresentAr from "../content/templates/es/present-ar.json";
import esTplPresentErIr from "../content/templates/es/present-er-ir.json";
import esTplArticlesIndefinite from "../content/templates/es/articles-indefinite.json";
import esTplPlural from "../content/templates/es/plural.json";
import esTplGustar from "../content/templates/es/gustar.json";
import esTplPossessives from "../content/templates/es/possessives.json";
import esTplPreteritoPerfecto from "../content/templates/es/preterito-perfecto.json";
import esTplPreguntas from "../content/templates/es/preguntas.json";

import { buildLexiconBundle, type LexiconBundle } from "./generator";

const RAW_TOPICS: unknown[] = [
  // English — A1
  enPresentSimple,
  enArticles,
  enDefiniteArticle,
  enPlurals,
  enPossessives,
  enObjectPronouns,
  enDemonstratives,
  enPrepositions,
  enImperatives,
  enAdjectivesBasic,
  enThereIsAre,
  enAdverbsFrequency,
  enConjunctionsBasic,
  enQuestionsBasic,
  enPresentContinuous,
  // English — A2
  enPastSimple,
  enComparatives,
  enSuperlatives,
  enAdverbsManner,
  enPastContinuous,
  enFutureGoingTo,
  enFutureWill,
  enUsedTo,
  enPresentPerfect,
  enPresentPerfectVsPast,
  enModals,
  enModalsAdvanced,
  enConjunctionsAdvanced,
  enPrepositionsMovement,
  enRelativeClausesBasic,
  enQuestionTags,
  // English — B1
  enPastPerfect,
  enPresentPerfectContinuous,
  enConditionalsFirst,
  enSecondConditional,
  enGerundsInfinitives,
  enReportedSpeech,
  enDefiningRelativeClauses,
  enPhrasalVerbsBasic,
  enFutureContinuous,
  enPassiveVoice,
  // English — B2
  enThirdConditional,
  enMixedConditionals,
  enReportedSpeechQuestions,
  enWishRegret,
  enNonDefiningRelativeClauses,
  enModalsDeduction,
  enCausative,
  enFuturePerfect,
  // English — C1
  enInversion,
  enCleftSentences,
  enSubjunctive,
  enModalsPerfect,
  enDiscourseMarkers,
  // German — A1
  deArticlesNominativ,
  deArticlesAkkusativ,
  deSeinHaben,
  dePresentRegular,
  deModalverben,
  deNegation,
  dePlural,
  dePersonalpronomen,
  deWfragen,
  dePossessivpronomen,
  deImperativ,
  deJaNeinFragen,
  deTrennbareVerben,
  dePraepositionen,
  // German — A2
  deDativ,
  dePerfekt,
  deKomparativSuperlativ,
  deWechselpraepositionen,
  deKonjunktionen,
  dePraeteritum,
  deRelativsaetze,
  deReflexiveVerben,
  // German — B1
  dePassiv,
  deGenitiv,
  deInfinitivZu,
  deFuturI,
  deKonjunktivII,
  deNebensaetzeErweitert,
  dePlusquamperfekt,
  // German — B2
  dePassivPraeteritum,
  deZweiteiligeKonnektoren,
  deKonjunktivI,
  deModalpartikeln,
  esArticles,
  esSerEstar,
  esPresentAr,
  esPresentErIr,
  esArticlesIndefinite,
  esPlural,
  esGustar,
  esPossessives,
  esPreteritoPerfecto,
  esPreguntas,
];

const RAW_LEXICONS: unknown[] = [
  enPersons,
  enVerbs,
  enNouns,
  enPlaces,
  enTimeMarkers,
  enAdjectives,
  enPrepositionsLex,
  dePersons,
  deVerbs,
  deNouns,
  esPersons,
  esVerbs,
  esNouns,
];

const RAW_TEMPLATE_FILES: unknown[] = [
  enTplPresentSimple,
  enTplArticles,
  enTplPresentContinuous,
  enTplPastSimple,
  enTplPlurals,
  enTplComparatives,
  enTplModals,
  enTplPrepositions,
  enTplPossessives,
  enTplDemonstratives,
  enTplPresentPerfect,
  enTplFutureGoingTo,
  enTplConditionalsFirst,
  enTplPassiveVoice,
  enTplModalsAdvanced,
  deTplArticlesNominativ,
  deTplArticlesAkkusativ,
  deTplSeinHaben,
  deTplPresentRegular,
  deTplModalverben,
  deTplNegation,
  deTplPlural,
  deTplPersonalpronomen,
  deTplWfragen,
  esTplArticles,
  esTplSerEstar,
  esTplPresentAr,
  esTplPresentErIr,
  esTplArticlesIndefinite,
  esTplPlural,
  esTplGustar,
  esTplPossessives,
  esTplPreteritoPerfecto,
  esTplPreguntas,
];

type Caches = {
  topics: Topic[];
  lexicons: Lexicon[];
  templates: TopicTemplate[];
  bundles: Partial<Record<Language, LexiconBundle>>;
};

let cache: Caches | null = null;

function describeIssues(label: string, idx: number, issues: { path: (string | number)[]; message: string }[]): string {
  return `Invalid ${label} at index ${idx}: ${issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`;
}

function load(): Caches {
  const topics = RAW_TOPICS.map((raw, idx) => {
    const r = Topic.safeParse(raw);
    if (!r.success) throw new Error(describeIssues("topic", idx, r.error.issues));
    return r.data;
  });

  const lexicons = RAW_LEXICONS.map((raw, idx) => {
    const r = Lexicon.safeParse(raw);
    if (!r.success) throw new Error(describeIssues("lexicon", idx, r.error.issues));
    return r.data;
  });

  const templates: TopicTemplate[] = [];
  RAW_TEMPLATE_FILES.forEach((raw, fileIdx) => {
    const arr = Array.isArray(raw) ? raw : [raw];
    arr.forEach((entry, idx) => {
      const r = TopicTemplate.safeParse(entry);
      if (!r.success) {
        throw new Error(describeIssues(`template (file ${fileIdx})`, idx, r.error.issues));
      }
      templates.push(r.data);
    });
  });

  return { topics, lexicons, templates, bundles: {} };
}

function ensure(): Caches {
  if (!cache) cache = load();
  return cache;
}

export function allTopics(): Topic[] {
  return ensure().topics;
}

export function topicsForLanguage(lang: Language): Topic[] {
  return ensure().topics.filter((t) => t.language === lang);
}

export function topicById(id: string): Topic | undefined {
  return ensure().topics.find((t) => t.id === id);
}

export function templatesForTopic(topicId: string): TopicTemplate[] {
  return ensure().templates.filter((t) => t.topicId === topicId);
}

export function lexiconBundleFor(language: Language): LexiconBundle {
  const c = ensure();
  if (!c.bundles[language]) {
    c.bundles[language] = buildLexiconBundle(language, c.lexicons);
  }
  return c.bundles[language]!;
}

export function templateById(id: string): TopicTemplate | undefined {
  return ensure().templates.find((t) => t.id === id);
}
