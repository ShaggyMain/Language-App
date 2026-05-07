import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Screen } from "../../../components/ui/Screen";
import { Card } from "../../../components/ui/Card";
import { Language, type Topic } from "../../../lib/types";
import { topicsForLanguage } from "../../../lib/content";
import { languageMeta } from "../../../lib/languages";
import { getRepos } from "../../../lib/db";
import { currentUserId, subscribeAuthState } from "../../../lib/auth";

export default function PathScreen() {
  const { language } = useLocalSearchParams<{ language: string }>();
  const parsed = Language.safeParse(language);
  const [passed, setPassed] = useState<Set<string>>(new Set());
  const [warned, setWarned] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const repos = await getRepos();
      const set = await repos.log.passedTopicIds(currentUserId());
      if (!cancelled) setPassed(set);
    }
    void refresh();
    const unsub = subscribeAuthState(() => void refresh());
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  if (!parsed.success) return null;
  const lang = parsed.data;
  const meta = languageMeta(lang);
  const topics = topicsForLanguage(lang);

  function isLocked(t: Topic): boolean {
    if (!t.prerequisites || t.prerequisites.length === 0) return false;
    return !t.prerequisites.every((p) => passed.has(p));
  }

  return (
    <Screen title="Path">
      <Text className="text-muted mb-6">
        Complete each lesson with ≥ 80% to unlock the next.
      </Text>
      {warned ? (
        <View className="bg-warning/15 border border-warning rounded-xl px-3 py-2 mb-4">
          <Text className="text-text text-sm">Pass {warned} first to unlock this lesson.</Text>
        </View>
      ) : null}
      {topics.length === 0 ? (
        <View className="bg-surface border border-border rounded-2xl p-5">
          <Text className="text-text">No lessons yet for {meta.name}.</Text>
        </View>
      ) : (
        topics.map((t, idx) => {
          const locked = isLocked(t);
          const done = passed.has(t.id);
          const status = done ? " ✓" : locked ? " 🔒" : "";
          if (locked) {
            const blocker = t.prerequisites.find((p) => !passed.has(p));
            const blockerTitle = topics.find((x) => x.id === blocker)?.title ?? blocker ?? "";
            return (
              <Pressable
                key={t.id}
                onPress={() => setWarned(blockerTitle)}
                className="bg-surface border border-border rounded-2xl p-5 mb-3 opacity-50 active:opacity-70"
              >
                <Text className="text-text text-lg font-semibold">
                  {idx + 1}. {t.title}{status}
                </Text>
                <Text className="text-muted text-sm mt-1">
                  {t.cefrLevel} · locked — pass {blockerTitle} first
                </Text>
              </Pressable>
            );
          }
          return (
            <Card
              key={t.id}
              title={`${idx + 1}. ${t.title}${status}`}
              subtitle={`${t.cefrLevel} · ${t.exercises.length} exercises`}
              accent={done ? "#22c55e" : meta.accent}
              onPress={() => {
                setWarned(null);
                router.push(`/${lang}/path/${encodeURIComponent(t.id)}`);
              }}
            />
          );
        })
      )}
    </Screen>
  );
}
