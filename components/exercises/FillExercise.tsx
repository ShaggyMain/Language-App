import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { grade, type GradeResult } from "../../lib/grading";
import { PrimaryButton } from "../ui/PrimaryButton";

const C = {
  surface: "#111a2e",
  border: "#1f2a44",
  text: "#e6ecf5",
  muted: "#8aa0c2",
  success: "#22c55e",
  error: "#f43f5e",
} as const;

type Props = {
  prompt: string;
  answers: string[];
  hint?: string;
  result?: { correct: boolean; userInput?: string };
  onSubmit: (raw: string, result: GradeResult) => void;
};

export function FillExercise({ prompt, answers, hint, result, onSubmit }: Props) {
  const [value, setValue] = useState(result?.userInput ?? "");
  const locked = !!result;

  function handle() {
    if (locked) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed, grade(trimmed, answers));
  }

  let inputBgColor = C.surface;
  let inputBorderColor = C.border;
  if (locked) {
    if (result.correct) { inputBgColor = "#22c55e22"; inputBorderColor = C.success; }
    else { inputBgColor = "#f43f5e22"; inputBorderColor = C.error; }
  }

  return (
    <View>
      <Text style={{ color: C.text, fontSize: 19, marginBottom: 24, lineHeight: 28 }}>
        {prompt}
      </Text>
      {hint ? (
        <Text style={{ color: C.muted, fontSize: 13, marginBottom: 12 }}>{hint}</Text>
      ) : null}
      <TextInput
        style={{
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: inputBorderColor,
          backgroundColor: inputBgColor,
          paddingHorizontal: 16,
          paddingVertical: 14,
          color: C.text,
          fontSize: 16,
        }}
        value={value}
        onChangeText={setValue}
        editable={!locked}
        placeholder="Type your answer…"
        placeholderTextColor={C.muted}
        autoCapitalize="none"
        autoCorrect={false}
        onSubmitEditing={handle}
        returnKeyType="done"
      />
      {!locked ? (
        <View style={{ marginTop: 24 }}>
          <PrimaryButton label="Check" onPress={handle} disabled={!value.trim()} />
        </View>
      ) : null}
    </View>
  );
}
