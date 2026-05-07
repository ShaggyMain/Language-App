import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import { Screen } from "../components/ui/Screen";
import {
  loadPreferences,
  resetPreferences,
  savePreferences,
  subscribePreferences,
  type Preferences,
} from "../lib/preferences";
import { supabase, supabaseConfigured } from "../lib/supabase";

const TTS_RATES: { value: number; label: string }[] = [
  { value: 0.7, label: "0.7×" },
  { value: 0.85, label: "0.85×" },
  { value: 1.0, label: "1.0×" },
  { value: 1.15, label: "1.15×" },
  { value: 1.3, label: "1.3×" },
];

export default function SettingsScreen() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await loadPreferences();
      if (!cancelled) setPrefs(p);
    })();
    const unsub = subscribePreferences((p) => setPrefs(p));
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!cancelled) setEmail(data.user?.email ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (!prefs) return null;

  function setRate(rate: number) {
    void savePreferences({ ttsRate: rate });
    try {
      Speech.stop();
      Speech.speak("Hello, this is a sample.", { rate });
    } catch {
      // best-effort preview
    }
  }

  function handleReset() {
    Alert.alert(
      "Reset progress?",
      "This wipes onboarding state and preferences. Lesson history (SRS, sessions) is kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetPreferences();
            router.replace("/onboarding");
          },
        },
      ],
    );
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return (
    <Screen title="Settings">
      <Text className="text-muted text-xs uppercase tracking-wide mb-2">Audio</Text>
      <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
        <Text className="text-text mb-3">Speech rate (dictation TTS)</Text>
        <View className="flex-row gap-2 flex-wrap">
          {TTS_RATES.map((r) => {
            const selected = Math.abs(prefs.ttsRate - r.value) < 0.001;
            return (
              <Pressable
                key={r.value}
                onPress={() => setRate(r.value)}
                className={`rounded-lg border px-3 py-2 ${selected ? "bg-en/20 border-en" : "bg-bg border-border"}`}
              >
                <Text className={selected ? "text-en font-semibold" : "text-text"}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text className="text-muted text-xs uppercase tracking-wide mb-2">Theme</Text>
      <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
        <View className="flex-row gap-2">
          {(["system", "dark", "light"] as const).map((mode) => {
            const selected = prefs.theme === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => void savePreferences({ theme: mode })}
                className={`flex-1 rounded-lg border px-3 py-2 items-center ${selected ? "bg-en/20 border-en" : "bg-bg border-border"}`}
              >
                <Text className={`capitalize ${selected ? "text-en font-semibold" : "text-text"}`}>
                  {mode}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text className="text-muted text-xs uppercase tracking-wide mb-2">Daily goal</Text>
      <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
        <Text className="text-text mb-3">Sessions per day to keep your streak</Text>
        <View className="flex-row gap-2">
          {[1, 3, 5].map((n) => {
            const selected = prefs.dailyGoal === n;
            return (
              <Pressable
                key={n}
                onPress={() => void savePreferences({ dailyGoal: n })}
                className={`flex-1 rounded-lg border px-3 py-2 items-center ${selected ? "bg-en/20 border-en" : "bg-bg border-border"}`}
              >
                <Text className={selected ? "text-en font-semibold" : "text-text"}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text className="text-muted text-xs uppercase tracking-wide mb-2">Defaults</Text>
      <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
        <Text className="text-text">Default language</Text>
        <Text className="text-muted text-sm mt-1">{prefs.defaultLanguage.toUpperCase()}</Text>
        <View className="h-px bg-border my-3" />
        <Text className="text-text">Self-reported level</Text>
        <Text className="text-muted text-sm mt-1">{prefs.selfReportedLevel}</Text>
        <Pressable
          onPress={() => router.push("/onboarding")}
          className="mt-3 rounded-lg border border-border bg-bg px-3 py-2 self-start"
        >
          <Text className="text-text text-sm">Change…</Text>
        </Pressable>
      </View>

      <Text className="text-muted text-xs uppercase tracking-wide mb-2">Account</Text>
      <View className="bg-surface border border-border rounded-2xl p-4 mb-6">
        {!supabaseConfigured ? (
          <>
            <Text className="text-text">Cloud sync not configured</Text>
            <Text className="text-muted text-sm mt-1">
              Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable accounts and
              cross-device sync. The app works fully offline without them.
            </Text>
          </>
        ) : email ? (
          <>
            <Text className="text-text">Signed in as</Text>
            <Text className="text-muted text-sm mt-1 mb-3">{email}</Text>
            <Pressable onPress={handleSignOut} className="rounded-lg bg-error/15 border border-error px-3 py-2 self-start">
              <Text className="text-error font-semibold">Sign out</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text className="text-text">Not signed in</Text>
            <Text className="text-muted text-sm mt-1 mb-3">
              Sign in to sync your progress across devices.
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => router.push("/login")}
                className="rounded-lg bg-en px-3 py-2"
              >
                <Text className="text-white font-semibold">Sign in</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/register")}
                className="rounded-lg border border-border bg-bg px-3 py-2"
              >
                <Text className="text-text font-semibold">Create account</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      <Text className="text-muted text-xs uppercase tracking-wide mb-2">Danger zone</Text>
      <Pressable
        onPress={handleReset}
        className="bg-error/15 border border-error rounded-2xl p-4"
      >
        <Text className="text-error font-semibold">Reset preferences</Text>
        <Text className="text-muted text-sm mt-1">Clear onboarding + audio settings.</Text>
      </Pressable>
    </Screen>
  );
}
