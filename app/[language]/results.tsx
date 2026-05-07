import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { Screen } from "../../components/ui/Screen";
import { PressableScale } from "../../components/ui/PressableScale";
import { ProgressRing } from "../../components/ui/ProgressRing";
import { consumeSession } from "../../lib/sessionStore";
import type { SessionState, SessionSummary } from "../../lib/session";
import { computeSessionXp, getCachedXp } from "../../lib/xp";
import { getCachedStreak } from "../../lib/streak";

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
        <PressableScale
          onPress={() => router.replace(`/${language ?? "en"}`)}
          className="bg-en rounded-xl py-4 px-4 mt-4 items-center min-h-[48px]"
        >
          <Text className="text-white font-semibold">Go home</Text>
        </PressableScale>
      </Screen>
    );
  }

  const { summary, state } = data;
  const pct = Math.round(summary.overall * 100);
  const isPerfect = summary.total > 0 && summary.correct === summary.total;
  const isPath = state.mode === "path";

  let headlineEmoji = "💪";
  let headline = "Keep going";
  let tone = "text-warning";
  if (isPerfect) {
    headlineEmoji = "🎉";
    headline = "Perfect!";
    tone = "text-success";
  } else if (isPath && summary.passedPath) {
    headlineEmoji = "✅";
    headline = "Passed";
    tone = "text-success";
  } else if (summary.overall >= 0.7) {
    headlineEmoji = "👍";
    headline = "Nice work";
    tone = "text-text";
  }

  // Replay the same XP calc the runner did so the user sees a breakdown.
  const streak = getCachedStreak();
  const xp = computeSessionXp({
    summary,
    streakAlive: streak.streak >= 1,
    firstPathPass: false, // unknown without re-querying repos; show conservatively
  });

  const ringColor = isPerfect ? "#22c55e" : pct >= 70 ? "#3b82f6" : "#eab308";

  return (
    <Screen title="Results">
      <Animated.View
        entering={ZoomIn.springify().damping(14).mass(0.6)}
        className="items-center mb-6"
      >
        <Text className="text-6xl mb-2">{headlineEmoji}</Text>
        <Text className={`text-3xl font-bold mb-2 ${tone}`}>{headline}</Text>
        <ProgressRing
          progress={summary.overall}
          size={120}
          thickness={10}
          color={ringColor}
          label={`${pct}%`}
        />
        <Text className="text-muted mt-3">
          {summary.correct} / {summary.total} correct
        </Text>
      </Animated.View>

      {xp.total > 0 ? (
        <Animated.View
          entering={FadeInDown.delay(300).springify().damping(16)}
          className="bg-en/10 border border-en/40 rounded-2xl px-4 py-4 mb-6"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-text font-semibold">⭐ XP earned</Text>
            <Text className="text-en text-2xl font-bold">+{xp.total}</Text>
          </View>
          <View className="mt-2 gap-1">
            <Row label={`${summary.correct} correct × 10`} value={`+${xp.base}`} />
            {xp.perfect ? <Row label="Perfect bonus" value={`+${xp.perfect}`} /> : null}
            {xp.streak ? <Row label="Streak alive" value={`+${xp.streak}`} /> : null}
          </View>
          <Text className="text-muted text-xs mt-2">Total: {getCachedXp().total} XP</Text>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeIn.delay(400)}>
        <Text className="text-text font-semibold mb-2">By exercise type</Text>
        <View className="gap-2 mb-6">
          {Object.entries(summary.byType).map(([type, e]) => {
            const typePct = Math.round(e.pct * 100);
            return (
              <View key={type} className="bg-surface border border-border rounded-xl px-3 py-2 flex-row items-center gap-3">
                <ProgressRing
                  progress={e.pct}
                  size={36}
                  thickness={3}
                  color={typePct >= 70 ? "#22c55e" : typePct >= 50 ? "#eab308" : "#f43f5e"}
                />
                <View className="flex-1">
                  <Text className="text-text capitalize">{type}</Text>
                  <Text className="text-muted text-xs mt-0.5">
                    {e.correct} / {e.total} ({typePct}%)
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text className="text-text font-semibold mb-2">Items</Text>
        <View className="gap-2">
          {state.items.map((it, idx) => {
            const ok = it.result?.correct;
            const tone =
              ok === undefined ? "border-border" : ok ? "border-success/60" : "border-error/60";
            const prompt = "prompt" in it.exercise ? it.exercise.prompt : it.exercise.type;
            return (
              <View key={idx} className={`bg-surface border ${tone} rounded-xl px-3 py-2`}>
                <View className="flex-row items-center gap-2">
                  <Text>{ok === true ? "✅" : ok === false ? "❌" : "⏭"}</Text>
                  <Text className="text-text flex-1">{prompt}</Text>
                </View>
                {it.userInput ? (
                  <Text className="text-muted text-xs mt-1 ml-7">You: {it.userInput}</Text>
                ) : null}
              </View>
            );
          })}
        </View>
      </Animated.View>

      <PressableScale
        onPress={() => router.replace(`/${language ?? "en"}`)}
        className="bg-en rounded-xl py-4 mt-6 mb-2 items-center min-h-[48px]"
      >
        <Text className="text-white font-semibold text-base">Done</Text>
      </PressableScale>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-muted text-sm">{label}</Text>
      <Text className="text-text text-sm">{value}</Text>
    </View>
  );
}
