import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "../components/ui/Screen";
import { LANGUAGES } from "../lib/languages";
import { savePreferences } from "../lib/preferences";
import type { CefrLevel, Language } from "../lib/types";

const LEVELS: { value: CefrLevel; label: string; sub: string }[] = [
  { value: "A1", label: "Beginner", sub: "I'm starting from scratch" },
  { value: "A2", label: "Elementary", sub: "I know basic phrases" },
  { value: "B1", label: "Intermediate", sub: "I can hold a conversation" },
];

export default function Onboarding() {
  const [lang, setLang] = useState<Language>("en");
  const [level, setLevel] = useState<CefrLevel>("A1");
  const [step, setStep] = useState<0 | 1>(0);

  async function finish() {
    await savePreferences({
      onboarded: true,
      defaultLanguage: lang,
      selfReportedLevel: level,
    });
    router.replace(`/${lang}`);
  }

  if (step === 0) {
    return (
      <Screen title="Welcome">
        <Text className="text-muted mb-6">Which language do you want to learn?</Text>
        {LANGUAGES.map((L) => (
          <Pressable
            key={L.code}
            onPress={() => setLang(L.code)}
            className={`bg-surface border rounded-2xl p-5 mb-3 ${lang === L.code ? "border-en" : "border-border"}`}
          >
            <View className="flex-row items-center gap-3">
              <View className="w-2 h-10 rounded-full" style={{ backgroundColor: L.accent }} />
              <View className="flex-1">
                <Text className="text-text text-lg font-semibold">
                  {L.flag}  {L.name}
                </Text>
                <Text className="text-muted text-sm mt-1">Path · Study · Practice</Text>
              </View>
              {lang === L.code ? <Text className="text-en text-2xl">✓</Text> : null}
            </View>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setStep(1)}
          className="bg-en rounded-xl px-4 py-4 items-center mt-4"
        >
          <Text className="text-white font-semibold text-base">Next</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen title="Your level">
      <Text className="text-muted mb-6">Pick your starting level.</Text>
      {LEVELS.map((L) => (
        <Pressable
          key={L.value}
          onPress={() => setLevel(L.value)}
          className={`bg-surface border rounded-2xl p-5 mb-3 ${level === L.value ? "border-en" : "border-border"}`}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-text text-lg font-semibold">
                {L.value} · {L.label}
              </Text>
              <Text className="text-muted text-sm mt-1">{L.sub}</Text>
            </View>
            {level === L.value ? <Text className="text-en text-2xl">✓</Text> : null}
          </View>
        </Pressable>
      ))}
      <View className="flex-row gap-3 mt-4">
        <Pressable
          onPress={() => setStep(0)}
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-4 items-center"
        >
          <Text className="text-text font-semibold">Back</Text>
        </Pressable>
        <Pressable
          onPress={finish}
          className="flex-1 bg-en rounded-xl px-4 py-4 items-center"
        >
          <Text className="text-white font-semibold">Start learning</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
