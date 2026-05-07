import { ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

type Props = Omit<PressableProps, "onPressIn" | "onPressOut" | "children" | "style"> & {
  children: ReactNode;
  className?: string;
  /** Static style merged with the animated transform. */
  style?: StyleProp<ViewStyle>;
  /** Scale factor when pressed. 1 = no animation. */
  pressedScale?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Drop-in Pressable with a spring-driven scale-down on press.
 */
export function PressableScale({
  children,
  className,
  style,
  pressedScale = 0.97,
  ...rest
}: Props) {
  const sv = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sv.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={() => {
        sv.value = withSpring(pressedScale, { damping: 18, stiffness: 250 });
      }}
      onPressOut={() => {
        sv.value = withSpring(1, { damping: 14, stiffness: 200 });
      }}
      style={[animatedStyle, style]}
      className={className}
    >
      {children}
    </AnimatedPressable>
  );
}
