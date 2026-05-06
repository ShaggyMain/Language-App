import { Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../../../components/ui/Screen";
import { topicById } from "../../../lib/content";

export default function PracticeTopicScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const topic = topicId ? topicById(decodeURIComponent(topicId)) : undefined;
  return (
    <Screen title={topic?.title ?? "Practice"}>
      <Text className="text-muted">
        Coming soon: 10-question session covering this topic with fuzzy grading.
      </Text>
    </Screen>
  );
}
