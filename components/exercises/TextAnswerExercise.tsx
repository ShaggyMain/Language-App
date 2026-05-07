import { ReactNode, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { grade, type GradeResult } from "../../lib/grading";
import { useTheme } from "../../lib/theme";

type Props = {
  /** Header rendered above the input (instruction, source sentence, audio button, etc.). */
  header: ReactNode;
  answers: string[];
  hint?: string;
  placeholder?: string;
  result?: { correct: boolean; userInput?: string };
  onSubmit: (raw: string, result: GradeResult) => void;
  multiline?: boolean;
};

export function TextAnswerExercise({
  header,
  answers,
  hint,
  placeholder,
  result,
  onSubmit,
  multiline,
}: Props) {
  const [value, setValue] = useState(result?.userInput ?? "");
  const locked = !!result;
  const { colors } = useTheme();

  function handle() {
    if (locked) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed, grade(trimmed, answers));
  }

  let inputBg = "bg-surface border-border";
  if (locked) {
    inputBg = result.correct ? "bg-success/20 border-success" : "bg-error/20 border-error";
  }

  return (
    <View>
      {header}
      {hint ? <Text className="text-muted text-sm mb-3">{hint}</Text> : null}
      <TextInput
        className={`rounded-xl border px-4 py-3 text-text text-base ${inputBg}`}
        value={value}
        onChangeText={setValue}
        editable={!locked}
        placeholder={placeholder ?? "Type your answer…"}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={multiline}
        onSubmitEditing={handle}
        returnKeyType="done"
      />
      {!locked ? (
        <Pressable
          onPress={handle}
          disabled={!value.trim()}
          className={`mt-5 rounded-xl px-4 py-4 items-center ${value.trim() ? "bg-en" : "bg-surface border border-border"}`}
        >
          <Text className={`${value.trim() ? "text-white" : "text-muted"} text-base font-semibold`}>
            Check
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
