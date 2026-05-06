import { Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../../../components/ui/Screen";
import { topicById } from "../../../lib/content";

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const topic = lessonId ? topicById(decodeURIComponent(lessonId)) : undefined;

  return (
    <Screen title={topic?.title ?? "Lesson"}>
      <Text className="text-muted mb-2">{topic?.summary ?? "Lesson not found."}</Text>
      <Text className="text-muted text-sm mt-6">
        Coming soon: theory + exercise session with passing threshold.
      </Text>
    </Screen>
  );
}
