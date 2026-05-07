import { ReactNode } from "react";
import { Text, View } from "react-native";
import { PressableScale } from "./PressableScale";

type Props = {
  label: string;
  onPress?: () => void;
  /** Hex color of the button background. Defaults to brand blue. */
  color?: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** When true, fills available width. Default true. */
  fullWidth?: boolean;
};

/**
 * Big primary CTA: chunky, rounded, with a coloured glow underneath
 * driven by `shadowColor` (iOS) + matching dark surface (Android — RN
 * doesn't render coloured shadows on Android pre-API 28). The glow is
 * the visual cue we picked up from the screenshot — see how the
 * "Start Test" button has a soft halo around it.
 */
export function PrimaryButton({
  label,
  onPress,
  color = "#3b82f6",
  icon,
  disabled = false,
  fullWidth = true,
}: Props) {
  const opacity = disabled ? 0.5 : 1;
  return (
    <View
      className={fullWidth ? "w-full" : "self-center"}
      style={{
        shadowColor: color,
        shadowOpacity: 0.45,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 },
        elevation: 12,
      }}
    >
      <PressableScale
        onPress={onPress}
        disabled={disabled}
        className="rounded-2xl px-6 py-5 items-center justify-center min-h-[60px]"
        style={{ backgroundColor: color, opacity }}
      >
        <View className="flex-row items-center gap-3">
          {icon}
          <Text className="text-white text-lg font-bold">{label}</Text>
        </View>
      </PressableScale>
    </View>
  );
}
