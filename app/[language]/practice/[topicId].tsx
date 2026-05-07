import { Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../../../components/ui/Screen";
import { SessionRunner } from "../../../components/exercises/SessionRunner";
import { topicById } from "../../../lib/content";

export default function PracticeTopicScreen() {
  const { language, topicId } = useLocalSearchParams<{ language: string; topicId: string }>();
  const topic = topicId ? topicById(decodeURIComponent(topicId)) : undefined;
  if (!topic) {
    return (
      <Screen title="Practice">
        <Text className="text-muted">Topic not found.</Text>
      </Screen>
    );
  }
  return (
    <Screen title={topic.title} scroll={false}>
      <SessionRunner language={language ?? "en"} topic={topic} mode="practice" />
    </Screen>
  );
}
