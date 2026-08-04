-- Enable UUID generation (pgcrypto)
create extension if not exists "pgcrypto";

-- Profiles (linked to Supabase Auth users)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade,
  email text,
  name text,
  avatar_url text,
  currency varchar(8) default 'USD',
  locale varchar(10) default 'es',
  created_at timestamptz default now(),
  primary key (id)
);

-- Categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  type text not null check (type in ('INCOME', 'EXPENSE')),
  created_at timestamptz default now(),
  unique (user_id, name)
);

-- Transactions
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('INCOME', 'EXPENSE')),
  amount numeric not null,
  description text,
  category_id uuid references categories(id) on delete set null,
  payment_method text,
  date date,
  notes text,
  receipt_url text,
  is_recurring boolean default false,
  created_at timestamptz default now()
);

-- Budgets
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  budget_limit numeric not null,
  month int,
  year int,
  created_at timestamptz default now()
);

-- Goals
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  target_amount numeric not null,
  saved_amount numeric default 0,
  deadline date,
  created_at timestamptz default now()
);

-- Subscriptions
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  merchant text,
  amount numeric,
  billing_cycle text,
  next_payment date,
  active boolean default true
);

-- Indexes (aligned with Prisma schema)
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
