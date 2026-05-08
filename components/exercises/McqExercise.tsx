import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { GradeResult } from "../../lib/grading";
import { tapHaptic } from "../../lib/haptics";

const C = {
  surface: "#111a2e",
  border: "#1f2a44",
  text: "#e6ecf5",
  en: "#3b82f6",
  success: "#22c55e",
  error: "#f43f5e",
} as const;

type Props = {
  prompt: string;
  options: string[];
  answer: number;
  result?: { correct: boolean; pickedIndex?: number };
  onSubmit: (raw: string, result: GradeResult) => void;
};

export function McqExercise({ prompt, options, answer, result, onSubmit }: Props) {
  const [picked, setPicked] = useState<number | null>(result?.pickedIndex ?? null);
  const locked = !!result;

  function handlePress(idx: number) {
    if (locked) return;
    tapHaptic();
    setPicked(idx);
    const correct = idx === answer;
    const raw = options[idx];
    onSubmit(raw, {
      correct,
      score: correct ? 1 : 0,
      closest: options[answer],
      diff: [{ text: raw, kind: correct ? "same" : "extra" }],
      reason: correct ? "exact" : "wrong",
    });
  }

  return (
    <View>
      <Text style={{ color: C.text, fontSize: 19, marginBottom: 24, lineHeight: 28 }}>
        {prompt}
      </Text>
      <View style={{ gap: 10 }}>
        {options.map((opt, idx) => {
          const selected = picked === idx;
          let bgColor = C.surface;
          let borderColor = C.border;
          if (locked) {
            if (idx === answer) { bgColor = "#22c55e22"; borderColor = C.success; }
            else if (selected) { bgColor = "#f43f5e22"; borderColor = C.error; }
          } else if (selected) {
            bgColor = "#3b82f622"; borderColor = C.en;
          }
          return (
            <Pressable
              key={idx}
              onPress={() => handlePress(idx)}
              disabled={locked}
              style={{
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor,
                backgroundColor: bgColor,
                paddingHorizontal: 16,
                paddingVertical: 16,
              }}
            >
              <Text style={{ color: C.text, fontSize: 16 }}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
