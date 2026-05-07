import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { Screen } from "../../components/ui/Screen";
import { ProgressRing } from "../../components/ui/ProgressRing";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { PressableScale } from "../../components/ui/PressableScale";
import { Language } from "../../lib/types";
import { languageMeta } from "../../lib/languages";
import { topicsForLanguage } from "../../lib/content";
import { getRepos } from "../../lib/db";
import { currentUserId, subscribeAuthState } from "../../lib/auth";
import { masteryMap } from "../../lib/mastery";

export default function ModePicker() {
  const { language } = useLocalSearchParams<{ language: string }>();
  const parsed = Language.safeParse(language);
  const lang = parsed.success ? parsed.data : "en";
  const [stats, setStats] = useState<{ overall: number; passed: number; total: number; nextTopicId: string | null }>({
    overall: 0,
    passed: 0,
    total: 0,
    nextTopicId: null,
  });

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      if (!parsed.success) return;
      const repos = await getRepos();
      const langTopics = topicsForLanguage(lang);
      const m = await masteryMap(repos, currentUserId(), langTopics.map((t) => t.id));
      if (cancelled) return;
      const values = Object.values(m);
      const overall = values.length ? values.reduce((s, x) => s + x.score, 0) / values.length : 0;
      const passed = values.filter((x) => x.passed).length;
      // First non-passed topic = "next" Path step
      const next = langTopics.find((t) => !m[t.id]?.passed);
      setStats({ overall, passed, total: langTopics.length, nextTopicId: next?.id ?? null });
    }
    void refresh();
    const unsub = subscribeAuthState(() => void refresh());
    return () => {
      cancelled = true;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  if (!parsed.success) {
    return (
      <Screen title="Unknown language">
        <Text className="text-muted">This language is not available.</Text>
      </Screen>
    );
  }

  const meta = languageMeta(lang);
  const pct = Math.round(stats.overall * 100);

  return (
    <Screen>
      {/* Back to home */}
      <PressableScale
        onPress={() => router.replace("/")}
        className="self-start mb-2 px-2 py-1"
      >
        <Text className="text-muted text-base">‹ All courses</Text>
      </PressableScale>

      {/* Hero */}
      <Animated.View
        entering={FadeInDown.duration(300)}
        className="items-center mb-8 mt-2"
      >
        <Text className="text-7xl mb-3">{meta.flag}</Text>
        <Text className="text-text text-4xl font-bold mb-1">{meta.name}</Text>
        <Text className="text-muted text-base mb-5">
          {stats.passed} / {stats.total} lessons passed
        </Text>
        <Animated.View entering={ZoomIn.delay(200).springify().damping(14)}>
          <ProgressRing
            progress={stats.overall}
            size={140}
            thickness={10}
            color={meta.accent}
            label={`${pct}%`}
          />
        </Animated.View>
      </Animated.View>

      {/* Primary CTA — Continue Path or Start */}
      <Animated.View entering={FadeInDown.delay(350).duration(300)} className="mb-6">
        <PrimaryButton
          label={stats.passed === 0 ? "Start learning" : stats.passed === stats.total ? "Review path" : "Continue path"}
          color={meta.accent}
          icon={<Text className="text-white text-xl">▸</Text>}
          onPress={() =>
            stats.nextTopicId
              ? router.push(`/${lang}/path/${encodeURIComponent(stats.nextTopicId)}`)
              : router.push(`/${lang}/path`)
          }
        />
      </Animated.View>

      {/* Secondary actions */}
      <Animated.View entering={FadeInDown.delay(450).duration(300)} className="flex-row gap-3 mb-3">
        <SecondaryTile
          label="Path"
          subtitle="All lessons"
          emoji="🛤️"
          onPress={() => router.push(`/${lang}/path`)}
        />
        <SecondaryTile
          label="Practice"
          subtitle="Pick & drill"
          emoji="🎯"
          onPress={() => router.push(`/${lang}/practice`)}
        />
        <SecondaryTile
          label="Study"
          subtitle="Just theory"
          emoji="📖"
          onPress={() => router.push(`/${lang}/study`)}
        />
      </Animated.View>
    </Screen>
  );
}

function SecondaryTile({
  label,
  subtitle,
  emoji,
  onPress,
}: {
  label: string;
  subtitle: string;
  emoji: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center min-h-[100px] justify-center"
    >
      <Text className="text-3xl mb-2">{emoji}</Text>
      <Text className="text-text font-semibold">{label}</Text>
      <Text className="text-muted text-xs mt-0.5">{subtitle}</Text>
    </PressableScale>
  );
}
