import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Screen } from "../components/ui/Screen";
import { PressableScale } from "../components/ui/PressableScale";
import { StatsBanner } from "../components/ui/StatsBanner";
import { LANGUAGES } from "../lib/languages";
import { loadPreferences } from "../lib/preferences";
import { loadStreak } from "../lib/streak";
import { loadXp } from "../lib/xp";

export default function LanguagePicker() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const prefs = await loadPreferences();
      if (cancelled) return;
      if (!prefs.onboarded) {
        router.replace("/onboarding");
        return;
      }
      void loadStreak();
      void loadXp();
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#3b82f6" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(300)}>
        <Text className="text-text text-4xl font-bold mb-1">Grammar Trail</Text>
        <Text className="text-muted mb-6">Learn grammar one trail at a time.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(300)}>
        <StatsBanner />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(300)}>
        <Text className="text-muted text-xs uppercase tracking-wide mb-3">Courses</Text>
      </Animated.View>

      {LANGUAGES.map((lang, idx) => (
        <Animated.View
          key={lang.code}
          entering={FadeInDown.delay(250 + idx * 80).duration(300)}
        >
          <PressableScale
            onPress={() => router.push(`/${lang.code}`)}
            className="bg-surface border border-border rounded-2xl p-5 mb-3 min-h-[88px]"
            style={{ borderLeftWidth: 4, borderLeftColor: lang.accent }}
          >
            <View className="flex-row items-center">
              <Text className="text-5xl mr-4">{lang.flag}</Text>
              <View className="flex-1">
                <Text className="text-text text-2xl font-bold">{lang.name}</Text>
                <Text className="text-muted text-sm mt-1">Path · Study · Practice</Text>
              </View>
              <Text className="text-muted text-2xl">›</Text>
            </View>
          </PressableScale>
        </Animated.View>
      ))}

      <Animated.View entering={FadeInDown.delay(550).duration(300)}>
        <PressableScale
          onPress={() => router.push("/settings")}
          className="bg-surface border border-border rounded-2xl p-4 mt-2 mb-3 min-h-[56px]"
        >
          <View className="flex-row items-center">
            <Text className="text-3xl mr-4">⚙️</Text>
            <View className="flex-1">
              <Text className="text-text text-base font-semibold">Settings</Text>
              <Text className="text-muted text-xs mt-0.5">TTS speed, account, reset</Text>
            </View>
          </View>
        </PressableScale>
      </Animated.View>
    </Screen>
  );
}
