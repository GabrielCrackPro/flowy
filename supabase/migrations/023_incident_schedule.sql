-- Maintenance announcements on the status page.
--
-- Incidents gain a `type` (incident | maintenance) and an optional schedule
-- window. Maintenance items are shown with a countdown banner instead of a
-- status pill.

alter table public.incidents
  add column if not exists type varchar(20) not null default 'incident';

alter table public.incidents
  add column if not exists scheduled_start timestamptz;

alter table public.incidents
  add column if not exists scheduled_end timestamptz;

create index if not exists incidents_type_status_idx
  on public.incidents (type, status);
