import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  accent?: string;
  icon?: ReactNode;
  onPress?: () => void;
};

export function Card({ title, subtitle, accent, icon, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-surface border border-border rounded-2xl p-5 mb-3 active:opacity-80"
    >
      <View className="flex-row items-center gap-3">
        {accent ? <View className="w-2 h-10 rounded-full" style={{ backgroundColor: accent }} /> : null}
        {icon}
        <View className="flex-1">
          <Text className="text-text text-lg font-semibold">{title}</Text>
          {subtitle ? <Text className="text-muted text-sm mt-1">{subtitle}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}
