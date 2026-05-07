import { describe, expect, it } from "@jest/globals";
import { lexiconBundleFor, templatesForTopic } from "./content";
import { expandTemplate } from "./generator";

describe("smoke — sample rendered exercises", () => {
  it("renders a handful of fills and mcqs without errors", () => {
    const lex = lexiconBundleFor("en");
    const templates = templatesForTopic("en.tenses.present-simple");
    const samples: string[] = [];
    for (const t of templates) {
      const items = expandTemplate(t, lex, { seed: "smoke", count: 2 });
      for (const it of items) {
        if (it.exercise.type === "fill") {
          samples.push(`[fill] ${it.exercise.prompt} → ${it.exercise.answers[0]}`);
        } else if (it.exercise.type === "mcq") {
          samples.push(
            `[mcq] ${it.exercise.prompt} options=${it.exercise.options.join(" / ")} answer=${it.exercise.answer}`,
          );
        }
      }
    }
    // Visible in jest output:
    // eslint-disable-next-line no-console
    console.log(samples.join("\n"));
    expect(samples.length).toBeGreaterThan(4);
  });
});
