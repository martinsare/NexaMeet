-- ─────────────────────────────────────────────────────────────────
-- Migration 002: Polls, Q&A, and Whiteboard persistence
-- ─────────────────────────────────────────────────────────────────

-- ── Polls ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_polls (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      TEXT        NOT NULL,
  question        TEXT        NOT NULL,
  options         JSONB       NOT NULL DEFAULT '[]',   -- [{id,text}]
  created_by_name TEXT        NOT NULL DEFAULT '',
  is_anonymous    BOOLEAN     NOT NULL DEFAULT FALSE,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meeting_poll_votes (
  poll_id         UUID        NOT NULL REFERENCES meeting_polls(id) ON DELETE CASCADE,
  voter_session   TEXT        NOT NULL,
  option_id       TEXT        NOT NULL,
  voted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (poll_id, voter_session)   -- one vote per person per poll
);

CREATE INDEX IF NOT EXISTS idx_meeting_polls_meeting ON meeting_polls(meeting_id);

-- ── Q&A ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_questions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id       TEXT        NOT NULL,
  asked_by_name    TEXT        NOT NULL,
  asked_by_session TEXT        NOT NULL,
  text             TEXT        NOT NULL,
  is_answered      BOOLEAN     NOT NULL DEFAULT FALSE,
  is_dismissed     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meeting_question_upvotes (
  question_id    UUID  NOT NULL REFERENCES meeting_questions(id) ON DELETE CASCADE,
  voter_session  TEXT  NOT NULL,
  PRIMARY KEY (question_id, voter_session)
);

CREATE INDEX IF NOT EXISTS idx_meeting_questions_meeting ON meeting_questions(meeting_id);

-- ── Whiteboard stroke persistence (latecomers load full state) ───
CREATE TABLE IF NOT EXISTS meeting_whiteboard_strokes (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id        TEXT        NOT NULL,
  stroke_data       JSONB       NOT NULL,
  created_by_session TEXT       NOT NULL,
  is_deleted        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whiteboard_strokes_meeting ON meeting_whiteboard_strokes(meeting_id);

-- ── Row-level security (permissive — tighten per-app if needed) ──
ALTER TABLE meeting_polls                ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_poll_votes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_questions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_question_upvotes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_whiteboard_strokes   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_polls"        ON meeting_polls              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_votes"        ON meeting_poll_votes         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_questions"    ON meeting_questions          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_upvotes"      ON meeting_question_upvotes   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_wb_strokes"   ON meeting_whiteboard_strokes FOR ALL USING (true) WITH CHECK (true);
