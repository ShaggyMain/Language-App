import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { grade, type GradeResult } from "../../lib/grading";

const C = {
  surface: "#111a2e",
  surfaceAlt: "#1a2540",
  border: "#1f2a44",
  bg: "#0b1220",
  text: "#e6ecf5",
  muted: "#8aa0c2",
  en: "#3b82f6",
  success: "#22c55e",
  error: "#f43f5e",
} as const;

type Props = {
  prompt?: string;
  tokens: string[];
  answer: string[];
  result?: { correct: boolean; userInput?: string };
  onSubmit: (raw: string, result: GradeResult) => void;
};

export function OrderExercise({ prompt, tokens, answer, result, onSubmit }: Props) {
  const locked = !!result;
  const initial: number[] = result?.userInput ? JSON.parse(result.userInput) : [];
  const [placed, setPlaced] = useState<number[]>(initial);

  function add(idx: number) {
    if (locked || placed.includes(idx)) return;
    setPlaced((p) => [...p, idx]);
  }

  function remove(slot: number) {
    if (locked) return;
    setPlaced((p) => p.filter((_, i) => i !== slot));
  }

  function handle() {
    if (locked || placed.length !== answer.length) return;
    const built = placed.map((i) => tokens[i]).join(" ");
    const r = grade(built, [answer.join(" ")]);
    onSubmit(JSON.stringify(placed), r);
  }

  const ready = !locked && placed.length === answer.length;
  const bankIdxs = tokens.map((_, i) => i).filter((i) => !placed.includes(i));

  const isCorrect = locked
    ? grade(placed.map((i) => tokens[i]).join(" "), [answer.join(" ")]).correct
    : false;

  return (
    <View>
      {prompt ? (
        <Text style={{ color: C.text, fontSize: 16, marginBottom: 16, lineHeight: 24 }}>
          {prompt}
        </Text>
      ) : null}

      <Text style={{ color: C.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
        Your sentence
      </Text>
      <View
        style={{
          minHeight: 60,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: locked ? (isCorrect ? C.success : C.error) : C.border,
          backgroundColor: C.surface,
          paddingHorizontal: 12,
          paddingVertical: 12,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 8,
        }}
      >
        {placed.length === 0 ? (
          <Text style={{ color: C.muted, alignSelf: "center" }}>Tap words below to build a sentence</Text>
        ) : (
          placed.map((tIdx, slot) => {
            const chipBg = locked
              ? isCorrect ? "#22c55e22" : "#f43f5e22"
              : "#3b82f622";
            const chipBorder = locked
              ? isCorrect ? C.success : C.error
              : C.en;
            return (
              <Pressable
                key={`${tIdx}-${slot}`}
                onPress={() => remove(slot)}
                disabled={locked}
                style={{
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: chipBorder,
                  backgroundColor: chipBg,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
              >
                <Text style={{ color: C.text, fontSize: 15 }}>{tokens[tIdx]}</Text>
              </Pressable>
            );
          })
        )}
      </View>

      <Text style={{ color: C.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8, marginTop: 16 }}>
        Word bank
      </Text>
      <View
        style={{
          borderRadius: 12,
          backgroundColor: C.bg,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: 10,
          paddingVertical: 10,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {bankIdxs.length === 0 ? (
          <Text style={{ color: C.muted, paddingHorizontal: 8, paddingVertical: 6 }}>All used.</Text>
        ) : (
          bankIdxs.map((i) => (
            <Pressable
              key={i}
              onPress={() => add(i)}
              disabled={locked}
              style={{
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: C.border,
                backgroundColor: C.surface,
                paddingHorizontal: 12,
                paddingVertical: 7,
              }}
            >
              <Text style={{ color: C.text, fontSize: 15 }}>{tokens[i]}</Text>
            </Pressable>
          ))
        )}
      </View>

      {!locked ? (
        <Pressable
          onPress={handle}
          disabled={!ready}
          style={{
            marginTop: 24,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            backgroundColor: ready ? C.en : C.surface,
            borderWidth: ready ? 0 : 1,
            borderColor: C.border,
          }}
        >
          <Text style={{ color: ready ? "white" : C.muted, fontSize: 16, fontWeight: "700" }}>
            Check
          </Text>
        </Pressable>
      ) : null}

      {locked ? (
        <View
          style={{
            marginTop: 12,
            borderRadius: 12,
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.border,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
            Correct order
          </Text>
          <Text style={{ color: C.text, fontSize: 15 }}>{answer.join(" ")}</Text>
        </View>
      ) : null}
    </View>
  );
}
