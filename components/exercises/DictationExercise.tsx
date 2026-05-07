import { Pressable, Text, View } from "react-native";
import * as Speech from "expo-speech";
import type { GradeResult } from "../../lib/grading";
import { TextAnswerExercise } from "./TextAnswerExercise";

type Props = {
  audioText: string;
  /** BCP-47 language tag for the TTS voice ("en-US", "de-DE", "es-ES"). */
  ttsLanguage?: string;
  answers: string[];
  result?: { correct: boolean; userInput?: string };
  onSubmit: (raw: string, result: GradeResult) => void;
};

export function DictationExercise({ audioText, ttsLanguage, answers, result, onSubmit }: Props) {
  function play() {
    try {
      Speech.stop();
      Speech.speak(audioText, { language: ttsLanguage, rate: 0.9 });
    } catch {
      // expo-speech is unavailable on web preview; degrade gracefully
    }
  }

  return (
    <TextAnswerExercise
      header={
        <View className="mb-6">
          <Text className="text-muted text-xs uppercase tracking-wide mb-3">Listen and type</Text>
          <Pressable
            onPress={play}
            className="bg-en/20 border border-en rounded-xl px-4 py-5 items-center flex-row justify-center gap-2"
          >
            <Text className="text-en text-2xl">▶</Text>
            <Text className="text-en text-base font-semibold">Play audio</Text>
          </Pressable>
          <Text className="text-muted text-xs mt-2 text-center">Tap to replay anytime</Text>
        </View>
      }
      answers={answers}
      placeholder="Type what you hear…"
      result={result}
      onSubmit={onSubmit}
    />
  );
}
