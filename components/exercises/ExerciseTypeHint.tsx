import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import type { Exercise } from "../../lib/types";
import { hasSeenHint, markHintSeen } from "../../lib/seenHints";

const HINT_BY_TYPE: Partial<Record<Exercise["type"], string>> = {
  order: "💡 Tap a word in the bank to add it to the sentence. Tap a placed word to send it back.",
  match: "💡 Tap an item on the left, then its match on the right.",
  conjugate: "💡 Fill the form for every person, then tap Check.",
  dictation: "💡 Tap ▶ to play the audio. You can replay as often as you need.",
  errorFix: "💡 The sentence below has one mistake. Type the corrected version.",
  transform: "💡 Read the source sentence and rewrite it as the instruction asks.",
  translate: "💡 Translate the source into the target language.",
};

export function ExerciseTypeHint({ type }: { type: Exercise["type"] }) {
  const [show, setShow] = useState(false);
  const text = HINT_BY_TYPE[type];

  useEffect(() => {
    if (!text) return;
    const id = `type:${type}`;
    let cancelled = false;
    (async () => {
      const seen = await hasSeenHint(id);
      if (cancelled) return;
      if (!seen) {
        setShow(true);
        await markHintSeen(id);
      }
    })();
    return () => { cancelled = true; };
  }, [type, text]);

  if (!text || !show) return null;
  return (
    <View
      style={{
        backgroundColor: "#3b82f618",
        borderWidth: 1,
        borderColor: "#3b82f655",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 16,
      }}
    >
      <Text style={{ color: "#e6ecf5", fontSize: 13, lineHeight: 19 }}>{text}</Text>
    </View>
  );
}
