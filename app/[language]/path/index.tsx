import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Screen } from "../../../components/ui/Screen";
import { Card } from "../../../components/ui/Card";
import { Language, type Topic } from "../../../lib/types";
import { topicsForLanguage } from "../../../lib/content";
import { languageMeta } from "../../../lib/languages";
import { getRepos } from "../../../lib/db";
import { currentUserId, subscribeAuthState } from "../../../lib/auth";
import { masteryMap, type Mastery } from "../../../lib/mastery";

export default function PathScreen() {
  const { language } = useLocalSearchParams<{ language: string }>();
  const parsed = Language.safeParse(language);
  const [passed, setPassed] = useState<Set<string>>(new Set());
  const [mastery, setMastery] = useState<Record<string, Mastery>>({});
  const [warned, setWarned] = useState<string | null>(null);

  const lang = parsed.success ? parsed.data : "en";
  const topics = parsed.success ? topicsForLanguage(lang) : [];
  const meta = parsed.success ? languageMeta(lang) : null;

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const repos = await getRepos();
      const uid = currentUserId();
      const langTopics = parsed.success ? topicsForLanguage(lang) : [];
      const set = await repos.log.passedTopicIds(uid);
      const mast = await masteryMap(repos, uid, langTopics.map((t) => t.id));
      if (!cancelled) { setPassed(set); setMastery(mast); }
    }
    void refresh();
    const unsub = subscribeAuthState(() => void refresh());
    return () => { cancelled = true; unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  if (!parsed.success || !meta) return null;

  function isLocked(t: Topic): boolean {
    if (!t.prerequisites || t.prerequisites.length === 0) return false;
    return !t.prerequisites.every((p) => passed.has(p));
  }

  return (
    <Screen title="Path">
      <Text style={{ color: "#8aa0c2", fontSize: 14, marginBottom: 20, lineHeight: 20 }}>
        Complete each lesson with ≥ 80% to unlock the next.
      </Text>
      {warned ? (
        <View
          style={{
            backgroundColor: "#eab30818",
            borderWidth: 1,
            borderColor: "#eab308",
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginBottom: 14,
          }}
        >
          <Text style={{ color: "#e6ecf5", fontSize: 13 }}>
            Pass "{warned}" first to unlock this lesson.
          </Text>
        </View>
      ) : null}
      {topics.length === 0 ? (
        <View
          style={{
            backgroundColor: "#111a2e",
            borderWidth: 1,
            borderColor: "#1f2a44",
            borderRadius: 16,
            padding: 20,
          }}
        >
          <Text style={{ color: "#e6ecf5" }}>No lessons yet for {meta.name}.</Text>
        </View>
      ) : (
        topics.map((t, idx) => {
          const locked = isLocked(t);
          const done = passed.has(t.id);
          const m = mastery[t.id];

          if (locked) {
            const blocker = t.prerequisites.find((p) => !passed.has(p));
            const blockerTitle = topics.find((x) => x.id === blocker)?.title ?? blocker ?? "";
            return (
              <Card
                key={t.id}
                title={`${idx + 1}. ${t.title}`}
                subtitle={`Locked — pass "${blockerTitle}" first`}
                badge={`${t.cefrLevel} · 🔒`}
                state="locked"
                onPress={() => setWarned(blockerTitle)}
              />
            );
          }
          return (
            <Card
              key={t.id}
              title={`${idx + 1}. ${t.title}${done ? " ✓" : ""}`}
              subtitle={t.summary}
              badge={`${t.cefrLevel} · ${t.exercises.length} exercises`}
              accent={done ? "#22c55e" : meta.accent}
              progress={m?.score ?? 0}
              state={done ? "passed" : "active"}
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
