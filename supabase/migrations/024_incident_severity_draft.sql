-- Incident severity (minor | major | critical) and draft flag for
-- auto-created incidents from status checks. Drafts stay hidden from the
-- public page until an admin publishes them.

alter table public.incidents
  add column if not exists severity varchar(20) not null default 'major';

alter table public.incidents
  add column if not exists draft boolean not null default false;
