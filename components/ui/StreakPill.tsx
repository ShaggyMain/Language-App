import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { getCachedStreak, loadStreak, subscribeStreak, todaysCount, type Streak } from "../../lib/streak";
import { getCachedPreferences, loadPreferences, subscribePreferences, type Preferences } from "../../lib/preferences";

export function StreakPill() {
  const [streak, setStreak] = useState<Streak>(getCachedStreak());
  const [prefs, setPrefs] = useState<Preferences>(getCachedPreferences());

  useEffect(() => {
    void loadStreak().then(setStreak);
    void loadPreferences().then(setPrefs);
    const u1 = subscribeStreak(setStreak);
    const u2 = subscribePreferences(setPrefs);
    return () => {
      u1();
      u2();
    };
  }, []);

  const today = todaysCount(streak);
  const goal = prefs.dailyGoal;
  const goalMet = today >= goal;

  return (
    <View className="flex-row gap-2 mb-4">
      <View className="flex-1 bg-surface border border-border rounded-xl px-3 py-3">
        <Text className="text-muted text-xs uppercase tracking-wide mb-1">Streak</Text>
        <Text className="text-text text-lg font-semibold">
          🔥 {streak.streak} {streak.streak === 1 ? "day" : "days"}
        </Text>
      </View>
      <View className={`flex-1 border rounded-xl px-3 py-3 ${goalMet ? "bg-success/15 border-success/60" : "bg-surface border-border"}`}>
        <Text className="text-muted text-xs uppercase tracking-wide mb-1">Today</Text>
        <Text className="text-text text-lg font-semibold">
          {today} / {goal} {goalMet ? "✓" : ""}
        </Text>
      </View>
    </View>
  );
}
