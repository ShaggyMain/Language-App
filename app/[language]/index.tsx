import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { Language } from "../../lib/types";
import { languageMeta } from "../../lib/languages";

export default function ModePicker() {
  const { language } = useLocalSearchParams<{ language: string }>();
  const parsed = Language.safeParse(language);
  if (!parsed.success) {
    return (
      <Screen title="Unknown language">
        <Text className="text-muted">This language is not available.</Text>
      </Screen>
    );
  }
  const lang = parsed.data;
  const meta = languageMeta(lang);

  return (
    <Screen>
      <Text className="text-text text-3xl font-bold mb-1">{meta.flag} {meta.name}</Text>
      <Text className="text-muted mb-6">Pick how you want to learn today.</Text>

      <Card
        title="Path"
        subtitle="Linear course. Pass each lesson to unlock the next."
        accent={meta.accent}
        onPress={() => router.push(`/${lang}/path`)}
      />
      <Card
        title="Study"
        subtitle="Read theory of any topic, anytime."
        accent={meta.accent}
        onPress={() => router.push(`/${lang}/study`)}
      />
      <Card
        title="Practice"
        subtitle="Drill exercises from the topics you choose."
        accent={meta.accent}
        onPress={() => router.push(`/${lang}/practice`)}
      />
    </Screen>
  );
}
