-- Per-user push notification preferences: which alert types are pushed as OS
-- notifications (budget-exceeded, upcoming-payment, goal-deadline, ...).
--
-- An empty array means *all* types are enabled — legacy users keep receiving
-- every alert without any migration of existing rows.

alter table public.profiles
  add column if not exists push_preferences text[] not null default '{}';
