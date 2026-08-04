-- Spaces and multi-tenant scoping for the finance app
-- Safe to run multiple times in Supabase SQL editor

create extension if not exists "pgcrypto";

create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  join_code text unique,
  owner_id uuid not null,
  is_personal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint spaces_owner_fk foreign key (owner_id) references public.profiles(id) on delete cascade
);

create table if not exists public.space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null,
  user_id uuid not null,
  role varchar(20) not null default 'member',
  joined_at timestamptz not null default now(),
  constraint space_members_space_fk foreign key (space_id) references public.spaces(id) on delete cascade,
  constraint space_members_user_fk foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint space_members_unique unique (space_id, user_id)
);

alter table public.profiles
  add column if not exists active_space_id uuid,
  add column if not exists show_language_selector boolean default true;

alter table public.profiles
  add constraint profiles_active_space_fk
  foreign key (active_space_id) references public.spaces(id) on delete set null;

alter table public.categories
  add column if not exists space_id uuid;

alter table public.transactions
  add column if not exists space_id uuid;

alter table public.budgets
  add column if not exists space_id uuid;

alter table public.goals
  add column if not exists space_id uuid;

alter table public.subscriptions
  add column if not exists space_id uuid;

alter table public.comments
  add column if not exists space_id uuid;

alter table public.activities
  add column if not exists space_id uuid;

alter table public.categories
  add constraint categories_space_fk foreign key (space_id) references public.spaces(id) on delete cascade;

alter table public.transactions
  add constraint transactions_space_fk foreign key (space_id) references public.spaces(id) on delete cascade;

alter table public.budgets
  add constraint budgets_space_fk foreign key (space_id) references public.spaces(id) on delete cascade;

alter table public.goals
  add constraint goals_space_fk foreign key (space_id) references public.spaces(id) on delete cascade;

alter table public.subscriptions
  add constraint subscriptions_space_fk foreign key (space_id) references public.spaces(id) on delete cascade;

alter table public.comments
  add constraint comments_space_fk foreign key (space_id) references public.spaces(id) on delete cascade;

alter table public.activities
  add constraint activities_space_fk foreign key (space_id) references public.spaces(id) on delete cascade;

create index if not exists spaces_owner_id_idx on public.spaces(owner_id);
create index if not exists spaces_slug_idx on public.spaces(slug);
create index if not exists space_members_space_id_idx on public.space_members(space_id);
create index if not exists space_members_user_id_idx on public.space_members(user_id);
create index if not exists categories_space_id_idx on public.categories(space_id);
create index if not exists transactions_space_id_idx on public.transactions(space_id);
create index if not exists budgets_space_id_idx on public.budgets(space_id);
create index if not exists goals_space_id_idx on public.goals(space_id);
create index if not exists subscriptions_space_id_idx on public.subscriptions(space_id);
create index if not exists comments_space_id_idx on public.comments(space_id);
create index if not exists activities_space_id_idx on public.activities(space_id);

-- Backfill personal spaces for existing profiles
insert into public.spaces (name, slug, join_code, owner_id, is_personal)
select
  concat(coalesce(p.name, 'Mi espacio'), '''s space'),
  concat(lower(regexp_replace(coalesce(p.name, 'mi-espacio'), '[^a-z0-9]+', '-', 'g')), '-', p.id::text),
  upper(substr(md5(random()::text), 1, 6)),
  p.id,
  true
from public.profiles p
left join public.spaces s on s.owner_id = p.id and s.is_personal = true
where s.id is null;

insert into public.space_members (space_id, user_id, role)
select s.id, p.id, 'owner'
from public.profiles p
join public.spaces s on s.owner_id = p.id and s.is_personal = true
left join public.space_members sm on sm.space_id = s.id and sm.user_id = p.id
where sm.id is null;

update public.profiles p
set active_space_id = s.id
from public.spaces s
where p.active_space_id is null
  and s.owner_id = p.id
  and s.is_personal = true;

-- Backfill existing records to the personal space
update public.categories c
set space_id = s.id
from public.profiles p
join public.spaces s on s.owner_id = p.id and s.is_personal = true
where c.user_id = p.id
  and c.space_id is null;

update public.transactions t
set space_id = s.id
from public.profiles p
join public.spaces s on s.owner_id = p.id and s.is_personal = true
where t.user_id = p.id
  and t.space_id is null;

update public.budgets b
set space_id = s.id
from public.profiles p
join public.spaces s on s.owner_id = p.id and s.is_personal = true
where b.user_id = p.id
  and b.space_id is null;

update public.goals g
set space_id = s.id
from public.profiles p
join public.spaces s on s.owner_id = p.id and s.is_personal = true
where g.user_id = p.id
  and g.space_id is null;

update public.subscriptions s
set space_id = ss.id
from public.profiles p
join public.spaces ss on ss.owner_id = p.id and ss.is_personal = true
where s.user_id = p.id
  and s.space_id is null;

update public.comments c
set space_id = s.id
from public.profiles p
join public.spaces s on s.owner_id = p.id and s.is_personal = true
where c.user_id = p.id
  and c.space_id is null;

update public.activities a
set space_id = s.id
from public.profiles p
join public.spaces s on s.owner_id = p.id and s.is_personal = true
where a.user_id = p.id
  and a.space_id is null;
