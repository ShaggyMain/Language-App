import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Screen } from "../../../components/ui/Screen";
import { Card } from "../../../components/ui/Card";
import { Language } from "../../../lib/types";
import { topicsForLanguage } from "../../../lib/content";
import { languageMeta } from "../../../lib/languages";
import { getRepos } from "../../../lib/db";
import { currentUserId, subscribeAuthState } from "../../../lib/auth";
import { masteryMap, type Mastery } from "../../../lib/mastery";

export default function PracticeScreen() {
  const { language } = useLocalSearchParams<{ language: string }>();
  const parsed = Language.safeParse(language);
  const [mastery, setMastery] = useState<Record<string, Mastery>>({});

  const lang = parsed.success ? parsed.data : "en";
  const topics = parsed.success ? topicsForLanguage(lang) : [];

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const repos = await getRepos();
      const langTopics = parsed.success ? topicsForLanguage(lang) : [];
      const m = await masteryMap(repos, currentUserId(), langTopics.map((t) => t.id));
      if (!cancelled) setMastery(m);
    }
    void refresh();
    const unsub = subscribeAuthState(() => void refresh());
    return () => {
      cancelled = true;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  if (!parsed.success) return null;
  const meta = languageMeta(lang);

  return (
    <Screen title="Practice">
      <Text className="text-muted mb-6">Pick a topic and drill 10 mixed-type exercises.</Text>
      {topics.length === 0 ? (
        <View className="bg-surface border border-border rounded-2xl p-5">
          <Text className="text-text">No topics yet for {meta.name}.</Text>
        </View>
      ) : (
        topics.map((t) => (
          <Card
            key={t.id}
            title={t.title}
            subtitle={t.summary}
            badge={`${t.cefrLevel} · ${t.exercises.length} exercises`}
            accent={meta.accent}
            progress={mastery[t.id]?.score ?? 0}
            onPress={() => router.push(`/${lang}/practice/${encodeURIComponent(t.id)}`)}
          />
        ))
      )}
    </Screen>
  );
}
