import { useEffect } from "react";
import { View, type ViewProps } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type Props = ViewProps & {
  /** Tailwind className for sizing/rounding (e.g. "h-12 w-full rounded-xl"). */
  className?: string;
};

/**
 * Shimmer-like skeleton block for loading states. Uses opacity pulsing
 * (1.0 → 0.5) which is cheap and works in any RN renderer. For a real
 * left-to-right shimmer we'd need MaskedView + a moving gradient,
 * which is overkill for a couple of placeholders.
 */
export function Skeleton({ className, style, ...rest }: Props) {
  const sv = useSharedValue(1);
  useEffect(() => {
    sv.value = withRepeat(
      withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [sv]);

  const animated = useAnimatedStyle(() => ({ opacity: sv.value }));

  return (
    <Animated.View
      {...rest}
      style={[animated, style]}
      className={`bg-surface ${className ?? ""}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <View className="bg-surface border border-border rounded-2xl p-5 mb-3">
      <View className="flex-row items-center gap-3">
        <Skeleton className="w-2 h-10 rounded-full" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </View>
        <Skeleton className="w-12 h-12 rounded-full" />
      </View>
    </View>
  );
}
