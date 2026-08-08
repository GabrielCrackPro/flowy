-- Realtime: sync domain tables to clients so shared spaces stay fresh.
-- Mirrors the alerts pattern from 013_alerts_realtime.sql. Realtime ignores
-- RLS, so clients subscribe with a space_id filter and validate the payload.

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    alter publication supabase_realtime add table public.transactions;
    alter publication supabase_realtime add table public.budgets;
    alter publication supabase_realtime add table public.goals;
    alter publication supabase_realtime add table public.subscriptions;
    alter publication supabase_realtime add table public.categories;
    alter publication supabase_realtime add table public.space_members;
  end if;
end
$$;
