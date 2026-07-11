-- ============================================================
-- AI meeting notes pipeline: Daily.co call audio -> Groq Whisper
-- transcript -> Groq LLM summary, stored per meeting.
--
-- meetings.ai_summary / has_transcript already existed (see
-- 001_initial.sql) but were only ever populated by demo data.
-- This adds a table for the raw transcript text + timestamped
-- segments, which the mocked meetings never needed.
-- ============================================================

create table if not exists public.meeting_transcripts (
  meeting_id  uuid        primary key references public.meetings(id) on delete cascade,
  transcript  text        not null default '',
  -- Whisper verbose_json segments: [{ start, end, text }, ...]
  segments    jsonb,
  created_at  timestamptz not null default now()
);

alter table public.meeting_transcripts enable row level security;

-- Reuses the SECURITY DEFINER helpers from 002_fix_meetings_rls_recursion.sql
-- to avoid re-introducing cross-table RLS recursion.
drop policy if exists "meeting_transcripts: participants can view" on public.meeting_transcripts;
create policy "meeting_transcripts: participants can view"
  on public.meeting_transcripts for select
  using (
    public.is_meeting_host(meeting_transcripts.meeting_id)
    or public.is_meeting_participant(meeting_transcripts.meeting_id)
  );

drop policy if exists "meeting_transcripts: host can insert" on public.meeting_transcripts;
create policy "meeting_transcripts: host can insert"
  on public.meeting_transcripts for insert
  with check (public.is_meeting_host(meeting_transcripts.meeting_id));

drop policy if exists "meeting_transcripts: host can update" on public.meeting_transcripts;
create policy "meeting_transcripts: host can update"
  on public.meeting_transcripts for update
  using (public.is_meeting_host(meeting_transcripts.meeting_id));
