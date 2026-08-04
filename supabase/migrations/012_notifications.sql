-- Push subscriptions and persisted alerts for the notification system
-- Safe to run multiple times in Supabase SQL editor

create extension if not exists "pgcrypto";

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid references public.spaces(id) on delete cascade,
  type varchar(50) not null,
  severity varchar(20) not null,
  fingerprint text not null,
  title text not null,
  description text,
  data jsonb,
  sent_at timestamptz,
  read_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint alerts_user_id_fingerprint_key unique (user_id, fingerprint)
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions(user_id);

create index if not exists alerts_user_id_resolved_at_idx
  on public.alerts(user_id, resolved_at);

create index if not exists alerts_user_id_created_at_idx
  on public.alerts(user_id, created_at);
