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
          <Text className="text-muted text-xs uppercase tracking-wide mb-2">
            Translate {from.toUpperCase()} → {to.toUpperCase()}
          </Text>
          <Text className="text-text text-xl mb-6 leading-7">{source}</Text>
        </>
      }
      answers={answers}
      placeholder="Translation…"
      result={result}
      onSubmit={onSubmit}
    />
  );
}
