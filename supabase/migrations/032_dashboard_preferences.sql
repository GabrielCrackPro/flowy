-- Dashboard layout preferences.
--
-- `dashboard_cards` lists the cards the user wants visible (null = show all).
-- `dashboard_order` stores the per-region display order of those cards
-- (null = canonical order). `dashboard_cards` predates the migration history
-- (it was pushed directly), so it is added with `if not exists` to be safe on
-- databases that already have it.

alter table public.profiles
  add column if not exists dashboard_cards jsonb;

alter table public.profiles
  add column if not exists dashboard_order jsonb;
