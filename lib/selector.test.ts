import { describe, expect, it } from "@jest/globals";
import { lexiconBundleFor, templatesForTopic, topicById } from "./content";
import { createMemoryRepos } from "./db";
import { pickSessionExercises, recordItemSeen } from "./selector";

const USER = "test-user";

describe("pickSessionExercises", () => {
  it("returns the requested count when pool is large enough", async () => {
    const topic = topicById("en.tenses.present-simple")!;
    const templates = templatesForTopic(topic.id);
    const lex = lexiconBundleFor("en");
    const repos = createMemoryRepos();
    const items = await pickSessionExercises(topic, templates, lex, repos, {
      userId: USER,
      mode: "practice",
      count: 10,
      seed: "fixed-1",
    });
    expect(items.length).toBe(10);
  });

  it("includes at least one authored exercise when supported authored exist", async () => {
    const topic = topicById("en.tenses.present-simple")!;
    const templates = templatesForTopic(topic.id);
    const lex = lexiconBundleFor("en");
    const repos = createMemoryRepos();
    const items = await pickSessionExercises(topic, templates, lex, repos, {
      userId: USER,
      mode: "practice",
      count: 10,
      seed: "fixed-2",
    });
    const authored = items.filter((i) => i.origin === "authored");
    expect(authored.length).toBeGreaterThanOrEqual(1);
  });

  it("respects max MCQ ratio (default 0.6)", async () => {
    const topic = topicById("en.tenses.present-simple")!;
    const templates = templatesForTopic(topic.id);
    const lex = lexiconBundleFor("en");
    const repos = createMemoryRepos();
    const items = await pickSessionExercises(topic, templates, lex, repos, {
      userId: USER,
      mode: "practice",
      count: 10,
      seed: "mix-test",
    });
    const mcq = items.filter((i) => i.exercise.type === "mcq").length;
    expect(mcq).toBeLessThanOrEqual(7);
  });

  it("avoids items seen in the last K sessions", async () => {
    const topic = topicById("en.tenses.present-simple")!;
    const templates = templatesForTopic(topic.id);
    const lex = lexiconBundleFor("en");
    const repos = createMemoryRepos();

    // Run 3 sessions, marking everything as seen each time.
    const allHashes = new Set<string>();
    for (let s = 0; s < 3; s++) {
      const sid = await repos.log.startSession({ userId: USER, topicId: topic.id, startedAt: Date.now() });
      const items = await pickSessionExercises(topic, templates, lex, repos, {
        userId: USER,
        mode: "practice",
        count: 10,
        seed: `s${s}`,
      });
      for (const it of items) {
        allHashes.add(it.instanceHash);
        await recordItemSeen(repos, USER, topic.id, sid, it, true);
      }
    }

    // Fourth session should mostly avoid the previously seen generator items.
    const sid4 = await repos.log.startSession({ userId: USER, topicId: topic.id, startedAt: Date.now() });
    const items4 = await pickSessionExercises(topic, templates, lex, repos, {
      userId: USER,
      mode: "practice",
      count: 10,
      seed: "s4",
    });
    void sid4;

    const generatorItems = items4.filter((i) => i.origin === "generator");
    const overlap = generatorItems.filter((i) => allHashes.has(i.instanceHash));
    expect(overlap.length).toBe(0);
  });

  it("is deterministic for the same seed", async () => {
    const topic = topicById("en.tenses.present-simple")!;
    const templates = templatesForTopic(topic.id);
    const lex = lexiconBundleFor("en");
    const repos = createMemoryRepos();
    const a = await pickSessionExercises(topic, templates, lex, repos, {
      userId: USER,
      mode: "practice",
      count: 10,
      seed: "fixed-deterministic",
    });
    const b = await pickSessionExercises(topic, templates, lex, repos, {
      userId: USER,
      mode: "practice",
      count: 10,
      seed: "fixed-deterministic",
    });
    expect(a.map((i) => i.instanceHash)).toEqual(b.map((i) => i.instanceHash));
  });
});
