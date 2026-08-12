-- Global user roles. `admin` users can manage status incidents; everyone
-- else defaults to `user`. Promotion is done manually via SQL (there is no
-- self-serve admin escalation):
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';

alter table public.profiles
  add column if not exists role varchar(20) not null default 'user';
