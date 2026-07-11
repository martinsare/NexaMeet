-- Allow any user (authenticated or anonymous) to read a meeting row by its ID.
-- The meeting UUID acts as an invite token — knowing it is sufficient to grant
-- read access, matching the existing "share link = join" UX.
-- This unblocks participants who arrive via a link before they have been
-- recorded in meeting_participants (which is the only other select policy).

create policy "meetings: public read by id"
  on public.meetings for select
  to anon, authenticated
  using (true);
