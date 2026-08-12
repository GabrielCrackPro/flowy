-- Add an optional picture to spaces.
alter table public.spaces
  add column if not exists avatar_url text;
