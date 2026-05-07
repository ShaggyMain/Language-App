import { Text, View } from "react-native";
import type { GradeResult } from "../../lib/grading";
import { TextAnswerExercise } from "./TextAnswerExercise";

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
          <Text className="text-muted text-xs uppercase tracking-wide mb-2">{instruction}</Text>
          <View className="bg-surface border border-border rounded-xl px-4 py-3 mb-6">
            <Text className="text-text text-lg">{source}</Text>
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
