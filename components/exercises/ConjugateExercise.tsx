import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { grade, type GradeResult } from "../../lib/grading";

const C = {
  surface: "#111a2e",
  border: "#1f2a44",
  text: "#e6ecf5",
  muted: "#8aa0c2",
  en: "#3b82f6",
  success: "#22c55e",
  error: "#f43f5e",
} as const;

type Person = { person: string; answer: string };

type Props = {
  verb: string;
  tense: string;
  persons: Person[];
  result?: { correct: boolean; userInput?: string };
  onSubmit: (raw: string, result: GradeResult) => void;
};

export function ConjugateExercise({ verb, tense, persons, result, onSubmit }: Props) {
  const initial: string[] = result?.userInput
    ? (JSON.parse(result.userInput) as string[])
    : persons.map(() => "");
  const [values, setValues] = useState<string[]>(initial);
  const locked = !!result;

  function setAt(i: number, v: string) {
    setValues((arr) => arr.map((x, j) => (j === i ? v : x)));
  }

  function handle() {
    if (locked) return;
    if (values.some((v) => !v.trim())) return;
    const perRow: GradeResult[] = persons.map((p, i) => grade(values[i], [p.answer]));
    const allCorrect = perRow.every((r) => r.correct);
    const avgScore = perRow.reduce((s, r) => s + r.score, 0) / perRow.length;
    const wrongIdx = perRow.findIndex((r) => !r.correct);
    const closest = persons.map((p) => p.answer).join(" / ");
    const composite: GradeResult = {
      correct: allCorrect,
      score: avgScore,
      closest,
      diff: wrongIdx >= 0 ? perRow[wrongIdx].diff : [{ text: closest, kind: "same" }],
      reason: allCorrect ? "exact" : avgScore >= 0.7 ? "near" : "wrong",
    };
    onSubmit(JSON.stringify(values), composite);
  }

  const ready = !locked && values.every((v) => v.trim().length > 0);

  return (
    <View>
      <Text style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        {tense}
      </Text>
      <Text style={{ color: C.text, fontSize: 19, marginBottom: 20 }}>{verb}</Text>
      <View style={{ gap: 10 }}>
        {persons.map((p, i) => {
          let bgColor = C.surface;
          let borderColor = C.border;
          if (locked) {
            const ok = grade(values[i] ?? "", [p.answer]).correct;
            if (ok) { bgColor = "#22c55e18"; borderColor = C.success; }
            else { bgColor = "#f43f5e18"; borderColor = C.error; }
          }
          return (
            <View
              key={p.person}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor,
                backgroundColor: bgColor,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: C.muted, width: 80, fontSize: 14 }}>{p.person}</Text>
              <TextInput
                style={{ flex: 1, color: C.text, fontSize: 15, paddingVertical: 4 }}
                value={values[i]}
                onChangeText={(v) => setAt(i, v)}
                editable={!locked}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="…"
                placeholderTextColor={C.muted}
              />
              {locked ? (
                <Text style={{ color: C.muted, fontSize: 12 }}>{p.answer}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
      {!locked ? (
        <Pressable
          onPress={handle}
          disabled={!ready}
          style={{
            marginTop: 20,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            backgroundColor: ready ? C.en : C.surface,
            borderWidth: ready ? 0 : 1,
            borderColor: C.border,
          }}
        >
          <Text style={{ color: ready ? "white" : C.muted, fontSize: 16, fontWeight: "600" }}>
            Check
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
