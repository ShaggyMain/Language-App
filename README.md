# Grammar Trail

Mobile (Android-first) app to learn English, German and Spanish grammar.
Three modes per language: **Path**, **Study**, **Practice**.

## Stack

- Expo (React Native) + TypeScript
- expo-router (file-based navigation)
- NativeWind (Tailwind for React Native)
- Supabase (auth + progress sync, optional)
- Zod (content schema validation)
- Jest (unit tests)

## Quick start

```bash
npm install
npm run start          # opens Expo dev server
```

Then either:

- Install **Expo Go** on your Android phone, scan the QR code from the terminal.
- Or `npm run android` if you have Android Studio + emulator set up.

## Project layout

```
app/                      expo-router screens
  index.tsx               language picker
  [language]/
    index.tsx             mode picker (Path / Study / Practice)
    path/                 linear course with passing thresholds
    study/                free-form theory reading
    practice/             topic-pick exercise drills
components/
  ui/                     reusable building blocks (Screen, Card)
  exercises/              one component per exercise type (TODO)
lib/
  grading.ts              fuzzy answer matcher (core of the app)
  grading.test.ts         unit tests for grader
  types.ts                Zod content schema
  content.ts              content loader
  languages.ts            language metadata
  supabase.ts             Supabase client (lazy if env not set)
content/
  en/                     English topics (one JSON per topic)
  de/                     German topics (TODO)
  es/                     Spanish topics (TODO)
```

## Adding a topic

1. Create `content/<lang>/<slug>.json` matching the `Topic` schema in `lib/types.ts`.
2. Import + register it in `lib/content.ts` (`RAW_TOPICS` array).
3. Reload — Zod will validate the schema at startup; bad JSON aborts with a useful error.

## Supabase setup (optional, for sync)

1. Create a free project at https://supabase.com.
2. Copy `.env.example` to `.env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Run the SQL migrations from `supabase/` (TODO).

Without env vars set, the app runs offline-only and `lib/supabase.ts` exposes a `null` client.

## Tests

```bash
npm test                  # runs Jest
npm run typecheck         # TypeScript check, no emit
```

The most important test file is `lib/grading.test.ts` — it pins the
case/punctuation/contractions normalization rules and the near-miss scoring
behaviour the user relies on.

## Building an APK (free)

```bash
npm install -g eas-cli
eas login                 # uses your Expo account
eas build -p android --profile preview
```

The free EAS tier includes ~30 builds/month, more than enough.
The `.apk` link arrives by email/console — install it on any Android device
after enabling "Install from unknown sources".
