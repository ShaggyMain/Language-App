import { Text, View } from "react-native";
import type { Exercise } from "../../lib/types";
import { McqExercise } from "./McqExercise";
import { FillExercise } from "./FillExercise";

type Props = {
  exercise: Exercise;
  /** True after submission — locks input and feeds back result coloring. */
  locked: boolean;
  /** What the user picked / typed (for re-render after submit). */
  userInput?: string;
  pickedIndex?: number;
  resultCorrect?: boolean;
  onSubmit: (raw: string, pickedIndex?: number) => void;
};

export function ExerciseRenderer({
  exercise,
  locked,
  userInput,
  pickedIndex,
  resultCorrect,
  onSubmit,
}: Props) {
  if (exercise.type === "mcq") {
    return (
      <McqExercise
        prompt={exercise.prompt}
        options={exercise.options}
        answer={exercise.answer}
        result={locked ? { correct: !!resultCorrect, pickedIndex } : undefined}
        onSubmit={(idx, raw) => onSubmit(raw, idx)}
      />
    );
  }
  if (exercise.type === "fill") {
    return (
      <FillExercise
        prompt={exercise.prompt}
        hint={exercise.hint}
        result={locked ? { correct: !!resultCorrect, userInput } : undefined}
        onSubmit={(raw) => onSubmit(raw)}
      />
    );
  }
  return (
    <View>
      <Text className="text-muted">
        Exercise type "{exercise.type}" is not yet supported in the UI. Coming soon!
      </Text>
    </View>
  );
}
