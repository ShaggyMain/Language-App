import { ReactNode } from "react";
import { View, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  title?: string;
  children: ReactNode;
  scroll?: boolean;
};

export function Screen({ title, children, scroll = true }: Props) {
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <Body className="flex-1 px-5 pt-4" contentContainerClassName={scroll ? "pb-12" : undefined}>
        {title ? <Text className="text-text text-3xl font-bold mb-4">{title}</Text> : null}
        {children}
      </Body>
    </SafeAreaView>
  );
}
