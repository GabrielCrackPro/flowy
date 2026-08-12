-- Add incident severity (minor | major | critical) and draft flag for
-- auto-created incidents from status checks.

alter table "incidents" add column "severity" varchar(20) not null default 'major';

alter table "incidents" add column "draft" boolean not null default false;
