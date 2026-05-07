import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { grade, type GradeResult } from "../../lib/grading";

type Pair = { left: string; right: string };

type Props = {
  pairs: Pair[];
  result?: { correct: boolean; userInput?: string };
  onSubmit: (raw: string, result: GradeResult) => void;
};

function shuffleSeeded<T>(arr: T[], seedKey: string): T[] {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedKey.length; i++) {
    h ^= seedKey.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    h = (h + 0x6d2b79f5) >>> 0;
    const r = (h ^ (h >>> 15)) >>> 0;
    const j = r % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function MatchExercise({ pairs, result, onSubmit }: Props) {
  const locked = !!result;
  const seed = pairs.map((p) => p.left).join("|");
  const shuffledRights = useMemo(() => shuffleSeeded(pairs.map((p) => p.right), seed), [seed, pairs]);

  const initial: Record<number, number> = result?.userInput ? JSON.parse(result.userInput) : {};
  const [userPairs, setUserPairs] = useState<Record<number, number>>(initial);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);

  function pickLeft(idx: number) {
    if (locked) return;
    setSelectedLeft(idx === selectedLeft ? null : idx);
  }

  function pickRight(rIdx: number) {
    if (locked) return;
    if (selectedLeft === null) return;
    setUserPairs((m) => {
      const next = { ...m };
      // remove any existing leftIdx pointing to this right
      for (const k of Object.keys(next)) if (next[+k] === rIdx) delete next[+k];
      next[selectedLeft] = rIdx;
      return next;
    });
    setSelectedLeft(null);
  }

  const allPaired = pairs.every((_, i) => userPairs[i] !== undefined);

  function handle() {
    if (!allPaired) return;
    let correctCount = 0;
    pairs.forEach((p, lIdx) => {
      const userRight = shuffledRights[userPairs[lIdx]];
      if (grade(userRight, [p.right]).correct) correctCount++;
    });
    const score = correctCount / pairs.length;
    const composite: GradeResult = {
      correct: correctCount === pairs.length,
      score,
      closest: pairs.map((p) => `${p.left} → ${p.right}`).join("; "),
      diff: [],
      reason: correctCount === pairs.length ? "exact" : score >= 0.7 ? "near" : "wrong",
    };
    onSubmit(JSON.stringify(userPairs), composite);
  }

  function rightStateFor(rIdx: number): "selected-target" | "paired" | "idle" {
    for (const k of Object.keys(userPairs)) if (userPairs[+k] === rIdx) return "paired";
    return "idle";
  }

  function leftBg(i: number): string {
    if (locked) {
      const userRight = shuffledRights[userPairs[i]];
      const ok = userRight && grade(userRight, [pairs[i].right]).correct;
      return ok ? "bg-success/15 border-success/60" : "bg-error/15 border-error/60";
    }
    if (selectedLeft === i) return "bg-en/20 border-en";
    if (userPairs[i] !== undefined) return "bg-warning/15 border-warning";
    return "bg-surface border-border";
  }

  function rightBg(rIdx: number): string {
    if (locked) {
      // Find which left it's paired to, color based on correctness of that pair
      const lIdx = Object.keys(userPairs).find((k) => userPairs[+k] === rIdx);
      if (lIdx !== undefined) {
        const ok = grade(shuffledRights[rIdx], [pairs[+lIdx].right]).correct;
        return ok ? "bg-success/15 border-success/60" : "bg-error/15 border-error/60";
      }
      return "bg-surface border-border";
    }
    if (rightStateFor(rIdx) === "paired") return "bg-warning/15 border-warning";
    return "bg-surface border-border";
  }

  return (
    <View>
      <Text className="text-muted text-xs uppercase tracking-wide mb-3">
        Tap a word on the left, then its match on the right
      </Text>
      <View className="flex-row gap-3">
        <View className="flex-1 gap-2">
          {pairs.map((p, i) => (
            <Pressable
              key={i}
              onPress={() => pickLeft(i)}
              disabled={locked}
              className={`rounded-xl border px-3 py-3 ${leftBg(i)}`}
            >
              <Text className="text-text">{p.left}</Text>
              {userPairs[i] !== undefined && !locked ? (
                <Text className="text-muted text-xs mt-1">→ {shuffledRights[userPairs[i]]}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
        <View className="flex-1 gap-2">
          {shuffledRights.map((r, rIdx) => (
            <Pressable
              key={rIdx}
              onPress={() => pickRight(rIdx)}
              disabled={locked}
              className={`rounded-xl border px-3 py-3 ${rightBg(rIdx)}`}
            >
              <Text className="text-text">{r}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {!locked ? (
        <Pressable
          onPress={handle}
          disabled={!allPaired}
          className={`mt-5 rounded-xl px-4 py-4 items-center ${allPaired ? "bg-en" : "bg-surface border border-border"}`}
        >
          <Text className={`${allPaired ? "text-white" : "text-muted"} text-base font-semibold`}>
            Check
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
