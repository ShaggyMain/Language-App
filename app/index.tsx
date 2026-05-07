import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../components/ui/Screen";
import { Card } from "../components/ui/Card";
import { LANGUAGES } from "../lib/languages";
import { loadPreferences } from "../lib/preferences";

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
    <Screen title="Choose a language">
      <Text className="text-muted mb-6">Pick a course to start learning grammar.</Text>
      {LANGUAGES.map((lang) => (
        <Card
          key={lang.code}
          title={`${lang.flag}  ${lang.name}`}
          subtitle="Path · Study · Practice"
          accent={lang.accent}
          onPress={() => router.push(`/${lang.code}`)}
        />
      ))}
      <Card
        title="⚙️  Settings"
        subtitle="TTS speed, account, reset progress"
        onPress={() => router.push("/settings")}
      />
    </Screen>
  );
}
