-- Incidents powering the public status page.
--
-- Rows are written only by the server (StatusService via Prisma), never by
-- clients. The status page is public, so SELECT is open; writes stay locked
-- down (Prisma's service role bypasses RLS anyway).

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text,
  status varchar(20) not null, -- investigating | monitoring | resolved
  component varchar(50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists incidents_status_created_at_idx
  on public.incidents (status, created_at);

create table if not exists public.incident_updates (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  status varchar(20) not null,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists incident_updates_incident_id_created_at_idx
  on public.incident_updates (incident_id, created_at);

alter table public.incidents enable row level security;
alter table public.incident_updates enable row level security;

-- Public status page: anyone may read incidents and their timeline.
create policy "Anyone can read incidents" on public.incidents
  for select
  using (true);

create policy "Anyone can read incident updates" on public.incident_updates
  for select
  using (true);

-- No insert/update/delete policies: writes happen server-side only.
