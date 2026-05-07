import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { getCachedStreak, loadStreak, subscribeStreak, todaysCount, type Streak } from "../../lib/streak";
import {
  getCachedPreferences,
  loadPreferences,
  subscribePreferences,
  type Preferences,
} from "../../lib/preferences";
import { getCachedXp, levelForXp, loadXp, subscribeXp, type XpState } from "../../lib/xp";

/**
 * The dense vitals strip rendered above the home language picker:
 *   🔥 streak    📅 today/goal    ⭐ level + xp progress
 *
 * All three pieces subscribe to their respective stores so they update
 * live when a session finishes.
 */
export function StatsBanner() {
  const [streak, setStreak] = useState<Streak>(getCachedStreak());
  const [prefs, setPrefs] = useState<Preferences>(getCachedPreferences());
  const [xp, setXp] = useState<XpState>(getCachedXp());

  useEffect(() => {
    void loadStreak().then(setStreak);
    void loadPreferences().then(setPrefs);
    void loadXp().then(setXp);
    const u1 = subscribeStreak(setStreak);
    const u2 = subscribePreferences(setPrefs);
    const u3 = subscribeXp(setXp);
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const today = todaysCount(streak);
  const goalMet = today >= prefs.dailyGoal;
  const lvl = levelForXp(xp.total);
  const recentDelta = xp.lastDelta > 0 && Date.now() - xp.lastUpdatedAt < 6000 ? xp.lastDelta : 0;

  return (
    <View className="mb-6">
      <View className="flex-row gap-2 mb-3">
        <View className="flex-1 bg-surface border border-border rounded-xl px-3 py-3 min-h-[64px] justify-center">
          <Text className="text-muted text-xs uppercase tracking-wide">Streak</Text>
          <Text className="text-text text-lg font-semibold mt-1">
            🔥 {streak.streak} {streak.streak === 1 ? "day" : "days"}
          </Text>
        </View>
        <View
          className={`flex-1 border rounded-xl px-3 py-3 min-h-[64px] justify-center ${goalMet ? "bg-success/15 border-success/60" : "bg-surface border-border"}`}
        >
          <Text className="text-muted text-xs uppercase tracking-wide">Today</Text>
          <Text className="text-text text-lg font-semibold mt-1">
            📅 {today} / {prefs.dailyGoal} {goalMet ? "✓" : ""}
          </Text>
        </View>
      </View>

      <View className="bg-surface border border-border rounded-xl px-3 py-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-muted text-xs uppercase tracking-wide">⭐ Level {lvl.level}</Text>
          <Text className="text-muted text-xs">
            {lvl.intoLevel} / {lvl.perLevel} XP
          </Text>
          {recentDelta > 0 ? (
            <Animated.Text
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(400)}
              className="text-success font-bold ml-2"
            >
              +{recentDelta} XP
            </Animated.Text>
          ) : null}
        </View>
        <View className="h-2 rounded-full bg-bg border border-border overflow-hidden">
          <View
            className="h-full bg-en"
            style={{ width: `${Math.round(lvl.pct * 100)}%` }}
          />
        </View>
      </View>
    </View>
  );
}
