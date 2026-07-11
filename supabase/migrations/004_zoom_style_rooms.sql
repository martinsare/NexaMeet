-- ============================================================
-- Zoom-style meeting controls:
-- - true lock state
-- - breakout rooms / in-meeting rooms
-- ============================================================

alter table public.meetings
  add column if not exists locked boolean not null default false;

create table if not exists public.meeting_rooms (
  id          uuid        primary key default uuid_generate_v4(),
  meeting_id  uuid        not null references public.meetings(id) on delete cascade,
  name        text        not null,
  kind        text        not null default 'breakout'
                 check (kind in ('main', 'breakout', 'waiting')),
  order_index integer     not null default 0,
  created_at  timestamptz not null default now(),
  unique (meeting_id, name)
);

alter table public.meeting_rooms enable row level security;

alter table public.meeting_participants
  add column if not exists room_id uuid references public.meeting_rooms(id) on delete set null;

alter table public.meeting_participants
  add column if not exists guest_id text,
  add column if not exists guest_name text;

alter table public.meeting_participants
  alter column user_id drop not null;

create unique index if not exists meeting_participants_guest_id_key
  on public.meeting_participants (meeting_id, guest_id)
  where guest_id is not null;

create or replace function public.is_meeting_room_member(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $func$
  select exists (
    select 1
    from public.meeting_rooms r
    join public.meeting_participants mp on mp.meeting_id = r.meeting_id
    where r.id = p_room_id
      and mp.user_id = auth.uid()
  );
$func$;

drop policy if exists "meeting_rooms: host full access" on public.meeting_rooms;
create policy "meeting_rooms: host full access"
  on public.meeting_rooms for all
  using (public.is_meeting_host(meeting_rooms.meeting_id));

drop policy if exists "meeting_rooms: participants can view" on public.meeting_rooms;
create policy "meeting_rooms: participants can view"
  on public.meeting_rooms for select
  using (
    public.is_meeting_host(meeting_rooms.meeting_id)
    or exists (
      select 1 from public.meeting_participants mp
      where mp.meeting_id = meeting_rooms.meeting_id
        and mp.user_id = auth.uid()
    )
  );

drop policy if exists "meeting_rooms: self update" on public.meeting_rooms;
create policy "meeting_rooms: self update"
  on public.meeting_rooms for update
  using (
    public.is_meeting_host(meeting_rooms.meeting_id)
    or public.is_meeting_room_member(meeting_rooms.id)
  );

drop policy if exists "meeting_rooms: host insert" on public.meeting_rooms;
create policy "meeting_rooms: host insert"
  on public.meeting_rooms for insert
  with check (public.is_meeting_host(meeting_rooms.meeting_id));

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
