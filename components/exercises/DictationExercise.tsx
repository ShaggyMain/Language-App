import { Pressable, Text, View } from "react-native";
import * as Speech from "expo-speech";
import type { GradeResult } from "../../lib/grading";
import { getCachedPreferences } from "../../lib/preferences";
import { TextAnswerExercise } from "./TextAnswerExercise";

const C = {
  en: "#3b82f6",
  muted: "#8aa0c2",
} as const;

type Props = {
  audioText: string;
  audioUrl?: string;
  ttsLanguage?: string;
  answers: string[];
  result?: { correct: boolean; userInput?: string };
  onSubmit: (raw: string, result: GradeResult) => void;
};

export function DictationExercise({ audioText, audioUrl, ttsLanguage, answers, result, onSubmit }: Props) {
  function play() {
    try {
      Speech.stop();
      void audioUrl;
      Speech.speak(audioText, { language: ttsLanguage, rate: getCachedPreferences().ttsRate });
    } catch {
      // expo-speech unavailable on web preview
    }
  }

  return (
    <TextAnswerExercise
      header={
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
            Listen and type
          </Text>
          <Pressable
            onPress={play}
            style={{
              backgroundColor: "#3b82f618",
              borderWidth: 1.5,
              borderColor: "#3b82f655",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 18,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Text style={{ color: C.en, fontSize: 22 }}>▶</Text>
            <Text style={{ color: C.en, fontSize: 16, fontWeight: "700" }}>Play audio</Text>
          </Pressable>
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 8, textAlign: "center" }}>
            Tap to replay anytime
          </Text>
        </View>
      }
      answers={answers}
      placeholder="Type what you hear…"
      result={result}
      onSubmit={onSubmit}
    />
  );
}
