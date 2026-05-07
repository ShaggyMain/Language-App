import { Text, View } from "react-native";
import type { GradeResult } from "../../lib/grading";
import { TextAnswerExercise } from "./TextAnswerExercise";

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
          <Text className="text-muted text-xs uppercase tracking-wide mb-2">Find and fix the error</Text>
          <View className="bg-error/10 border border-error/40 rounded-xl px-4 py-3 mb-6">
            <Text className="text-text text-lg italic">{sentence}</Text>
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
