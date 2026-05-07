import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { GradeResult } from "../../lib/grading";

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
      <Text className="text-text text-xl mb-6 leading-7">{prompt}</Text>
      <View className="gap-3">
        {options.map((opt, idx) => {
          const selected = picked === idx;
          let bg = "bg-surface border-border";
          if (locked) {
            if (idx === answer) bg = "bg-success/20 border-success";
            else if (selected) bg = "bg-error/20 border-error";
          } else if (selected) {
            bg = "bg-en/20 border-en";
          }
          return (
            <Pressable
              key={idx}
              onPress={() => handlePress(idx)}
              disabled={locked}
              className={`rounded-xl border px-4 py-4 ${bg}`}
            >
              <Text className="text-text text-base">{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
