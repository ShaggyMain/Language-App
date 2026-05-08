import { ReactNode } from "react";
import { Text, View } from "react-native";
import { PressableScale } from "./PressableScale";

type Props = {
  label: string;
  onPress?: () => void;
  color?: string;
  icon?: ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  color = "#3b82f6",
  icon,
  disabled = false,
  fullWidth = true,
}: Props) {
  return (
    <View
      style={{
        ...(fullWidth ? { width: "100%" } : { alignSelf: "center" }),
        shadowColor: color,
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 5 },
        elevation: 10,
      }}
    >
      <PressableScale
        onPress={onPress}
        disabled={disabled}
        style={{
          backgroundColor: color,
          opacity: disabled ? 0.5 : 1,
          borderRadius: 16,
          paddingHorizontal: 24,
          paddingVertical: 18,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 60,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {icon}
          <Text style={{ color: "white", fontSize: 17, fontWeight: "700" }}>{label}</Text>
        </View>
      </PressableScale>
    </View>
  );
}
