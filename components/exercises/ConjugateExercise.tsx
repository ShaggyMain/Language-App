import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { grade, type GradeResult } from "../../lib/grading";

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
      diff:
        wrongIdx >= 0
          ? perRow[wrongIdx].diff
          : [{ text: closest, kind: "same" }],
      reason: allCorrect ? "exact" : avgScore >= 0.7 ? "near" : "wrong",
    };
    onSubmit(JSON.stringify(values), composite);
  }

  const ready = !locked && values.every((v) => v.trim().length > 0);

  return (
    <View>
      <Text className="text-muted text-xs uppercase tracking-wide mb-2">{tense}</Text>
      <Text className="text-text text-xl mb-5">{verb}</Text>
      <View className="gap-3">
        {persons.map((p, i) => {
          let bg = "bg-surface border-border";
          if (locked) {
            const ok = grade(values[i] ?? "", [p.answer]).correct;
            bg = ok ? "bg-success/15 border-success/60" : "bg-error/15 border-error/60";
          }
          return (
            <View key={p.person} className={`flex-row items-center gap-3 rounded-xl border px-3 py-2 ${bg}`}>
              <Text className="text-muted w-20">{p.person}</Text>
              <TextInput
                className="flex-1 text-text text-base px-2 py-2"
                value={values[i]}
                onChangeText={(v) => setAt(i, v)}
                editable={!locked}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="…"
                placeholderTextColor="#8aa0c2"
              />
              {locked ? (
                <Text className="text-muted text-xs">{p.answer}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
      {!locked ? (
        <Pressable
          onPress={handle}
          disabled={!ready}
          className={`mt-5 rounded-xl px-4 py-4 items-center ${ready ? "bg-en" : "bg-surface border border-border"}`}
        >
          <Text className={`${ready ? "text-white" : "text-muted"} text-base font-semibold`}>
            Check
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
