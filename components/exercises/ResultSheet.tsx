import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import type { GradeResult } from "../../lib/grading";
import { errorHaptic, successHaptic, warningHaptic } from "../../lib/haptics";
import { PrimaryButton } from "../ui/PrimaryButton";

const C = {
  text: "#e6ecf5",
  muted: "#8aa0c2",
  success: "#22c55e",
  warning: "#eab308",
  error: "#f43f5e",
} as const;

type Props = {
  result: GradeResult;
  explanation?: string;
  onNext: () => void;
  canonical?: string;
};

export function ResultSheet({ result, explanation, onNext, canonical }: Props) {
  const seenRef = useRef<GradeResult | null>(null);
  useEffect(() => {
    if (seenRef.current === result) return;
    seenRef.current = result;
    if (result.correct) successHaptic();
    else if (result.reason === "near") warningHaptic();
    else errorHaptic();
  }, [result]);

  const headline = result.correct ? "Correct!" : result.reason === "near" ? "Almost!" : "Not quite.";

  let bgColor: string;
  let borderColor: string;
  let ctaColor: string;
  if (result.correct) {
    bgColor = "#22c55e18"; borderColor = C.success; ctaColor = C.success;
  } else if (result.reason === "near") {
    bgColor = "#eab30818"; borderColor = C.warning; ctaColor = C.warning;
  } else {
    bgColor = "#f43f5e18"; borderColor = C.error; ctaColor = "#3b82f6";
  }

  return (
    <View
      style={{
        marginTop: 24,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor,
        backgroundColor: bgColor,
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
    >
      <Text style={{ color: C.text, fontSize: 17, fontWeight: "700", marginBottom: 8 }}>
        {headline}
      </Text>

      {!result.correct ? (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>
            Expected
          </Text>
          <Text style={{ color: C.text, fontSize: 15 }}>{result.closest}</Text>
        </View>
      ) : canonical ? (
        <Text style={{ color: C.muted, fontSize: 14, marginBottom: 8 }}>{canonical}</Text>
      ) : null}

      {!result.correct && result.diff.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {result.diff.map((p, i) => {
            let color = C.text;
            let textDecorationLine: "none" | "underline" | "line-through" = "none";
            if (p.kind === "missing") { color = C.success; textDecorationLine = "underline"; }
            else if (p.kind === "extra") { color = C.error; textDecorationLine = "line-through"; }
            else if (p.kind === "edit") { color = C.warning; }
            return (
              <Text key={i} style={{ fontSize: 15, color, textDecorationLine }}>{p.text}</Text>
            );
          })}
        </View>
      ) : null}

      {explanation ? (
        <Text style={{ color: C.muted, fontSize: 13, marginBottom: 12, lineHeight: 19 }}>
          {explanation}
        </Text>
      ) : null}

      <View style={{ marginTop: 4 }}>
        <PrimaryButton label="Continue" onPress={onNext} color={ctaColor} />
      </View>
    </View>
  );
}
