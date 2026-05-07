import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { consumeSession } from "../../lib/sessionStore";
import type { SessionState, SessionSummary } from "../../lib/session";

export default function ResultsScreen() {
  const { language } = useLocalSearchParams<{ language: string }>();
  const [data, setData] = useState<{ state: SessionState; summary: SessionSummary } | null>(null);

  useEffect(() => {
    setData(consumeSession());
  }, []);

  if (!data) {
    return (
      <Screen title="Results">
        <Text className="text-muted">No session results available.</Text>
        <Pressable
          onPress={() => router.replace(`/${language ?? "en"}`)}
          className="bg-en rounded-xl py-3 px-4 mt-4 items-center"
        >
          <Text className="text-white font-semibold">Go home</Text>
        </Pressable>
      </Screen>
    );
  }

  const { summary, state } = data;
  const pct = Math.round(summary.overall * 100);
  const headlineTone = summary.passedPath ? "text-success" : "text-warning";
  const headline = summary.passedPath ? "Passed!" : "Keep practicing";

  return (
    <Screen title="Results">
      <Text className={`text-3xl font-bold ${headlineTone} mb-1`}>{headline}</Text>
      <Text className="text-muted mb-6">
        {summary.correct} / {summary.total} correct ({pct}%)
      </Text>

      <Text className="text-text font-semibold mb-2">By exercise type</Text>
      <View className="gap-2 mb-6">
        {Object.entries(summary.byType).map(([type, e]) => (
          <View key={type} className="bg-surface border border-border rounded-xl px-3 py-2">
            <Text className="text-text capitalize">{type}</Text>
            <Text className="text-muted text-xs">
              {e.correct} / {e.total} ({Math.round(e.pct * 100)}%)
            </Text>
          </View>
        ))}
      </View>

      <Text className="text-text font-semibold mb-2">Items</Text>
      <View className="gap-2">
        {state.items.map((it, idx) => {
          const ok = it.result?.correct;
          const tone = ok === undefined ? "border-border" : ok ? "border-success/60" : "border-error/60";
          const prompt = "prompt" in it.exercise ? it.exercise.prompt : it.exercise.type;
          return (
            <View key={idx} className={`bg-surface border ${tone} rounded-xl px-3 py-2`}>
              <Text className="text-text">{prompt}</Text>
              {it.userInput ? (
                <Text className="text-muted text-xs mt-1">You: {it.userInput}</Text>
              ) : null}
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={() => router.replace(`/${language ?? "en"}`)}
        className="bg-en rounded-xl py-3 mt-6 items-center"
      >
        <Text className="text-white font-semibold">Done</Text>
      </Pressable>
    </Screen>
  );
}
