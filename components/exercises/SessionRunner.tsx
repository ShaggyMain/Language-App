/**
 * Drives one practice/path session end-to-end. Owns:
 *  - repo loading
 *  - session item selection
 *  - reducer state
 *  - grading dispatch + SRS persistence
 *  - navigation to /results when finished
 */

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { router } from "expo-router";
import type { Topic } from "../../lib/types";
import { getRepos, type Repos } from "../../lib/db";
import { lexiconBundleFor, templatesForTopic } from "../../lib/content";
import { pickSessionExercises, recordItemSeen, type SessionItem } from "../../lib/selector";
import { grade, type GradeResult } from "../../lib/grading";
import {
  initialState,
  reduce,
  summarize,
  type SessionAction,
  type SessionMode,
  type SessionState,
} from "../../lib/session";
import { publishSession } from "../../lib/sessionStore";
import { ratingFromGrade, review } from "../../lib/srs";
import { ExerciseRenderer } from "./ExerciseRenderer";
import { ResultSheet } from "./ResultSheet";
import { Language } from "../../lib/types";

const USER_ID = "local";

type Props = {
  language: string;
  topic: Topic;
  mode: SessionMode;
  count?: number;
};

export function SessionRunner({ language, topic, mode, count = 10 }: Props) {
  const [state, dispatch] = useReducer<SessionState, [SessionAction]>(reduce, initialState());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reposRef = useRef<Repos | null>(null);
  const sessionIdRef = useRef<number | null>(null);

  const lex = useMemo(() => lexiconBundleFor("en"), []);
  const templates = useMemo(() => templatesForTopic(topic.id), [topic.id]);

  // Bootstrap: load repos, pick session, init state
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const repos = await getRepos();
        if (cancelled) return;
        reposRef.current = repos;
        const startedAt = Date.now();
        const sessionId = await repos.log.startSession({
          userId: USER_ID,
          topicId: topic.id,
          startedAt,
        });
        sessionIdRef.current = sessionId;
        const items = await pickSessionExercises(topic, templates, lex, repos, {
          userId: USER_ID,
          mode,
          count,
        });
        if (cancelled) return;
        if (items.length === 0) {
          setError("No exercises available for this topic yet.");
        } else {
          dispatch({ type: "START", topicId: topic.id, mode, items, now: startedAt });
        }
        setLoading(false);
      } catch (e) {
        setError((e as Error).message);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id, mode]);

  // After each NEXT, persist the previous item (markSeen + srs.upsert)
  const persistedCursorRef = useRef<number>(-1);
  useEffect(() => {
    const repos = reposRef.current;
    const sid = sessionIdRef.current;
    if (!repos || sid === null) return;
    if (state.phase !== "answering") return;
    const prev = state.cursor - 1;
    if (prev < 0 || prev === persistedCursorRef.current) return;
    const item = state.items[prev];
    if (!item || !item.result) return;
    persistedCursorRef.current = prev;
    void persistItem(repos, sid, topic.id, item as SessionItem & { result: GradeResult });
  }, [state.cursor, state.phase, topic.id, state.items]);

  // When session finishes, log + publish + navigate to results
  useEffect(() => {
    if (state.phase !== "finished" || state.items.length === 0) return;
    const repos = reposRef.current;
    const sid = sessionIdRef.current;
    if (!repos || sid === null) return;

    // Persist last item if not yet
    const last = state.items.length - 1;
    if (last !== persistedCursorRef.current) {
      const item = state.items[last];
      if (item && item.result) {
        persistedCursorRef.current = last;
        void persistItem(repos, sid, topic.id, item as SessionItem & { result: GradeResult });
      }
    }
    const sum = summarize(state);
    void repos.log.finishSession({ sessionId: sid, finishedAt: Date.now(), summary: sum });
    publishSession(state, sum);
    router.replace(`/${language}/results`);
  }, [state.phase, state, topic.id, language]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#3b82f6" />
        <Text className="text-muted mt-3">Preparing session…</Text>
      </View>
    );
  }
  if (error) {
    return <Text className="text-error">{error}</Text>;
  }
  if (state.items.length === 0 || state.phase === "finished") {
    return <Text className="text-muted">Session complete.</Text>;
  }

  const cur = state.items[state.cursor];
  const locked = state.phase === "showing-result";

  function handleSubmit(raw: string, result: GradeResult) {
    dispatch({ type: "SUBMIT", userInput: raw, result });
  }

  function handleNext() {
    dispatch({ type: "NEXT" });
  }

  const canonical = canonicalAnswer(cur.exercise);
  const explanation = "explanation" in cur.exercise ? cur.exercise.explanation : undefined;

  const pickedIndex =
    cur.exercise.type === "mcq" && typeof cur.userInput === "string"
      ? cur.exercise.options.indexOf(cur.userInput)
      : undefined;

  const langParsed = Language.safeParse(language);
  const lang = langParsed.success ? langParsed.data : "en";

  return (
    <View className="flex-1">
      <ProgressBar current={state.cursor + 1} total={state.items.length} />
      <ExerciseRenderer
        exercise={cur.exercise}
        language={lang}
        locked={locked}
        userInput={cur.userInput}
        pickedIndex={pickedIndex}
        resultCorrect={cur.result?.correct}
        onSubmit={handleSubmit}
      />
      {locked && cur.result ? (
        <ResultSheet
          result={cur.result}
          explanation={explanation}
          canonical={canonical}
          onNext={handleNext}
        />
      ) : null}
    </View>
  );
}

function canonicalAnswer(ex: import("../../lib/types").Exercise): string | undefined {
  switch (ex.type) {
    case "fill":
    case "translate":
    case "transform":
    case "errorFix":
    case "dictation":
      return ex.answers[0];
    case "order":
      return ex.answer.join(" ");
    case "conjugate":
      return ex.persons.map((p) => `${p.person}: ${p.answer}`).join(" · ");
    case "match":
      return ex.pairs.map((p) => `${p.left} → ${p.right}`).join("; ");
    default:
      return undefined;
  }
}

async function persistItem(
  repos: Repos,
  sessionId: number,
  topicId: string,
  item: SessionItem & { result: GradeResult },
): Promise<void> {
  await recordItemSeen(repos, USER_ID, topicId, sessionId, item, item.result.correct);
  if (item.origin === "authored" || !item.templateId || !item.slotIds) return;
  const card = await repos.srs.getCard(USER_ID, item.instanceHash);
  const next = review(card, ratingFromGrade(item.result));
  await repos.srs.upsertCard({
    userId: USER_ID,
    topicId,
    instance: { templateId: item.templateId, instanceHash: item.instanceHash, slotIds: item.slotIds },
    card: next,
  });
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.min(100, Math.round((current / Math.max(1, total)) * 100));
  return (
    <View className="mb-6">
      <Text className="text-muted text-xs mb-2">
        {current} / {total}
      </Text>
      <View className="h-2 rounded-full bg-surface border border-border overflow-hidden">
        <View className="h-full bg-en" style={{ width: `${pct}%` }} />
      </View>
    </View>
  );
}
