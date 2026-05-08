import { ReactNode } from "react";
import { Text, View } from "react-native";
import { ProgressRing } from "./ProgressRing";
import { PressableScale } from "./PressableScale";

const C = {
  surface: "#111a2e",
  border: "#1f2a44",
  success: "#22c55e",
  text: "#e6ecf5",
  muted: "#8aa0c2",
  bg: "#0b1220",
} as const;

type Props = {
  title: string;
  subtitle?: string;
  accent?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  progress?: number;
  badge?: string;
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
  const opacity = state === "locked" ? 0.45 : 1;
  const borderColor = state === "passed" ? "#22c55e55" : C.border;

  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      style={{
        backgroundColor: C.surface,
        borderWidth: 1,
        borderColor,
        borderRadius: 16,
        padding: 18,
        marginBottom: 10,
        minHeight: 64,
        opacity,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {accent ? (
          <View style={{ width: 4, height: 44, borderRadius: 2, backgroundColor: accent }} />
        ) : null}
        {icon ? <View style={{ marginRight: 4 }}>{icon}</View> : null}
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontSize: 16, fontWeight: "600", lineHeight: 22 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ color: C.muted, fontSize: 13, marginTop: 3, lineHeight: 18 }}>
              {subtitle}
            </Text>
          ) : null}
          {badge ? (
            <View
              style={{
                alignSelf: "flex-start",
                marginTop: 8,
                backgroundColor: C.bg,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: C.muted, fontSize: 11 }}>{badge}</Text>
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
