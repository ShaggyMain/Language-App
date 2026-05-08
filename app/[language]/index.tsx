import { useEffect, useState } from "react";
import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BookOpen, Globe, Map, Settings, Target } from "lucide-react-native";
import { ProgressRing } from "../../components/ui/ProgressRing";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { PressableScale } from "../../components/ui/PressableScale";
import { Language } from "../../lib/types";
import { languageMeta, LANGUAGES } from "../../lib/languages";
import { topicsForLanguage } from "../../lib/content";
import { getRepos } from "../../lib/db";
import { currentUserId, subscribeAuthState } from "../../lib/auth";
import { masteryMap } from "../../lib/mastery";

const SIDEBAR_WIDTH = Dimensions.get("window").width * 0.72;

const C = {
  bg: "#0b1220",
  surface: "#111a2e",
  surfaceAlt: "#1a2540",
  border: "#1f2a44",
  text: "#e6ecf5",
  muted: "#8aa0c2",
} as const;

export default function ModePicker() {
  const { language } = useLocalSearchParams<{ language: string }>();
  const parsed = Language.safeParse(language);
  const lang = parsed.success ? parsed.data : "en";
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<{
    overall: number;
    passed: number;
    total: number;
    nextTopicId: string | null;
  }>({ overall: 0, passed: 0, total: 0, nextTopicId: null });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarX = useSharedValue(SIDEBAR_WIDTH);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      if (!parsed.success) return;
      const repos = await getRepos();
      const langTopics = topicsForLanguage(lang);
      const m = await masteryMap(repos, currentUserId(), langTopics.map((t) => t.id));
      if (cancelled) return;
      const values = Object.values(m);
      const overall = values.length ? values.reduce((s, x) => s + x.score, 0) / values.length : 0;
      const passed = values.filter((x) => x.passed).length;
      const next = langTopics.find((t) => !m[t.id]?.passed);
      setStats({ overall, passed, total: langTopics.length, nextTopicId: next?.id ?? null });
    }
    void refresh();
    const unsub = subscribeAuthState(() => void refresh());
    return () => {
      cancelled = true;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sidebarX.value }],
  }));

  function openSidebar() {
    setSidebarOpen(true);
    sidebarX.value = withTiming(0, { duration: 280 });
  }

  function closeSidebar() {
    sidebarX.value = withTiming(SIDEBAR_WIDTH, { duration: 250 });
    setTimeout(() => setSidebarOpen(false), 260);
  }

  if (!parsed.success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
        <Text style={{ color: C.muted, padding: 20 }}>This language is not available.</Text>
      </SafeAreaView>
    );
  }

  const meta = languageMeta(lang);
  const pct = Math.round(stats.overall * 100);
  const remaining = stats.total - stats.passed;
  const descText =
    stats.passed === 0
      ? "Start your first lesson and begin your journey."
      : stats.passed === stats.total
      ? "Amazing — you've completed all lessons!"
      : `Keep going — ${remaining} lesson${remaining !== 1 ? "s" : ""} to go.`;

  const ctaLabel =
    stats.passed === 0 ? "Start learning" : stats.passed === stats.total ? "Review path" : "Continue path";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      {/* ── Header ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <PressableScale onPress={() => router.replace("/")} style={{ padding: 8 }}>
          <Text style={{ color: C.muted, fontSize: 22, lineHeight: 26 }}>‹</Text>
        </PressableScale>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ color: C.text, fontSize: 17, fontWeight: "700" }}>
            {meta.flag}{"  "}{meta.name}
          </Text>
        </View>

        <PressableScale onPress={openSidebar} style={{ padding: 8 }}>
          <Globe size={22} color={C.muted} />
        </PressableScale>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 36, paddingBottom: 24, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(300)} style={{ alignItems: "center", width: "100%" }}>
          <Text style={{ fontSize: 72, marginBottom: 10 }}>{meta.flag}</Text>
          <Text style={{ color: C.text, fontSize: 30, fontWeight: "800", marginBottom: 4 }}>
            {meta.name}
          </Text>
          <Text style={{ color: C.muted, fontSize: 15, marginBottom: 28 }}>
            {stats.passed} / {stats.total} lessons passed
          </Text>

          <Animated.View entering={ZoomIn.delay(200).springify().damping(14)}>
            <ProgressRing
              progress={stats.overall}
              size={164}
              thickness={12}
              color={meta.accent}
              label={`${pct}%`}
            />
          </Animated.View>

          <Text
            style={{
              color: C.muted,
              fontSize: 14,
              marginTop: 18,
              textAlign: "center",
              lineHeight: 20,
              paddingHorizontal: 16,
            }}
          >
            {descText}
          </Text>
        </Animated.View>

        {/* Primary CTA */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(300)}
          style={{ width: "100%", marginTop: 36 }}
        >
          <PrimaryButton
            label={ctaLabel}
            color={meta.accent}
            icon={<Text style={{ color: "white", fontSize: 20 }}>▸</Text>}
            onPress={() =>
              stats.nextTopicId
                ? router.push(`/${lang}/path/${encodeURIComponent(stats.nextTopicId)}`)
                : router.push(`/${lang}/path`)
            }
          />
        </Animated.View>
      </ScrollView>

      {/* ── Bottom nav bar ── */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: C.surface,
          borderTopWidth: 1,
          borderTopColor: C.border,
          paddingTop: 10,
          paddingBottom: (insets.bottom || 0) + 8,
        }}
      >
        <NavTab icon={<Map size={22} color={C.muted} />} label="Path" onPress={() => router.push(`/${lang}/path`)} />
        <NavTab icon={<BookOpen size={22} color={C.muted} />} label="Learn" onPress={() => router.push(`/${lang}/study`)} />
        <NavTab icon={<Target size={22} color={C.muted} />} label="Practice" onPress={() => router.push(`/${lang}/practice`)} />
        <NavTab icon={<Settings size={22} color={C.muted} />} label="Settings" onPress={() => router.push("/settings")} />
      </View>

      {/* ── Right language sidebar ── */}
      {sidebarOpen && (
        <>
          {/* Scrim */}
          <Pressable
            onPress={closeSidebar}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.55)",
            }}
          />

          {/* Drawer panel */}
          <Animated.View
            style={[
              {
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: SIDEBAR_WIDTH,
                backgroundColor: C.surface,
                shadowColor: "#000",
                shadowOpacity: 0.45,
                shadowRadius: 24,
                elevation: 24,
              },
              sidebarStyle,
            ]}
          >
            <SafeAreaView style={{ flex: 1 }} edges={["top", "right", "bottom"]}>
              <Text
                style={{
                  color: C.text,
                  fontSize: 18,
                  fontWeight: "700",
                  paddingHorizontal: 20,
                  paddingTop: 22,
                  paddingBottom: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: C.border,
                }}
              >
                Choose Course
              </Text>

              {LANGUAGES.map((l) => (
                <PressableScale
                  key={l.code}
                  onPress={() => {
                    closeSidebar();
                    setTimeout(() => router.replace(`/${l.code}`), 260);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 20,
                    paddingVertical: 18,
                    borderBottomWidth: 1,
                    borderBottomColor: C.border,
                    backgroundColor: l.code === lang ? C.surfaceAlt : "transparent",
                  }}
                >
                  <Text style={{ fontSize: 34, marginRight: 14 }}>{l.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontSize: 16, fontWeight: "600" }}>{l.name}</Text>
                  </View>
                  {l.code === lang && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: l.accent,
                      }}
                    />
                  )}
                </PressableScale>
              ))}
            </SafeAreaView>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

function NavTab({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", paddingVertical: 4 }}
    >
      {icon}
      <Text style={{ color: C.muted, fontSize: 11, fontWeight: "500", marginTop: 4 }}>{label}</Text>
    </PressableScale>
  );
}
