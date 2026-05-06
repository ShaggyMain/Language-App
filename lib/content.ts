import { Topic, type Language } from "./types";
import enPresentSimple from "../content/en/present-simple.json";

const RAW_TOPICS: unknown[] = [enPresentSimple];

let cache: Topic[] | null = null;

function load(): Topic[] {
  return RAW_TOPICS.map((raw, idx) => {
    const result = Topic.safeParse(raw);
    if (!result.success) {
      throw new Error(
        `Invalid topic at index ${idx}: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      );
    }
    return result.data;
  });
}

export function allTopics(): Topic[] {
  if (!cache) cache = load();
  return cache;
}

export function topicsForLanguage(lang: Language): Topic[] {
  return allTopics().filter((t) => t.language === lang);
}

export function topicById(id: string): Topic | undefined {
  return allTopics().find((t) => t.id === id);
}
