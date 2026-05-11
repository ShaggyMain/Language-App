import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  loadPreferences,
  resetPreferences,
  savePreferences,
  subscribePreferences,
  type Preferences,
} from "../lib/preferences";
import { resetXp } from "../lib/xp";
import { resetStreak } from "../lib/streak";
import { getRepos } from "../lib/db";
import { currentUserId } from "../lib/auth";
import { LANGUAGES } from "../lib/languages";
import { topicsForLanguage } from "../lib/content";
import type { Language } from "../lib/types";
import { supabase, supabaseConfigured } from "../lib/supabase";

const C = {
  bg: "#0b1220",
  surface: "#111a2e",
  border: "#1f2a44",
  text: "#e6ecf5",
  muted: "#8aa0c2",
  en: "#3b82f6",
  error: "#f43f5e",
} as const;

const TTS_RATES: { value: number; label: string }[] = [
  { value: 0.7, label: "0.7×" },
  { value: 0.85, label: "0.85×" },
  { value: 1.0, label: "1.0×" },
  { value: 1.15, label: "1.15×" },
  { value: 1.3, label: "1.3×" },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        color: C.muted,
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 8,
        marginTop: 4,
      }}
    >
      {children}
    </Text>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor: C.border,
        borderRadius: 16,
        padding: 18,
        marginBottom: 20,
      }}
    >
      {children}
    </View>
  );
}

function Divider() {
  return <View style={{ height: 1, backgroundColor: C.border, marginVertical: 14 }} />;
}

export default function SettingsScreen() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [resetLang, setResetLang] = useState<Language>("en");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await loadPreferences();
      if (!cancelled) setPrefs(p);
    })();
    const unsub = subscribePreferences((p) => setPrefs(p));
    return () => { cancelled = true; unsub(); };
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
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  if (!prefs) return null;

  function setRate(rate: number) {
    void savePreferences({ ttsRate: rate });
    try {
      Speech.stop();
      Speech.speak("Hello, this is a sample.", { rate });
    } catch { /* best-effort */ }
  }

  function handleReset() {
    Alert.alert(
      "Reset preferences?",
      "Clears onboarding state and audio settings. Lesson history and XP are kept.",
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

  function handleResetCourse() {
    Alert.alert(
      "Reset all progress?",
      "This permanently deletes all completed lessons, XP, and streak. Preferences are kept. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset everything",
          style: "destructive",
          onPress: async () => {
            const repos = await getRepos();
            await repos.resetUser(currentUserId());
            await resetXp();
            await resetStreak();
          },
        },
      ],
    );
  }

  function handleResetLanguage() {
    const meta = LANGUAGES.find((l) => l.code === resetLang);
    const name = meta ? `${meta.flag} ${meta.name}` : resetLang.toUpperCase();
    Alert.alert(
      `Reset ${name} course?`,
      "All completed lessons for this language will be deleted. XP and streak from other languages are kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            const repos = await getRepos();
            const topicIds = topicsForLanguage(resetLang).map((t) => t.id);
            await repos.resetUserTopics(currentUserId(), topicIds);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["bottom"]}>
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Audio */}
        <SectionLabel>Audio</SectionLabel>
        <SettingsCard>
          <Text style={{ color: C.text, fontSize: 15, fontWeight: "500", marginBottom: 14 }}>
            Speech rate (dictation TTS)
          </Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {TTS_RATES.map((r) => {
              const selected = Math.abs(prefs.ttsRate - r.value) < 0.001;
              return (
                <Pressable
                  key={r.value}
                  onPress={() => setRate(r.value)}
                  style={{
                    borderRadius: 10,
                    borderWidth: 1.5,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    backgroundColor: selected ? "#3b82f622" : C.bg,
                    borderColor: selected ? C.en : C.border,
                  }}
                >
                  <Text style={{ color: selected ? C.en : C.text, fontWeight: selected ? "700" : "400" }}>
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SettingsCard>

        {/* Daily goal */}
        <SectionLabel>Daily goal</SectionLabel>
        <SettingsCard>
          <Text style={{ color: C.text, fontSize: 15, fontWeight: "500", marginBottom: 14 }}>
            Sessions per day to keep your streak
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[1, 3, 5].map((n) => {
              const selected = prefs.dailyGoal === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => void savePreferences({ dailyGoal: n })}
                  style={{
                    flex: 1,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    paddingVertical: 10,
                    alignItems: "center",
                    backgroundColor: selected ? "#3b82f622" : C.bg,
                    borderColor: selected ? C.en : C.border,
                  }}
                >
                  <Text style={{ color: selected ? C.en : C.text, fontWeight: selected ? "700" : "400", fontSize: 16 }}>
                    {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SettingsCard>

        {/* Defaults */}
        <SectionLabel>Defaults</SectionLabel>
        <SettingsCard>
          <Text style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Default language
          </Text>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: "600", marginTop: 4 }}>
            {prefs.defaultLanguage.toUpperCase()}
          </Text>
          <Divider />
          <Text style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Self-reported level
          </Text>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: "600", marginTop: 4 }}>
            {prefs.selfReportedLevel}
          </Text>
          <Pressable
            onPress={() => router.push("/onboarding")}
            style={{
              marginTop: 14,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: C.border,
              backgroundColor: C.bg,
              paddingHorizontal: 14,
              paddingVertical: 8,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: C.text, fontSize: 14 }}>Change…</Text>
          </Pressable>
        </SettingsCard>

        {/* Account */}
        <SectionLabel>Account</SectionLabel>
        <SettingsCard>
          {!supabaseConfigured ? (
            <>
              <Text style={{ color: C.text, fontSize: 15, fontWeight: "500" }}>
                Cloud sync not configured
              </Text>
              <Text style={{ color: C.muted, fontSize: 13, marginTop: 6, lineHeight: 20 }}>
                Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable accounts and
                cross-device sync. The app works fully offline without them.
              </Text>
            </>
          ) : email ? (
            <>
              <Text style={{ color: C.muted, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Signed in as
              </Text>
              <Text style={{ color: C.text, fontSize: 15, fontWeight: "500", marginTop: 4, marginBottom: 14 }}>
                {email}
              </Text>
              <Pressable
                onPress={handleSignOut}
                style={{
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: C.error,
                  backgroundColor: "#f43f5e18",
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: C.error, fontWeight: "700" }}>Sign out</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={{ color: C.text, fontSize: 15, fontWeight: "500" }}>Not signed in</Text>
              <Text style={{ color: C.muted, fontSize: 13, marginTop: 6, marginBottom: 14, lineHeight: 20 }}>
                Sign in to sync your progress across devices.
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => router.push("/login")}
                  style={{
                    borderRadius: 10,
                    backgroundColor: C.en,
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>Sign in</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push("/register")}
                  style={{
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: C.border,
                    backgroundColor: C.bg,
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                  }}
                >
                  <Text style={{ color: C.text, fontWeight: "600" }}>Create account</Text>
                </Pressable>
              </View>
            </>
          )}
        </SettingsCard>

        {/* Danger zone */}
        <SectionLabel>Danger zone</SectionLabel>
        <Pressable
          onPress={handleReset}
          style={{
            backgroundColor: "#f43f5e18",
            borderWidth: 1.5,
            borderColor: C.error,
            borderRadius: 16,
            padding: 18,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: C.error, fontSize: 15, fontWeight: "700" }}>Reset preferences</Text>
          <Text style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
            Clear onboarding + audio settings.
          </Text>
        </Pressable>
        {/* Per-language reset */}
        <View
          style={{
            backgroundColor: "#f43f5e18",
            borderWidth: 1.5,
            borderColor: C.error,
            borderRadius: 16,
            padding: 18,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: C.error, fontSize: 15, fontWeight: "700", marginBottom: 4 }}>
            Reset language course
          </Text>
          <Text style={{ color: C.muted, fontSize: 13, marginBottom: 14 }}>
            Delete completed lessons for one language only.
          </Text>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {LANGUAGES.map((l) => {
              const selected = resetLang === l.code;
              return (
                <Pressable
                  key={l.code}
                  onPress={() => setResetLang(l.code)}
                  style={{
                    borderRadius: 10,
                    borderWidth: 1.5,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    backgroundColor: selected ? "#f43f5e22" : C.bg,
                    borderColor: selected ? C.error : C.border,
                  }}
                >
                  <Text style={{ color: selected ? C.error : C.text, fontWeight: selected ? "700" : "400" }}>
                    {l.flag} {l.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={handleResetLanguage}
            style={{
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: C.error,
              backgroundColor: C.bg,
              paddingHorizontal: 16,
              paddingVertical: 9,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: C.error, fontWeight: "700" }}>
              Reset {LANGUAGES.find((l) => l.code === resetLang)?.flag}{" "}
              {LANGUAGES.find((l) => l.code === resetLang)?.name}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handleResetCourse}
          style={{
            backgroundColor: "#f43f5e18",
            borderWidth: 1.5,
            borderColor: C.error,
            borderRadius: 16,
            padding: 18,
          }}
        >
          <Text style={{ color: C.error, fontSize: 15, fontWeight: "700" }}>Reset all progress</Text>
          <Text style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
            Delete all lessons, XP, and streak. Start from scratch.
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
