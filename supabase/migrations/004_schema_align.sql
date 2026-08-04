-- Idempotent fixes for databases created from an older 001_init.sql

-- transactions.type (required by Prisma)
alter table if exists transactions
  add column if not exists type text;

update transactions
set type = 'EXPENSE'
where type is null;

alter table if exists transactions
  alter column type set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'transactions_type_check'
  ) then
    alter table transactions
      add constraint transactions_type_check
      check (type in ('INCOME', 'EXPENSE'));
  end if;
end $$;

-- categories.type (required, not nullable)
update categories
set type = 'EXPENSE'
where type is null;

alter table if exists categories
  alter column type set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'categories_type_check'
  ) then
    alter table categories
      add constraint categories_type_check
      check (type in ('INCOME', 'EXPENSE'));
  end if;
end $$;

-- Unique category names per user
create unique index if not exists categories_user_id_name_key
  on categories(user_id, name);

-- Indexes
create index if not exists categories_user_id_idx on categories(user_id);
create index if not exists categories_type_idx on categories(type);
create index if not exists transactions_user_id_idx on transactions(user_id);
create index if not exists transactions_category_id_idx on transactions(category_id);
create index if not exists transactions_type_idx on transactions(type);
create index if not exists transactions_date_idx on transactions(date);
create index if not exists budgets_user_id_idx on budgets(user_id);
create index if not exists budgets_category_id_idx on budgets(category_id);
create index if not exists goals_user_id_idx on goals(user_id);
create index if not exists subscriptions_user_id_idx on subscriptions(user_id);
