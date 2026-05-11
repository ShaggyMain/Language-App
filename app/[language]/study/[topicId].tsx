import { ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../../components/ui/Screen";
import { PressableScale } from "../../../components/ui/PressableScale";
import { topicById } from "../../../lib/content";

const C = {
  surface: "#111a2e",
  border: "#1f2a44",
  text: "#e6ecf5",
  muted: "#8aa0c2",
  bg: "#0b1220",
  en: "#3b82f6",
} as const;

export default function StudyTopicScreen() {
  const { topicId, language } = useLocalSearchParams<{ topicId: string; language: string }>();
  const topic = topicId ? topicById(decodeURIComponent(topicId)) : undefined;

  if (!topic) {
    return (
      <Screen title="Topic">
        <Text style={{ color: C.muted }}>Topic not found.</Text>
      </Screen>
    );
  }

  function goToPractice() {
    router.push(`/${language}/practice/${encodeURIComponent(decodeURIComponent(topicId!))}`);
  }

  return (
    <Screen title={topic.title}>
      <Text style={{ color: C.muted, marginBottom: 16, lineHeight: 22 }}>{topic.summary}</Text>

      {topic.theory.map((block, idx) => (
        <View
          key={idx}
          style={{
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
          }}
        >
          {block.kind === "text" && (
            <Text style={{ color: C.text, lineHeight: 24, fontSize: 14 }}>{block.markdown}</Text>
          )}

          {block.kind === "table" && (
            <View>
              {block.title ? (
                <Text style={{ color: C.text, fontWeight: "600", marginBottom: 10 }}>
                  {block.title}
                </Text>
              ) : null}
              <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, overflow: "hidden" }}>
                <View style={{ flexDirection: "row", backgroundColor: C.bg }}>
                  {block.headers.map((h, i) => (
                    <Text
                      key={i}
                      style={{ flex: 1, color: C.muted, fontSize: 11, padding: 8, fontWeight: "600" }}
                    >
                      {h}
                    </Text>
                  ))}
                </View>
                {block.rows.map((row, ri) => (
                  <View
                    key={ri}
                    style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: C.border }}
                  >
                    {row.map((cell, ci) => (
                      <Text key={ci} style={{ flex: 1, color: C.text, fontSize: 13, padding: 8 }}>
                        {cell}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          )}

          {block.kind === "examples" && (
            <View style={{ gap: 10 }}>
              {block.items.map((it, i) => (
                <View key={i}>
                  <Text style={{ color: C.text, fontSize: 14 }}>{it.source}</Text>
                  {it.translation ? (
                    <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{it.translation}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      ))}

      {/* Practice shortcut */}
      <PressableScale
        onPress={goToPractice}
        style={{
          marginTop: 8,
          marginBottom: 16,
          borderRadius: 16,
          paddingVertical: 18,
          paddingHorizontal: 24,
          backgroundColor: C.en,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 10,
        }}
      >
        <Text style={{ color: "white", fontSize: 17, fontWeight: "700" }}>Practice this topic</Text>
        <Text style={{ color: "white", fontSize: 18 }}>▸</Text>
      </PressableScale>
    </Screen>
  );
}
