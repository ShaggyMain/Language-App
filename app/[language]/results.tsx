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

const C = {
  bg: "#0b1220",
  surface: "#111a2e",
  border: "#1f2a44",
  text: "#e6ecf5",
  muted: "#8aa0c2",
  en: "#3b82f6",
  success: "#22c55e",
  warning: "#eab308",
  error: "#f43f5e",
} as const;

export default function ResultsScreen() {
  const { language } = useLocalSearchParams<{ language: string }>();
  const [data, setData] = useState<{ state: SessionState; summary: SessionSummary } | null>(null);

  useEffect(() => {
    setData(consumeSession());
  }, []);

  if (!data) {
    return (
      <Screen title="Results">
        <Text style={{ color: C.muted }}>No session results available.</Text>
        <PressableScale
          onPress={() => router.replace(`/${language ?? "en"}`)}
          style={{
            backgroundColor: C.en,
            borderRadius: 12,
            paddingVertical: 16,
            paddingHorizontal: 16,
            marginTop: 16,
            alignItems: "center",
            minHeight: 48,
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Go home</Text>
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
  let headlineColor = C.warning;
  if (isPerfect) {
    headlineEmoji = "🎉";
    headline = "Perfect!";
    headlineColor = C.success;
  } else if (isPath && summary.passedPath) {
    headlineEmoji = "✅";
    headline = "Passed";
    headlineColor = C.success;
  } else if (summary.overall >= 0.7) {
    headlineEmoji = "👍";
    headline = "Nice work";
    headlineColor = C.text;
  }

  const streak = getCachedStreak();
  const xp = computeSessionXp({
    summary,
    streakAlive: streak.streak >= 1,
    firstPathPass: false,
  });

  const ringColor = isPerfect ? C.success : pct >= 70 ? C.en : C.warning;

  return (
    <Screen title="Results">
      <Animated.View
        entering={ZoomIn.springify().damping(20).mass(0.6)}
        style={{ alignItems: "center", marginBottom: 24 }}
      >
        <Text style={{ fontSize: 56, marginBottom: 8 }}>{headlineEmoji}</Text>
        <Text style={{ color: headlineColor, fontSize: 28, fontWeight: "700", marginBottom: 8 }}>
          {headline}
        </Text>
        <ProgressRing
          progress={summary.overall}
          size={120}
          thickness={10}
          color={ringColor}
          label={`${pct}%`}
        />
        <Text style={{ color: C.muted, marginTop: 12 }}>
          {summary.correct} / {summary.total} correct
        </Text>
      </Animated.View>

      {xp.total > 0 ? (
        <Animated.View
          entering={FadeInDown.delay(300).springify().damping(20)}
          style={{
            backgroundColor: "#3b82f610",
            borderWidth: 1,
            borderColor: "#3b82f640",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 16,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: C.text, fontWeight: "600" }}>⭐ XP earned</Text>
            <Text style={{ color: C.en, fontSize: 22, fontWeight: "700" }}>+{xp.total}</Text>
          </View>
          <View style={{ marginTop: 8, gap: 4 }}>
            <Row label={`${summary.correct} correct × 10`} value={`+${xp.base}`} />
            {xp.perfect ? <Row label="Perfect bonus" value={`+${xp.perfect}`} /> : null}
            {xp.streak ? <Row label="Streak alive" value={`+${xp.streak}`} /> : null}
          </View>
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>
            Total: {getCachedXp().total} XP
          </Text>
        </Animated.View>
      ) : null}

      <Animated.View entering={FadeIn.delay(400)}>
        <Text style={{ color: C.text, fontWeight: "600", marginBottom: 8 }}>By exercise type</Text>
        <View style={{ gap: 8, marginBottom: 24 }}>
          {Object.entries(summary.byType).map(([type, e]) => {
            const typePct = Math.round(e.pct * 100);
            return (
              <View
                key={type}
                style={{
                  backgroundColor: C.surface,
                  borderWidth: 1,
                  borderColor: C.border,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <ProgressRing
                  progress={e.pct}
                  size={36}
                  thickness={3}
                  color={typePct >= 70 ? C.success : typePct >= 50 ? C.warning : C.error}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, textTransform: "capitalize" }}>{type}</Text>
                  <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                    {e.correct} / {e.total} ({typePct}%)
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={{ color: C.text, fontWeight: "600", marginBottom: 8 }}>Items</Text>
        <View style={{ gap: 8 }}>
          {state.items.map((it, idx) => {
            const ok = it.result?.correct;
            const borderColor = ok === undefined ? C.border : ok ? "#22c55e99" : "#f43f5e99";
            const prompt = "prompt" in it.exercise ? it.exercise.prompt : it.exercise.type;
            return (
              <View
                key={idx}
                style={{
                  backgroundColor: C.surface,
                  borderWidth: 1,
                  borderColor,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text>{ok === true ? "✅" : ok === false ? "❌" : "⏭"}</Text>
                  <Text style={{ color: C.text, flex: 1 }}>{prompt}</Text>
                </View>
                {it.userInput ? (
                  <Text style={{ color: C.muted, fontSize: 12, marginTop: 4, marginLeft: 28 }}>
                    You: {it.userInput}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      </Animated.View>

      <PressableScale
        onPress={() => router.replace(`/${language ?? "en"}`)}
        style={{
          backgroundColor: C.en,
          borderRadius: 12,
          paddingVertical: 16,
          marginTop: 24,
          marginBottom: 8,
          alignItems: "center",
          minHeight: 48,
        }}
      >
        <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>Done</Text>
      </PressableScale>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ color: C.muted, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: C.text, fontSize: 14 }}>{value}</Text>
    </View>
  );
}
