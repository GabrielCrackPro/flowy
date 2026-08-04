-- Habilitar Row Level Security y Realtime para las alertas

-- Alerts
alter table if exists alerts enable row level security;

create policy "Users can select their own alerts" on alerts
  for select
  using (auth.uid() = user_id);

create policy "Users can update their own alerts" on alerts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Realtime: emit alerts changes to the client so the inbox stays in sync.
do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    alter publication supabase_realtime add table public.alerts;
  end if;
end
$$;
