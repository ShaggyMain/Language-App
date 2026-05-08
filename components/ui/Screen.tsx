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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b1220" }} edges={["top"]}>
      <Body
        style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}
        contentContainerStyle={scroll ? { paddingBottom: 48 } : undefined}
      >
        {title ? (
          <Text style={{ color: "#e6ecf5", fontSize: 28, fontWeight: "700", marginBottom: 16 }}>
            {title}
          </Text>
        ) : null}
        {children}
      </Body>
    </SafeAreaView>
  );
}
