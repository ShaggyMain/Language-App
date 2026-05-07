/**
 * Thin wrapper around ts-fsrs. Maps grading results to FSRS ratings and
 * produces a fresh `Card` with updated due-date / stability. The SRS
 * "card identity" is the generated instance (templateId + slotIds), not
 * the rendered exercise text — see lib/db.ts for storage shape.
 */

import { Card, createEmptyCard, fsrs, type Grade, Rating } from "ts-fsrs";
import type { GradeResult } from "./grading";

const scheduler = fsrs();

export function newCard(now: Date = new Date()): Card {
  return createEmptyCard(now);
}

export type SrsRating = "again" | "hard" | "good" | "easy";

const RATING_MAP: Record<SrsRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export function ratingFromGrade(g: GradeResult): SrsRating {
  if (g.correct && g.score === 1) return "good";
  if (g.correct) return "hard";
  return "again";
}

export function review(card: Card | null, rating: SrsRating, now: Date = new Date()): Card {
  const base: Card = card !== null ? card : createEmptyCard(now);
  const result = scheduler.next(base, now, RATING_MAP[rating]);
  return result.card;
}

export function isDue(card: Card, now: Date = new Date()): boolean {
  return card.due.getTime() <= now.getTime();
}
