import { Text } from "react-native";
import { router } from "expo-router";
import { Screen } from "../components/ui/Screen";
import { Card } from "../components/ui/Card";
import { LANGUAGES } from "../lib/languages";

export default function LanguagePicker() {
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
    </Screen>
  );
}
