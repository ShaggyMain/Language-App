# Release runbook

Practical step-by-step for shipping Grammar Trail to TestFlight and Google
Play Internal Testing. Each step that requires a paid account or external
console is flagged.

## 0. Prerequisites

- **Apple Developer Program** — $99/year, https://developer.apple.com/programs/. Required for TestFlight and the App Store. Allow 24–48h for first-time enrollment review.
- **Google Play Console** — $25 one-time, https://play.google.com/console. Required for Internal/Closed/Production testing tracks.
- **Expo account + EAS subscription** — free tier works for occasional builds; paid (~$19/mo) for higher build priority and concurrent builds.
- Install the EAS CLI: `npm i -g eas-cli`. Sign in: `eas login`.

## 1. Wire Supabase (optional but recommended)

The app works fully offline; sync is opt-in.

1. Create a Supabase project at https://supabase.com.
2. In the SQL editor, run `supabase/schema.sql` from this repo.
3. Confirm "Email" auth is enabled in Auth → Providers.
4. Copy your project URL and anon key into `.env.local`:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
5. Restart `npx expo start`. The Settings screen should now show "Sign in"
   instead of "Cloud sync not configured".

## 2. First EAS configuration

```bash
eas init                  # creates a project on EAS, fills app.json `extra.eas.projectId`
eas credentials           # generates iOS + Android signing keys (interactive)
```

Replace `REPLACE_WITH_YOUR_EAS_PROJECT_ID` in `app.json` if EAS didn't update
it automatically.

## 3. Internal preview builds

The fastest way to get the app on a phone for end-to-end testing.

```bash
# Android APK that installs by file transfer
eas build --profile preview --platform android

# iOS install via TestFlight (requires Apple Developer account)
eas build --profile preview --platform ios
```

The Android APK can be sent directly (Telegram, AirDrop, etc.) and installed
after enabling "install from unknown sources". The iOS preview goes through
TestFlight (see below).

## 4. TestFlight (iOS)

1. **App Store Connect** → My Apps → "+" → New App.
   - Bundle ID = `com.example.languageapp` (must match `app.json`)
   - Primary language, name, SKU = anything you want.
2. Replace placeholders in `eas.json`:
   - `appleTeamId` — found under Apple Developer → Membership.
   - `ascAppId` — the numeric App ID from App Store Connect (in URL).
3. Build + submit:

   ```bash
   eas build --profile production --platform ios
   eas submit --profile production --platform ios   # uploads latest build
   ```
4. In App Store Connect → TestFlight, wait for the build to finish processing
   (10–60 min). Add internal testers (up to 100, no review needed) or external
   testers (up to 10 000, requires Apple's beta review, 24–48h first time).
5. Testers install the **TestFlight** app on their device and accept the
   invite email.

## 5. Google Play Internal Testing

1. **Play Console** → Create app. Match the package `com.example.languageapp`.
2. App content: fill privacy policy URL, content rating, target audience,
   data safety. The app collects: email + auth (when signed in); SRS schedule
   (in cloud); no analytics or ads. Mark accordingly.
3. Build + submit:

   ```bash
   eas build --profile production --platform android
   eas submit --profile production --platform android  # uploads to Internal track
   ```
4. Play Console → Testing → Internal testing → Add testers (paste emails or
   share a list URL). Click "Review release" → "Start rollout".
5. Testers click the opt-in link, then install via Play Store.

## 6. Versioning

- `app.json.expo.version` is the user-visible string ("0.1.0").
- iOS `buildNumber` and Android `versionCode` increment each upload. With
  `eas.json` profile `autoIncrement: true` (production) EAS handles it.

## 7. Updates without a store re-upload

For pure JS / asset updates, use `eas update`:

```bash
eas update --branch preview --message "Hot-fix: ..."
```

This bypasses the store review entirely for non-native changes (anything that
doesn't touch `app.json`, plugins, or native modules).

## 8. Troubleshooting

- **"Bundle identifier already exists"** — bundle id must be globally unique
  across the App Store. Pick something specific, e.g. `dev.your-handle.languageapp`.
- **"App rejected: missing privacy policy"** — App Store and Play both
  require a public URL. Cheap solution: a Notion page or GitHub Pages.
- **iOS TestFlight stuck on "Processing"** — usually 30–60 min. If >24h,
  re-upload. Sometimes triggered by missing export-compliance answers.
- **Supabase RLS errors on push** — check that the user is signed in; an
  unauthenticated client gets `auth.uid() = null` which fails RLS. The sync
  module already guards on `isSignedIn()`.

## 9. After first release

- Monitor crashes via Expo's built-in error reporting or wire up Sentry
  (`@sentry/react-native`).
- Set up `eas update` channels per release lane so beta testers get newer
  builds than production.
- Replace placeholder icon (`assets/icon.png`) with real artwork — the
  current art is a one-letter "G" placeholder generated by the build tooling.
