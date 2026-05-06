import { Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Screen } from "../../../components/ui/Screen";
import { Card } from "../../../components/ui/Card";
import { Language } from "../../../lib/types";
import { topicsForLanguage } from "../../../lib/content";
import { languageMeta } from "../../../lib/languages";

export default function StudyScreen() {
  const { language } = useLocalSearchParams<{ language: string }>();
  const parsed = Language.safeParse(language);
  if (!parsed.success) return null;
  const lang = parsed.data;
  const meta = languageMeta(lang);
  const topics = topicsForLanguage(lang);

  return (
    <Screen title="Study">
      <Text className="text-muted mb-6">Read theory at your own pace. No grading here.</Text>
      {topics.length === 0 ? (
        <View className="bg-surface border border-border rounded-2xl p-5">
          <Text className="text-text">No topics yet for {meta.name}.</Text>
        </View>
      ) : (
        topics.map((t) => (
          <Card
            key={t.id}
            title={t.title}
            subtitle={`${t.category} · ${t.cefrLevel}`}
            accent={meta.accent}
            onPress={() => router.push(`/${lang}/study/${encodeURIComponent(t.id)}`)}
          />
        ))
      )}
    </Screen>
  );
}
