import { ReactNode } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

type Props = Omit<PressableProps, "onPressIn" | "onPressOut" | "children" | "style"> & {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({
  children,
  className,
  style,
  pressedScale = 0.98,
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
        sv.value = withSpring(pressedScale, { damping: 40, stiffness: 350 });
      }}
      onPressOut={() => {
        sv.value = withSpring(1, { damping: 36, stiffness: 320 });
      }}
      style={[animatedStyle, style]}
      className={className}
    >
      {children}
    </AnimatedPressable>
  );
}
