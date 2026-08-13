-- Extend Realtime to the remaining shared-view tables.
-- The client still validates space_id/user_id because Realtime bypasses RLS.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['comments', 'activities', 'profiles'] loop
    if exists (
      select 1 from pg_publication where pubname = 'supabase_realtime'
    ) and not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        table_name
      );
    end if;
  end loop;
end
$$;
