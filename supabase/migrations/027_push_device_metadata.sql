-- Push device metadata and delivery health.
alter table public.push_subscriptions
  add column if not exists device_name varchar(80),
  add column if not exists installation_type varchar(20),
  add column if not exists last_seen_at timestamptz,
  add column if not exists failure_count integer not null default 0,
  add column if not exists last_failure_reason text;

create index if not exists push_subscriptions_user_last_seen_idx
  on public.push_subscriptions (user_id, last_seen_at desc);
