import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { getCachedPreferences, loadPreferences, subscribePreferences, type Preferences } from "../../lib/preferences";
import { getCachedXp, levelForXp, loadXp, subscribeXp, type XpState } from "../../lib/xp";
import { getCachedStreak, loadStreak, subscribeStreak, todaysCount, type Streak } from "../../lib/streak";
import { getRepos } from "../../lib/db";
import { currentUserId, subscribeAuthState } from "../../lib/auth";
import { topicsForLanguage } from "../../lib/content";

const C = {
  surface: "#111a2e",
  border: "#1f2a44",
  text: "#e6ecf5",
  muted: "#8aa0c2",
  bg: "#0b1220",
  en: "#3b82f6",
  success: "#22c55e",
} as const;

export function StatsBanner() {
  const [prefs, setPrefs] = useState<Preferences>(getCachedPreferences());
  const [xp, setXp] = useState<XpState>(getCachedXp());
  const [streak, setStreak] = useState<Streak>(getCachedStreak());
  const [topicsState, setTopicsState] = useState<{ passed: number; total: number }>({ passed: 0, total: 0 });

  useEffect(() => {
    void loadPreferences().then(setPrefs);
    void loadXp().then(setXp);
    void loadStreak().then(setStreak);
    const u1 = subscribePreferences(setPrefs);
    const u2 = subscribeXp(setXp);
    const u3 = subscribeStreak(setStreak);
    return () => { u1(); u2(); u3(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const lang = prefs.defaultLanguage ?? "en";
      const repos = await getRepos();
      const total = topicsForLanguage(lang).length;
      const passedSet = await repos.log.passedTopicIds(currentUserId());
      if (!cancelled) setTopicsState({ passed: passedSet.size, total });
    }
    void refresh();
    const unsub = subscribeAuthState(() => void refresh());
    return () => { cancelled = true; unsub(); };
  }, [prefs.defaultLanguage]);

  const today = todaysCount(streak);
  const goalMet = today >= prefs.dailyGoal;
  const lvl = levelForXp(xp.total);
  const recentDelta = xp.lastDelta > 0 && Date.now() - xp.lastUpdatedAt < 6000 ? xp.lastDelta : 0;

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
        {/* Completed topics */}
        <View
          style={{
            flex: 1,
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 14,
            minHeight: 70,
            justifyContent: "center",
          }}
        >
          <Text style={{ color: C.muted, fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" }}>
            Topics
          </Text>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "700", marginTop: 4 }}>
            📚 {topicsState.passed} / {topicsState.total}
          </Text>
        </View>

        {/* Today */}
        <View
          style={{
            flex: 1,
            backgroundColor: goalMet ? "#22c55e1a" : C.surface,
            borderWidth: 1,
            borderColor: goalMet ? "#22c55e99" : C.border,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 14,
            minHeight: 70,
            justifyContent: "center",
          }}
        >
          <Text style={{ color: C.muted, fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" }}>
            Today
          </Text>
          <Text style={{ color: C.text, fontSize: 18, fontWeight: "700", marginTop: 4 }}>
            🔥 {today} / {prefs.dailyGoal} {goalMet ? "✓" : ""}
          </Text>
        </View>
      </View>

      {/* XP bar */}
      <View
        style={{
          backgroundColor: C.surface,
          borderWidth: 1,
          borderColor: C.border,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ color: C.muted, fontSize: 10, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" }}>
            ⭐ Level {lvl.level}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: C.muted, fontSize: 12 }}>
              {lvl.intoLevel} / {lvl.perLevel} XP
            </Text>
            {recentDelta > 0 ? (
              <Animated.Text
                entering={FadeIn.duration(180)}
                exiting={FadeOut.duration(400)}
                style={{ color: C.success, fontWeight: "700", fontSize: 13 }}
              >
                +{recentDelta} XP
              </Animated.Text>
            ) : null}
          </View>
        </View>
        <View
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: C.bg,
            borderWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              backgroundColor: C.en,
              borderRadius: 4,
              width: `${Math.round(lvl.pct * 100)}%`,
            }}
          />
        </View>
      </View>
    </View>
  );
}
