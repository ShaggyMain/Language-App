import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../components/ui/Screen";
import { Card } from "../../components/ui/Card";
import { ProgressRing } from "../../components/ui/ProgressRing";
import { Language } from "../../lib/types";
import { languageMeta } from "../../lib/languages";
import { topicsForLanguage } from "../../lib/content";
import { getRepos } from "../../lib/db";
import { currentUserId, subscribeAuthState } from "../../lib/auth";
import { masteryMap } from "../../lib/mastery";

export default function ModePicker() {
  const { language } = useLocalSearchParams<{ language: string }>();
  const parsed = Language.safeParse(language);
  const [stats, setStats] = useState<{ overall: number; passed: number; total: number }>({
    overall: 0,
    passed: 0,
    total: 0,
  });

  const lang = parsed.success ? parsed.data : "en";
  const meta = parsed.success ? languageMeta(lang) : null;
  const topics = parsed.success ? topicsForLanguage(lang) : [];

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const repos = await getRepos();
      const m = await masteryMap(repos, currentUserId(), topics.map((t) => t.id));
      const values = Object.values(m);
      if (cancelled) return;
      const overall = values.length ? values.reduce((s, x) => s + x.score, 0) / values.length : 0;
      const passed = values.filter((x) => x.passed).length;
      setStats({ overall, passed, total: topics.length });
    }
    void refresh();
    const unsub = subscribeAuthState(() => void refresh());
    return () => {
      cancelled = true;
      unsub();
    };
  }, [topics]);

  if (!parsed.success || !meta) {
    return (
      <Screen title="Unknown language">
        <Text className="text-muted">This language is not available.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <View
        className="bg-surface border border-border rounded-2xl px-4 py-4 mb-6 flex-row items-center gap-4"
        style={{ borderLeftWidth: 4, borderLeftColor: meta.accent }}
      >
        <View>
          <Text className="text-text text-3xl font-bold">
            {meta.flag} {meta.name}
          </Text>
          <Text className="text-muted text-sm mt-1">
            {stats.passed} / {stats.total} lessons passed
          </Text>
        </View>
        <View className="flex-1" />
        <ProgressRing
          progress={stats.overall}
          size={64}
          thickness={6}
          color={meta.accent}
          label={`${Math.round(stats.overall * 100)}`}
        />
      </View>

      <Text className="text-muted mb-3">Pick how you want to learn today.</Text>

      <Card
        title="Path"
        subtitle="Linear course. Pass each lesson to unlock the next."
        icon={<Text style={{ fontSize: 28 }}>🛤️</Text>}
        accent={meta.accent}
        onPress={() => router.push(`/${lang}/path`)}
      />
      <Card
        title="Study"
        subtitle="Read theory of any topic, anytime."
        icon={<Text style={{ fontSize: 28 }}>📖</Text>}
        accent={meta.accent}
        onPress={() => router.push(`/${lang}/study`)}
      />
      <Card
        title="Practice"
        subtitle="Drill exercises from the topics you choose."
        icon={<Text style={{ fontSize: 28 }}>🎯</Text>}
        accent={meta.accent}
        onPress={() => router.push(`/${lang}/practice`)}
      />
    </Screen>
  );
}
