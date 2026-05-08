import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Globe } from "lucide-react-native";
import { PressableScale } from "../components/ui/PressableScale";
import { PrimaryButton } from "../components/ui/PrimaryButton";
import { StatsBanner } from "../components/ui/StatsBanner";
import { LANGUAGES } from "../lib/languages";
import { loadPreferences } from "../lib/preferences";
import { loadStreak } from "../lib/streak";
import { loadXp } from "../lib/xp";

const SIDEBAR_WIDTH = Dimensions.get("window").width * 0.72;

const C = {
  bg: "#0b1220",
  surface: "#111a2e",
  surfaceAlt: "#1a2540",
  border: "#1f2a44",
  text: "#e6ecf5",
  muted: "#8aa0c2",
} as const;

export default function LanguagePicker() {
  const [ready, setReady] = useState(false);
  const [defaultLang, setDefaultLang] = useState<string>("en");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarX = useSharedValue(SIDEBAR_WIDTH);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const prefs = await loadPreferences();
      if (cancelled) return;
      if (!prefs.onboarded) {
        router.replace("/onboarding");
        return;
      }
      setDefaultLang(prefs.defaultLanguage ?? "en");
      void loadStreak();
      void loadXp();
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

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

  if (!ready) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#3b82f6" />
      </SafeAreaView>
    );
  }

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
        <View style={{ width: 38 }} />
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ color: C.text, fontSize: 17, fontWeight: "700" }}>Grammar Trail</Text>
        </View>
        <PressableScale onPress={openSidebar} style={{ padding: 8 }}>
          <Globe size={22} color={C.muted} />
        </PressableScale>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 36, paddingBottom: 32, alignItems: "center" }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(300)} style={{ alignItems: "center", marginBottom: 36 }}>
          <Text style={{ fontSize: 80, marginBottom: 14 }}>🗺️</Text>
          <Text style={{ color: C.text, fontSize: 32, fontWeight: "800", marginBottom: 6 }}>
            Grammar Trail
          </Text>
          <Text style={{ color: C.muted, fontSize: 15, textAlign: "center", lineHeight: 22 }}>
            Learn grammar one trail at a time.
          </Text>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(120).duration(300)} style={{ width: "100%", marginBottom: 8 }}>
          <StatsBanner />
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(240).duration(300)} style={{ width: "100%", marginTop: 8 }}>
          <PrimaryButton
            label="Start Learning"
            color="#3b82f6"
            icon={<Text style={{ color: "white", fontSize: 20 }}>▸</Text>}
            onPress={() => router.push(`/${defaultLang}`)}
          />
        </Animated.View>

        {/* Hint */}
        <Animated.View entering={FadeInDown.delay(320).duration(300)}>
          <Text style={{ color: C.muted, fontSize: 13, marginTop: 14, textAlign: "center" }}>
            Tap{" "}
            <Text style={{ color: C.text, fontWeight: "600" }}>🌐</Text>
            {" "}in the top right to switch course
          </Text>
        </Animated.View>
      </ScrollView>

      {/* ── Right language sidebar ── */}
      {sidebarOpen && (
        <>
          <Pressable
            onPress={closeSidebar}
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(0,0,0,0.55)",
            }}
          />
          <Animated.View
            style={[
              {
                position: "absolute",
                right: 0, top: 0, bottom: 0,
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
                    setDefaultLang(l.code);
                    closeSidebar();
                    setTimeout(() => router.push(`/${l.code}`), 260);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 20,
                    paddingVertical: 18,
                    borderBottomWidth: 1,
                    borderBottomColor: C.border,
                    backgroundColor: l.code === defaultLang ? C.surfaceAlt : "transparent",
                  }}
                >
                  <Text style={{ fontSize: 34, marginRight: 14 }}>{l.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: C.text, fontSize: 16, fontWeight: "600" }}>{l.name}</Text>
                  </View>
                  {l.code === defaultLang && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: l.accent }} />
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
