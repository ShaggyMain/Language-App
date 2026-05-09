import { Text } from "react-native";
import type { GradeResult } from "../../lib/grading";
import { TextAnswerExercise } from "./TextAnswerExercise";

type Props = {
  from: string;
  to: string;
  source: string;
  answers: string[];
  result?: { correct: boolean; userInput?: string };
  onSubmit: (raw: string, result: GradeResult) => void;
};

export function TranslateExercise({ from, to, source, answers, result, onSubmit }: Props) {
  return (
    <TextAnswerExercise
      header={
        <>
          <Text style={{ color: "#8aa0c2", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            Translate {from.toUpperCase()} → {to.toUpperCase()}
          </Text>
          <Text style={{ color: "#e6ecf5", fontSize: 19, lineHeight: 28, marginBottom: 24 }}>{source}</Text>
        </>
      }
      answers={answers}
      placeholder="Translation…"
      result={result}
      onSubmit={onSubmit}
    />
  );
}
