import { useEffect } from "react";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** 0..1 — fill progress. */
  progress: number;
  /** Outer diameter, px. */
  size?: number;
  /** Stroke width, px. */
  thickness?: number;
  /** Hex color of the filled arc. Defaults to brand blue. */
  color?: string;
  /** Hex color of the empty track. */
  trackColor?: string;
  /** Optional centered label rendered inside the ring. */
  label?: string;
  /** Override default label color. */
  labelColor?: string;
};

export function ProgressRing({
  progress,
  size = 56,
  thickness = 6,
  color = "#3b82f6",
  trackColor = "#1f2a44",
  label,
  labelColor = "#e6ecf5",
}: Props) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const sv = useSharedValue(0);

  useEffect(() => {
    sv.value = withTiming(Math.max(0, Math.min(1, progress)), {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, sv]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - sv.value),
  }));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={thickness}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          fill="transparent"
          animatedProps={animatedProps}
          // Start at 12 o'clock instead of 3.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {label !== undefined ? (
        <View className="absolute inset-0 items-center justify-center">
          <Text style={{ color: labelColor, fontSize: size * 0.28, fontWeight: "700" }}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
