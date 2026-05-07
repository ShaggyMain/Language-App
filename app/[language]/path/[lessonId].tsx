import { Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../../../components/ui/Screen";
import { SessionRunner } from "../../../components/exercises/SessionRunner";
import { topicById } from "../../../lib/content";

export default function LessonScreen() {
  const { language, lessonId } = useLocalSearchParams<{ language: string; lessonId: string }>();
  const topic = lessonId ? topicById(decodeURIComponent(lessonId)) : undefined;
  if (!topic) {
    return (
      <Screen title="Lesson">
        <Text className="text-muted">Lesson not found.</Text>
      </Screen>
    );
  }
  return (
    <Screen title={topic.title} scroll={false}>
      <SessionRunner language={language ?? "en"} topic={topic} mode="path" />
    </Screen>
  );
}
