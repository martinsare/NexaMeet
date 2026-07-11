-- ============================================================
-- Follow-up to 004_zoom_style_rooms.sql
-- Adds persistent guest waiting-room support to existing tables.
-- Run this after the first 004 migration if it is already applied.
-- ============================================================

alter table public.meeting_participants
  add column if not exists id uuid default uuid_generate_v4(),
  add column if not exists guest_id text,
  add column if not exists guest_name text;

alter table public.meeting_participants
  alter column user_id drop not null;

update public.meeting_participants
set id = uuid_generate_v4()
where id is null;

alter table public.meeting_participants
  drop constraint if exists meeting_participants_pkey;

alter table public.meeting_participants
  add primary key (id);

alter table public.meeting_participants
  drop constraint if exists meeting_participants_meeting_id_user_id_key;

alter table public.meeting_participants
  add unique (meeting_id, user_id);

create unique index if not exists meeting_participants_guest_id_key
  on public.meeting_participants (meeting_id, guest_id)
  where guest_id is not null;

drop policy if exists "meeting_participants: guest insert" on public.meeting_participants;
create policy "meeting_participants: guest insert"
  on public.meeting_participants for insert
  with check (
    auth.uid() is null
    and user_id is null
    and guest_id is not null
    and guest_name is not null
  );

drop policy if exists "meeting_participants: guest select" on public.meeting_participants;
create policy "meeting_participants: guest select"
  on public.meeting_participants for select
  using (
    public.is_meeting_host(meeting_participants.meeting_id)
    or (auth.uid() is null and guest_id is not null)
  );
