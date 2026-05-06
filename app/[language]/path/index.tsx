import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../../../components/ui/Screen";
import { Card } from "../../../components/ui/Card";
import { Language } from "../../../lib/types";
import { topicsForLanguage } from "../../../lib/content";
import { languageMeta } from "../../../lib/languages";
import { router } from "expo-router";

export default function PathScreen() {
  const { language } = useLocalSearchParams<{ language: string }>();
  const parsed = Language.safeParse(language);
  if (!parsed.success) return null;
  const lang = parsed.data;
  const meta = languageMeta(lang);
  const topics = topicsForLanguage(lang);

  return (
    <Screen title="Path">
      <Text className="text-muted mb-6">Complete each lesson with ≥ 80% to unlock the next.</Text>
      {topics.length === 0 ? (
        <View className="bg-surface border border-border rounded-2xl p-5">
          <Text className="text-text">No lessons yet for {meta.name}.</Text>
          <Text className="text-muted mt-2 text-sm">
            Add JSON files under content/{lang}/ and register them in lib/content.ts.
          </Text>
        </View>
      ) : (
        topics.map((t, idx) => (
          <Card
            key={t.id}
            title={`${idx + 1}. ${t.title}`}
            subtitle={`${t.cefrLevel} · ${t.exercises.length} exercises`}
            accent={meta.accent}
            onPress={() => router.push(`/${lang}/path/${encodeURIComponent(t.id)}`)}
          />
        ))
      )}
    </Screen>
  );
}
