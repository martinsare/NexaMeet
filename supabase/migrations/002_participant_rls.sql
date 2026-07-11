-- ============================================================
-- Migration 002 — allow participants to record their own join
-- Run in Supabase: SQL Editor → New query → paste → Run
-- ============================================================

-- Participants can insert their own row (joining a meeting).
-- The FK on meeting_id ensures the meeting must exist.
create policy "meeting_participants: self insert"
  on public.meeting_participants for insert
  with check (user_id = auth.uid());

-- Participants can update their own row (e.g. re-join after a drop).
create policy "meeting_participants: self update"
  on public.meeting_participants for update
  using (user_id = auth.uid());

-- Allow participants to read meetings they are recorded in
-- (covers the case where they rejoin and need to fetch meeting info).
-- The existing is_meeting_participant() function handles this — no
-- extra policy needed here; this migration only fills the write gap.
