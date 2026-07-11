-- ============================================================
-- NexaMeet — initial schema
-- Run this in Supabase: SQL Editor → New query → paste → Run
-- Or: supabase db push (if using the Supabase CLI)
-- ============================================================

-- Needed for uuid_generate_v4()
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- One row per authenticated user, mirrors auth.users.
-- ============================================================
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  name        text        not null default '',
  email       text        not null default '',
  avatar_url  text        not null default '',
  title       text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner insert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/9.x/notionists/svg?seed=' || new.id || '&backgroundColor=5B5CF5'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- MEETINGS
-- ============================================================
create table if not exists public.meetings (
  id                 uuid        primary key default uuid_generate_v4(),
  title              text        not null,
  description        text,
  host_id            uuid        not null references public.profiles(id) on delete cascade,
  status             text        not null default 'upcoming'
                                   check (status in ('upcoming', 'live', 'ended')),
  start_at           timestamptz not null,
  duration_mins      integer     not null default 0,
  timezone           text        not null default 'UTC',
  recurring          text        not null default 'none'
                                   check (recurring in ('none', 'daily', 'weekly', 'monthly')),
  password_protected boolean     not null default false,
  waiting_room       boolean     not null default false,
  has_recording      boolean     not null default false,
  has_transcript     boolean     not null default false,
  -- JSON blob: { summary, decisions[], actionItems[], highlights[] }
  ai_summary         jsonb,
  created_at         timestamptz not null default now()
);

alter table public.meetings enable row level security;

create policy "meetings: host full access"
  on public.meetings for all
  using (auth.uid() = host_id);

create policy "meetings: participants can view"
  on public.meetings for select
  using (
    exists (
      select 1 from public.meeting_participants mp
      where mp.meeting_id = meetings.id
        and mp.user_id = auth.uid()
    )
  );

-- ============================================================
-- MEETING PARTICIPANTS
-- ============================================================
create table if not exists public.meeting_participants (
  meeting_id  uuid    not null references public.meetings(id) on delete cascade,
  user_id     uuid    not null references public.profiles(id) on delete cascade,
  name        text    not null,
  avatar_url  text    not null default '',
  joined      boolean not null default false,
  primary key (meeting_id, user_id)
);

alter table public.meeting_participants enable row level security;

create policy "meeting_participants: host full access"
  on public.meeting_participants for all
  using (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_participants.meeting_id
        and m.host_id = auth.uid()
    )
  );

create policy "meeting_participants: self select"
  on public.meeting_participants for select
  using (user_id = auth.uid());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  type        text        not null,
  title       text        not null,
  time        text        not null default '',
  read        boolean     not null default false,
  created_at  timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications: owner select"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications: owner update"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "notifications: owner insert"
  on public.notifications for insert
  with check (auth.uid() = user_id);
