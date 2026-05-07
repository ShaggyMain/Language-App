import { Lexicon, Topic, TopicTemplate, type Language } from "./types";
import enPresentSimple from "../content/en/present-simple.json";
import enPersons from "../content/lexicons/en/persons.json";
import enVerbs from "../content/lexicons/en/verbs.json";
import enNouns from "../content/lexicons/en/nouns.json";
import enPlaces from "../content/lexicons/en/places.json";
import enTimeMarkers from "../content/lexicons/en/timeMarkers.json";
import enPresentSimpleTemplates from "../content/templates/en/present-simple.json";
import { buildLexiconBundle, type LexiconBundle } from "./generator";

const RAW_TOPICS: unknown[] = [enPresentSimple];

const RAW_LEXICONS: unknown[] = [enPersons, enVerbs, enNouns, enPlaces, enTimeMarkers];

const RAW_TEMPLATE_FILES: unknown[] = [enPresentSimpleTemplates];

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
