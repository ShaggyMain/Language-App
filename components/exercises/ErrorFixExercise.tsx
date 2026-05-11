import { View, Text } from "react-native";
import type { GradeResult } from "../../lib/grading";
import { TextAnswerExercise } from "./TextAnswerExercise";

const C = {
  text: "#e6ecf5",
  muted: "#8aa0c2",
  error: "#f43f5e",
} as const;

type Props = {
  sentence: string;
  answers: string[];
  result?: { correct: boolean; userInput?: string };
  onSubmit: (raw: string, result: GradeResult) => void;
};

export function ErrorFixExercise({ sentence, answers, result, onSubmit }: Props) {
  return (
    <TextAnswerExercise
      header={
        <>
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
            Find and fix the error
          </Text>
          <View
            style={{
              backgroundColor: "#f43f5e14",
              borderWidth: 1,
              borderColor: "#f43f5e55",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              marginBottom: 20,
            }}
          >
            <Text style={{ color: C.text, fontSize: 17, lineHeight: 26, fontStyle: "italic" }}>{sentence}</Text>
          </View>
        </>
      }
      answers={answers}
      placeholder="Corrected sentence…"
      result={result}
      onSubmit={onSubmit}
    />
  );
}
