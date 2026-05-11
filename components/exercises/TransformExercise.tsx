import { View, Text } from "react-native";
import type { GradeResult } from "../../lib/grading";
import { TextAnswerExercise } from "./TextAnswerExercise";

const C = {
  surface: "#111a2e",
  border: "#1f2a44",
  text: "#e6ecf5",
  muted: "#8aa0c2",
} as const;

type Props = {
  instruction: string;
  source: string;
  answers: string[];
  result?: { correct: boolean; userInput?: string };
  onSubmit: (raw: string, result: GradeResult) => void;
};

export function TransformExercise({ instruction, source, answers, result, onSubmit }: Props) {
  return (
    <TextAnswerExercise
      header={
        <>
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
            {instruction}
          </Text>
          <View
            style={{
              backgroundColor: C.surface,
              borderWidth: 1,
              borderColor: C.border,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 20,
            }}
          >
            <Text style={{ color: C.text, fontSize: 17, lineHeight: 26 }}>{source}</Text>
          </View>
        </>
      }
      answers={answers}
      placeholder="Rewritten sentence…"
      result={result}
      onSubmit={onSubmit}
    />
  );
}
