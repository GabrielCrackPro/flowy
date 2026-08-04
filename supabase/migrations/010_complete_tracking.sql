-- Complete created/updated tracking for remaining entities
-- Safe to run multiple times in Supabase SQL editor

-- Profiles: add updated_at and updated_by
alter table public.profiles
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid;

-- Comments: add updated_by
alter table public.comments
  add column if not exists updated_by uuid;

-- Spaces: add updated_by
alter table public.spaces
  add column if not exists updated_by uuid;

-- Activities: add updated_at and updated_by
alter table public.activities
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid;

-- Space members: add created_at, updated_at, updated_by
alter table public.space_members
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid;

-- Add foreign key constraints
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_updated_by_fk') then
    alter table public.profiles add constraint profiles_updated_by_fk
      foreign key (updated_by) references public.profiles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'comments_updated_by_fk') then
    alter table public.comments add constraint comments_updated_by_fk
      foreign key (updated_by) references public.profiles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'spaces_updated_by_fk') then
    alter table public.spaces add constraint spaces_updated_by_fk
      foreign key (updated_by) references public.profiles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'activities_updated_by_fk') then
    alter table public.activities add constraint activities_updated_by_fk
      foreign key (updated_by) references public.profiles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'space_members_updated_by_fk') then
    alter table public.space_members add constraint space_members_updated_by_fk
      foreign key (updated_by) references public.profiles(id) on delete set null;
  end if;
end $$;

-- Create indexes
create index if not exists profiles_updated_by_idx on public.profiles(updated_by);
create index if not exists comments_updated_by_idx on public.comments(updated_by);
create index if not exists spaces_updated_by_idx on public.spaces(updated_by);
create index if not exists activities_updated_by_idx on public.activities(updated_by);
create index if not exists space_members_updated_by_idx on public.space_members(updated_by);

-- Backfill existing records where appropriate
-- For profiles, updated_by should reference the profile owner
update public.profiles set updated_by = id where updated_by is null;

-- For comments, updated_by should reference the comment creator
update public.comments set updated_by = user_id where updated_by is null;

-- For spaces, updated_by should reference the space owner
update public.spaces set updated_by = owner_id where updated_by is null;

-- For activities, updated_by should reference the actor if available, otherwise the user
update public.activities set updated_by = coalesce(actor_id, user_id) where updated_by is null;

-- For space_members, updated_by should reference the member
update public.space_members set updated_by = user_id where updated_by is null;
