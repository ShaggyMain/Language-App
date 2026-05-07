import { Text, View } from "react-native";
import type { Exercise, Language } from "../../lib/types";
import type { GradeResult } from "../../lib/grading";
import { McqExercise } from "./McqExercise";
import { FillExercise } from "./FillExercise";
import { TranslateExercise } from "./TranslateExercise";
import { TransformExercise } from "./TransformExercise";
import { ErrorFixExercise } from "./ErrorFixExercise";
import { DictationExercise } from "./DictationExercise";
import { ConjugateExercise } from "./ConjugateExercise";
import { MatchExercise } from "./MatchExercise";
import { OrderExercise } from "./OrderExercise";

const TTS_LANG: Record<Language, string> = {
  en: "en-US",
  de: "de-DE",
  es: "es-ES",
};

type Props = {
  exercise: Exercise;
  /** BCP-47 language tag — used by DictationExercise for TTS voice. */
  language: Language;
  /** True after submission — locks input and shows feedback. */
  locked: boolean;
  userInput?: string;
  pickedIndex?: number;
  resultCorrect?: boolean;
  onSubmit: (raw: string, result: GradeResult) => void;
};

export function ExerciseRenderer({
  exercise,
  language,
  locked,
  userInput,
  pickedIndex,
  resultCorrect,
  onSubmit,
}: Props) {
  const submitted = locked
    ? { correct: !!resultCorrect, userInput, pickedIndex }
    : undefined;

  switch (exercise.type) {
    case "mcq":
      return (
        <McqExercise
          prompt={exercise.prompt}
          options={exercise.options}
          answer={exercise.answer}
          result={submitted ? { correct: submitted.correct, pickedIndex: submitted.pickedIndex } : undefined}
          onSubmit={onSubmit}
        />
      );
    case "fill":
      return (
        <FillExercise
          prompt={exercise.prompt}
          answers={exercise.answers}
          hint={exercise.hint}
          result={submitted ? { correct: submitted.correct, userInput: submitted.userInput } : undefined}
          onSubmit={onSubmit}
        />
      );
    case "translate":
      return (
        <TranslateExercise
          from={exercise.from}
          to={exercise.to}
          source={exercise.source}
          answers={exercise.answers}
          result={submitted ? { correct: submitted.correct, userInput: submitted.userInput } : undefined}
          onSubmit={onSubmit}
        />
      );
    case "transform":
      return (
        <TransformExercise
          instruction={exercise.instruction}
          source={exercise.source}
          answers={exercise.answers}
          result={submitted ? { correct: submitted.correct, userInput: submitted.userInput } : undefined}
          onSubmit={onSubmit}
        />
      );
    case "errorFix":
      return (
        <ErrorFixExercise
          sentence={exercise.sentence}
          answers={exercise.answers}
          result={submitted ? { correct: submitted.correct, userInput: submitted.userInput } : undefined}
          onSubmit={onSubmit}
        />
      );
    case "dictation":
      return (
        <DictationExercise
          audioText={exercise.audioText}
          ttsLanguage={TTS_LANG[language]}
          answers={exercise.answers}
          result={submitted ? { correct: submitted.correct, userInput: submitted.userInput } : undefined}
          onSubmit={onSubmit}
        />
      );
    case "conjugate":
      return (
        <ConjugateExercise
          verb={exercise.verb}
          tense={exercise.tense}
          persons={exercise.persons}
          result={submitted ? { correct: submitted.correct, userInput: submitted.userInput } : undefined}
          onSubmit={onSubmit}
        />
      );
    case "match":
      return (
        <MatchExercise
          pairs={exercise.pairs}
          result={submitted ? { correct: submitted.correct, userInput: submitted.userInput } : undefined}
          onSubmit={onSubmit}
        />
      );
    case "order":
      return (
        <OrderExercise
          prompt={exercise.prompt}
          tokens={exercise.tokens}
          answer={exercise.answer}
          result={submitted ? { correct: submitted.correct, userInput: submitted.userInput } : undefined}
          onSubmit={onSubmit}
        />
      );
    default:
      return (
        <View>
          <Text className="text-muted">Unsupported exercise type.</Text>
        </View>
      );
  }
}
