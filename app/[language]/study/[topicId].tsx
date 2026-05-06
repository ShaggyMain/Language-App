import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../../../components/ui/Screen";
import { topicById } from "../../../lib/content";

export default function StudyTopicScreen() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const topic = topicId ? topicById(decodeURIComponent(topicId)) : undefined;
  if (!topic) {
    return (
      <Screen title="Topic">
        <Text className="text-muted">Topic not found.</Text>
      </Screen>
    );
  }
  return (
    <Screen title={topic.title}>
      <Text className="text-muted mb-4">{topic.summary}</Text>
      {topic.theory.map((block, idx) => (
        <View key={idx} className="bg-surface border border-border rounded-2xl p-4 mb-3">
          {block.kind === "text" && <Text className="text-text leading-6">{block.markdown}</Text>}
          {block.kind === "table" && (
            <View>
              {block.title ? <Text className="text-text font-semibold mb-2">{block.title}</Text> : null}
              <View className="border border-border rounded-xl overflow-hidden">
                <View className="flex-row bg-bg">
                  {block.headers.map((h, i) => (
                    <Text key={i} className="flex-1 text-muted text-xs p-2 font-semibold">{h}</Text>
                  ))}
                </View>
                {block.rows.map((row, ri) => (
                  <View key={ri} className="flex-row border-t border-border">
                    {row.map((cell, ci) => (
                      <Text key={ci} className="flex-1 text-text text-sm p-2">{cell}</Text>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          )}
          {block.kind === "examples" && (
            <View className="gap-2">
              {block.items.map((it, i) => (
                <View key={i}>
                  <Text className="text-text">{it.source}</Text>
                  {it.translation ? <Text className="text-muted text-sm">{it.translation}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </Screen>
  );
}
