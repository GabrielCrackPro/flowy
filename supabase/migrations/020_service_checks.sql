-- Service checks powering the public status page.
--
-- Rows are written only by the server (StatusService via Prisma), never by
-- clients. The status page is public, so SELECT is open; writes stay locked
-- down (Prisma's service role bypasses RLS anyway).

create table if not exists public.service_checks (
  id uuid primary key default gen_random_uuid(),
  component varchar(50) not null,
  status varchar(20) not null,
  latency_ms integer,
  detail text,
  checked_at timestamptz not null default now()
);

create index if not exists service_checks_component_checked_at_idx
  on public.service_checks (component, checked_at);

alter table public.service_checks enable row level security;

-- Public status page: anyone may read check history.
create policy "Anyone can read service checks" on public.service_checks
  for select
  using (true);

-- No insert/update/delete policies: writes happen server-side only.
