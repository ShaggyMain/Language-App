import { describe, expect, it } from "@jest/globals";
import type { Language } from "./types";
import { allTopics, lexiconBundleFor, templatesForTopic } from "./content";
import { expandTemplate } from "./generator";

function sampleFor(language: Language): string[] {
  const lex = lexiconBundleFor(language);
  const samples: string[] = [];
  for (const topic of allTopics().filter((t) => t.language === language)) {
    const templates = templatesForTopic(topic.id);
    for (const t of templates) {
      const items = expandTemplate(t, lex, { seed: `smoke-${language}`, count: 2 });
      for (const it of items) {
        if (it.exercise.type === "fill") {
          samples.push(`[${language}/${t.id}] ${it.exercise.prompt} → ${it.exercise.answers[0]}`);
        } else if (it.exercise.type === "mcq") {
          samples.push(
            `[${language}/${t.id}] ${it.exercise.prompt} | ${it.exercise.options.join(" / ")} (idx=${it.exercise.answer})`,
          );
        }
      }
    }
  }
  return samples;
}

describe("smoke — sample rendered exercises", () => {
  it("EN — renders a handful of fills and mcqs without errors", () => {
    const samples = sampleFor("en");
    // eslint-disable-next-line no-console
    console.log(samples.join("\n"));
    expect(samples.length).toBeGreaterThan(20);
    for (const s of samples) expect(s).not.toMatch(/[{}]/);
  });

  it("DE — renders without errors", () => {
    const samples = sampleFor("de");
    // eslint-disable-next-line no-console
    console.log(samples.join("\n"));
    expect(samples.length).toBeGreaterThan(8);
    for (const s of samples) expect(s).not.toMatch(/[{}]/);
  });

  it("ES — renders without errors", () => {
    const samples = sampleFor("es");
    // eslint-disable-next-line no-console
    console.log(samples.join("\n"));
    expect(samples.length).toBeGreaterThan(8);
    for (const s of samples) expect(s).not.toMatch(/[{}]/);
  });
});
