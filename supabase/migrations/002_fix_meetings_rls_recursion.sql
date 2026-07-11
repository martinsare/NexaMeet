-- ============================================================
-- FIX: infinite recursion between "meetings" and
-- "meeting_participants" RLS policies.
--
-- The original policies referenced each other directly:
--   meetings ("participants can view")   -> reads meeting_participants
--   meeting_participants ("host access") -> reads meetings
-- Postgres re-evaluates RLS on every table touched inside a policy,
-- so this created a cycle and every query against either table failed
-- with: "infinite recursion detected in policy for relation ...".
-- That's why the dashboard's "Upcoming meetings" list got stuck on
-- "Loading…" forever (and the Notifications panel next to it looked
-- empty, since it renders in the same fetch/loading cycle).
--
-- Fix: move the cross-table checks into SECURITY DEFINER functions,
-- which run with elevated privileges and therefore don't re-trigger
-- RLS on the tables they read internally, breaking the cycle.
-- ============================================================

create or replace function public.is_meeting_host(p_meeting_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $func$
  select exists (
    select 1 from public.meetings m
    where m.id = p_meeting_id
      and m.host_id = auth.uid()
  );
$func$;

create or replace function public.is_meeting_participant(p_meeting_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $func$
  select exists (
    select 1 from public.meeting_participants mp
    where mp.meeting_id = p_meeting_id
      and mp.user_id = auth.uid()
  );
$func$;

drop policy if exists "meetings: participants can view" on public.meetings;
create policy "meetings: participants can view"
  on public.meetings for select
  using (public.is_meeting_participant(meetings.id));

drop policy if exists "meeting_participants: host full access" on public.meeting_participants;
create policy "meeting_participants: host full access"
  on public.meeting_participants for all
  using (public.is_meeting_host(meeting_participants.meeting_id));
