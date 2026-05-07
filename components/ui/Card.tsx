import { ReactNode } from "react";
import { Text, View } from "react-native";
import { ProgressRing } from "./ProgressRing";
import { PressableScale } from "./PressableScale";

type Props = {
  title: string;
  subtitle?: string;
  /** Hex color for the left accent stripe. */
  accent?: string;
  /** Optional leading icon node (lucide icon, emoji, etc). */
  icon?: ReactNode;
  /** Optional trailing decoration. */
  trailing?: ReactNode;
  /** Mastery progress 0..1; renders a ring on the right. */
  progress?: number;
  /** Small badge rendered under the title (e.g. "A1 · 8 exercises"). */
  badge?: string;
  /** Visual state — affects opacity/border. */
  state?: "active" | "locked" | "passed";
  onPress?: () => void;
};

export function Card({
  title,
  subtitle,
  accent,
  icon,
  trailing,
  progress,
  badge,
  state = "active",
  onPress,
}: Props) {
  const opacity = state === "locked" ? "opacity-50" : "";
  const borderTone = state === "passed" ? "border-success/40" : "border-border";

  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      className={`bg-surface border ${borderTone} rounded-2xl p-5 mb-3 min-h-[64px] ${opacity}`}
    >
      <View className="flex-row items-center gap-3">
        {accent ? (
          <View className="w-1.5 h-12 rounded-full" style={{ backgroundColor: accent }} />
        ) : null}
        {icon ? <View className="mr-1">{icon}</View> : null}
        <View className="flex-1">
          <Text className="text-text text-lg font-semibold">{title}</Text>
          {subtitle ? <Text className="text-muted text-sm mt-1">{subtitle}</Text> : null}
          {badge ? (
            <View className="self-start mt-2 bg-bg border border-border rounded-md px-2 py-0.5">
              <Text className="text-muted text-xs">{badge}</Text>
            </View>
          ) : null}
        </View>
        {progress !== undefined ? (
          <ProgressRing
            progress={progress}
            size={44}
            thickness={4}
            color={accent ?? "#3b82f6"}
            label={`${Math.round(progress * 100)}`}
          />
        ) : null}
        {trailing}
      </View>
    </PressableScale>
  );
}
