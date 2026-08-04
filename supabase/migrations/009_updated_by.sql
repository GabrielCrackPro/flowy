-- Track who created / last modified entities in shared spaces
-- user_id already records the creator; updated_at + updated_by track the last modifier
-- Safe to run multiple times in Supabase SQL editor

alter table public.categories
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid;

alter table public.transactions
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid;

alter table public.budgets
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid;

alter table public.goals
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid;

alter table public.subscriptions
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'categories_updated_by_fk') then
    alter table public.categories add constraint categories_updated_by_fk
      foreign key (updated_by) references public.profiles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'transactions_updated_by_fk') then
    alter table public.transactions add constraint transactions_updated_by_fk
      foreign key (updated_by) references public.profiles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'budgets_updated_by_fk') then
    alter table public.budgets add constraint budgets_updated_by_fk
      foreign key (updated_by) references public.profiles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'goals_updated_by_fk') then
    alter table public.goals add constraint goals_updated_by_fk
      foreign key (updated_by) references public.profiles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_updated_by_fk') then
    alter table public.subscriptions add constraint subscriptions_updated_by_fk
      foreign key (updated_by) references public.profiles(id) on delete set null;
  end if;
end $$;

create index if not exists categories_updated_by_idx on public.categories(updated_by);
create index if not exists transactions_updated_by_idx on public.transactions(updated_by);
create index if not exists budgets_updated_by_idx on public.budgets(updated_by);
create index if not exists goals_updated_by_idx on public.goals(updated_by);
create index if not exists subscriptions_updated_by_idx on public.subscriptions(updated_by);

-- Backfill existing records: the creator is the last modifier until someone edits
update public.categories set updated_by = user_id where updated_by is null;
update public.transactions set updated_by = user_id where updated_by is null;
update public.budgets set updated_by = user_id where updated_by is null;
update public.goals set updated_by = user_id where updated_by is null;
update public.subscriptions set updated_by = user_id where updated_by is null;
