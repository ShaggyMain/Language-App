-- Run this in the Supabase SQL editor on first project setup. Idempotent.

-- ───────────────────────── Spaced-repetition schedule ─────────────────────────
CREATE TABLE IF NOT EXISTS public.srs_cards (
  user_id          UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id         TEXT    NOT NULL,
  instance_hash    TEXT    NOT NULL,
  template_id      TEXT    NOT NULL,
  slot_ids         JSONB   NOT NULL,
  due              BIGINT  NOT NULL,
  stability        DOUBLE PRECISION NOT NULL,
  difficulty       DOUBLE PRECISION NOT NULL,
  elapsed_days     DOUBLE PRECISION NOT NULL,
  scheduled_days   DOUBLE PRECISION NOT NULL,
  reps             INT     NOT NULL,
  lapses           INT     NOT NULL,
  state            INT     NOT NULL,
  last_review      BIGINT,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, instance_hash)
);

CREATE INDEX IF NOT EXISTS srs_cards_due_idx
  ON public.srs_cards (user_id, topic_id, due);

ALTER TABLE public.srs_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users own srs cards" ON public.srs_cards;
CREATE POLICY "users own srs cards" ON public.srs_cards
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ───────────────────────── Path progress ─────────────────────────
CREATE TABLE IF NOT EXISTS public.passed_lessons (
  user_id           UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id          TEXT    NOT NULL,
  first_passed_at   BIGINT  NOT NULL,
  last_passed_at    BIGINT  NOT NULL,
  pass_count        INT     NOT NULL DEFAULT 1,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, topic_id)
);

ALTER TABLE public.passed_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users own passed lessons" ON public.passed_lessons;
CREATE POLICY "users own passed lessons" ON public.passed_lessons
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ───────────────────────── (Optional) profiles ─────────────────────────
-- Useful if you later add display names, streaks, etc.
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID    NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_language TEXT,
  self_reported_level TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users own profile" ON public.profiles;
CREATE POLICY "users own profile" ON public.profiles
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
