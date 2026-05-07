import { Pressable, Text, View } from "react-native";
import type { GradeResult } from "../../lib/grading";

type Props = {
  result: GradeResult;
  explanation?: string;
  onNext: () => void;
  /** Optional canonical answer to show even on success. */
  canonical?: string;
};

export function ResultSheet({ result, explanation, onNext, canonical }: Props) {
  const headline = result.correct
    ? "Correct!"
    : result.reason === "near"
      ? "Almost!"
      : "Not quite.";
  const tone = result.correct
    ? "bg-success/15 border-success"
    : result.reason === "near"
      ? "bg-warning/15 border-warning"
      : "bg-error/15 border-error";

  return (
    <View className={`mt-6 rounded-2xl border px-4 py-4 ${tone}`}>
      <Text className="text-text text-lg font-semibold mb-2">{headline}</Text>
      {!result.correct ? (
        <View className="mb-2">
          <Text className="text-muted text-xs uppercase tracking-wide">Expected</Text>
          <Text className="text-text text-base">{result.closest}</Text>
        </View>
      ) : canonical ? (
        <Text className="text-muted text-sm mb-2">{canonical}</Text>
      ) : null}
      {!result.correct && result.diff.length > 0 ? (
        <View className="flex-row flex-wrap gap-1 mb-2">
          {result.diff.map((p, i) => {
            const c =
              p.kind === "same"
                ? "text-text"
                : p.kind === "missing"
                  ? "text-success underline"
                  : p.kind === "extra"
                    ? "text-error line-through"
                    : "text-warning";
            return (
              <Text key={i} className={`text-base ${c}`}>
                {p.text}
              </Text>
            );
          })}
        </View>
      ) : null}
      {explanation ? <Text className="text-muted text-sm mb-3">{explanation}</Text> : null}
      <Pressable onPress={onNext} className="bg-en rounded-xl py-3 items-center">
        <Text className="text-white text-base font-semibold">Continue</Text>
      </Pressable>
    </View>
  );
}
