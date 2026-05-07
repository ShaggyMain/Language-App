import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { grade, type GradeResult } from "../../lib/grading";

type Props = {
  prompt?: string;
  tokens: string[];
  answer: string[];
  result?: { correct: boolean; userInput?: string };
  onSubmit: (raw: string, result: GradeResult) => void;
};

/**
 * Tap-based sentence builder. Tokens are pulled from a "bank" pool by
 * tapping them, and tapped again in the sentence area to send back to
 * the bank. We deliberately use tap rather than drag-and-drop: it's
 * faster, more accessible, and significantly more reliable on mobile
 * than gesture-based reordering.
 */
export function OrderExercise({ prompt, tokens, answer, result, onSubmit }: Props) {
  const locked = !!result;
  const initial: number[] = result?.userInput ? JSON.parse(result.userInput) : [];
  const [placed, setPlaced] = useState<number[]>(initial);

  function add(idx: number) {
    if (locked) return;
    if (placed.includes(idx)) return;
    setPlaced((p) => [...p, idx]);
  }

  function remove(slot: number) {
    if (locked) return;
    setPlaced((p) => p.filter((_, i) => i !== slot));
  }

  function handle() {
    if (locked) return;
    if (placed.length !== answer.length) return;
    const built = placed.map((i) => tokens[i]).join(" ");
    const target = answer.join(" ");
    const r = grade(built, [target]);
    onSubmit(JSON.stringify(placed), r);
  }

  const ready = !locked && placed.length === answer.length;
  const bankIdxs = tokens.map((_, i) => i).filter((i) => !placed.includes(i));

  return (
    <View>
      {prompt ? <Text className="text-text text-lg mb-4">{prompt}</Text> : null}

      <Text className="text-muted text-xs uppercase tracking-wide mb-2">Your sentence</Text>
      <View className="min-h-16 rounded-xl border border-border bg-surface px-3 py-3 flex-row flex-wrap gap-2 mb-2">
        {placed.length === 0 ? (
          <Text className="text-muted self-center">Tap words below to build a sentence</Text>
        ) : (
          placed.map((tIdx, slot) => {
            let bg = "bg-en/20 border-en";
            if (locked) {
              const built = placed.map((i) => tokens[i]).join(" ");
              const ok = grade(built, [answer.join(" ")]).correct;
              bg = ok ? "bg-success/20 border-success" : "bg-error/20 border-error";
            }
            return (
              <Pressable
                key={`${tIdx}-${slot}`}
                onPress={() => remove(slot)}
                disabled={locked}
                className={`rounded-lg border px-3 py-2 ${bg}`}
              >
                <Text className="text-text">{tokens[tIdx]}</Text>
              </Pressable>
            );
          })
        )}
      </View>

      <Text className="text-muted text-xs uppercase tracking-wide mb-2 mt-4">Word bank</Text>
      <View className="rounded-xl bg-bg px-1 py-1 flex-row flex-wrap gap-2">
        {bankIdxs.length === 0 ? (
          <Text className="text-muted px-3 py-2">All used.</Text>
        ) : (
          bankIdxs.map((i) => (
            <Pressable
              key={i}
              onPress={() => add(i)}
              disabled={locked}
              className="rounded-lg border border-border bg-surface px-3 py-2"
            >
              <Text className="text-text">{tokens[i]}</Text>
            </Pressable>
          ))
        )}
      </View>

      {!locked ? (
        <Pressable
          onPress={handle}
          disabled={!ready}
          className={`mt-6 rounded-xl px-4 py-4 items-center ${ready ? "bg-en" : "bg-surface border border-border"}`}
        >
          <Text className={`${ready ? "text-white" : "text-muted"} text-base font-semibold`}>
            Check
          </Text>
        </Pressable>
      ) : null}

      {locked ? (
        <View className="mt-3 rounded-xl bg-surface border border-border px-3 py-2">
          <Text className="text-muted text-xs uppercase mb-1">Correct order</Text>
          <Text className="text-text">{answer.join(" ")}</Text>
        </View>
      ) : null}
    </View>
  );
}
