-- Status notification severity preferences and delivery history.
-- Empty status_alert_severities preserves the legacy default: all severities.
alter table public.profiles
  add column if not exists status_alert_severities varchar[] not null default '{}';

alter table public.push_subscriptions
  add column if not exists last_delivery_at timestamptz,
  add column if not exists last_delivery_status varchar(20);

create table if not exists public.push_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.push_subscriptions(id) on delete set null,
  type varchar(50) not null default 'status',
  component varchar(50),
  severity varchar(20),
  title text not null,
  status varchar(20) not null,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists push_deliveries_user_created_at_idx
  on public.push_deliveries (user_id, created_at desc);

create index if not exists push_deliveries_subscription_created_at_idx
  on public.push_deliveries (subscription_id, created_at desc);

alter table public.push_deliveries enable row level security;

create policy "Users can read their push deliveries"
  on public.push_deliveries for select
  using (user_id = auth.uid());
