-- Per-user status alert preferences. When enabled (default), users receive
-- status change pushes; `status_alert_components` restricts those alerts to
-- specific components (empty array = all components).

alter table public.profiles
  add column if not exists status_alerts_enabled boolean not null default true;

alter table public.profiles
  add column if not exists status_alert_components varchar[] not null default '{}';
