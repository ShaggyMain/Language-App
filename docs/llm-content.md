# LLM-powered template generation

A bring-your-own-key script that uses Claude to expand existing topics with
new TopicTemplate variants. Output is **proposals**, not auto-merged content
— a human reviews, possibly tweaks, then commits the good ones.

## Why

Hand-authoring TopicTemplates is the slowest part of content production: each
takes thought about which inflectors to use, how to keep the prompt natural,
and what distractors will trip an A1 learner without being trivially wrong.
The schema, lexicon, and inflectors are all already machine-readable, so the
model has everything it needs to produce a draft.

Validation is ironclad:
1. **Zod parse** against `TopicTemplate` — anything that doesn't match the
   schema is rejected (no warnings, no soft acceptance).
2. **Render check** — we actually call `expandTemplate(...)` with a fixed
   seed and reject any template that produces zero items, which catches
   missing inflectors and over-narrow slot filters.
3. **Round-trip** — the first generated instance is fed back through
   `compileInstance` to ensure deterministic rehydration works.

Anything that fails is dropped silently with a console warning and never
reaches a JSON file.

## Setup

```bash
npm install --save-dev @anthropic-ai/sdk tsx   # already in this repo
export ANTHROPIC_API_KEY=sk-ant-...
```

Get a key at https://console.anthropic.com — pay-as-you-go, $5 free credit
on signup. Generating 5 templates costs ~$0.005 with the default Sonnet
model, ~$0.03 with Opus.

## Usage

```bash
# 5 new templates for present-simple, default Sonnet model
npx tsx scripts/generate-templates.ts en.tenses.present-simple 5

# 8 with a more capable (and pricier) model
npx tsx scripts/generate-templates.ts es.verbs.gustar 8 claude-opus-4-7
```

Output is written to:

```
content/proposals/<topicId>/<ISO-timestamp>.json
```

These files are **not** loaded by `lib/content.ts` until you move the
templates you like into `content/templates/<lang>/<file>.json` and add the
import to `lib/content.ts`.

## Review checklist

For each proposed template:

- [ ] Does the **rendered prompt sound natural** to a native speaker? Run
  `npx jest lib/smoke.test.ts` after dropping a candidate into the templates
  directory to see sample outputs.
- [ ] Are **distractor patterns** plausibly wrong rather than gibberish? An
  MCQ where 3 of 4 options are obvious typos is too easy.
- [ ] Does the **explanation** (if present) match what the template tests?
- [ ] Is the **id slug** descriptive and consistent with neighbouring files
  (e.g. `en.present-simple.<variant>-<fill|mcq>`)?

If a candidate is almost-good-but-not-quite, edit the JSON in place — the
schema validation already passed, so manual tweaks are safe.

## Cost control

The script uses **prompt caching** (Anthropic's `cache_control` blocks)
around the schema + lexicon preamble. Re-running for the same topic within
5 minutes is dramatically cheaper. Different topics in the same language
also share a partial cache because the inflector list is identical.

Rough numbers (Sonnet 4.6, EN topic with ~40 lexicon entries):

| Run | Input tokens | Output tokens | Cost |
|---|---|---|---|
| First request | ~3500 | ~1200 | ~$0.013 |
| Cached re-run | ~500 (95% cache hit) | ~1200 | ~$0.006 |

## Limitations

- **Only known inflectors** — the model can't invent new ones. If you need
  a new modifier (e.g. German Dativ articles), add it to `lib/inflect/de.ts`
  first, then run the generator.
- **Lexicon-bound** — templates can only reference existing lexicon entries
  via filters; the model won't add words to your dictionary. Add nouns/verbs
  to `content/lexicons/<lang>/*.json` before generating templates that need
  them.
- **No auto-merge** — proposals always require human review. This is
  intentional. The model is good but not infallible, especially around
  cultural register and pedagogical sequencing.

## Adding a new language

If you start a new language pair (e.g. French), the script will work as soon
as you have:

1. `lib/inflect/fr.ts` exporting `inflectors` map
2. At least one entry in `content/lexicons/fr/*.json` per `pos` you want to
   reference
3. At least one hand-authored template in `content/templates/fr/*.json` to
   serve as a style reference

Then add the new language to `INFLECTORS_BY_LANG` in `scripts/generate-templates.ts`.
