import { ReactNode } from "react";
import { Pressable, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

type Props = Omit<PressableProps, "onPressIn" | "onPressOut" | "children" | "style"> & {
  children: ReactNode;
  className?: string;
  /** Scale factor when pressed. 1 = no animation. */
  pressedScale?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Drop-in Pressable with a spring-driven scale-down on press. Use anywhere
 * a Pressable would feel "dead" — cards, primary buttons, etc.
 */
export function PressableScale({ children, className, pressedScale = 0.97, ...rest }: Props) {
  const sv = useSharedValue(1);

  const style = useAnimatedStyle(() => ({
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
      style={style}
      className={className}
    >
      {children}
    </AnimatedPressable>
  );
}
