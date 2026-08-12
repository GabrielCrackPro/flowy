-- Per-user status alert preferences.

alter table "profiles" add column "status_alerts_enabled" boolean not null default true;

alter table "profiles" add column "status_alert_components" varchar[] not null default '{}';
