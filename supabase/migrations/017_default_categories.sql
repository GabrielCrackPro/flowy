-- Seed-once guard for default categories.
--
-- New signups get a sensible set of default categories so they don't land
-- on empty states everywhere. The profile row itself is created by the
-- auth trigger (003/016), so the seed cannot live there; instead the
-- app seeds on first profile ensure (ProfileService.ensure →
-- CategoryService.seedDefaults) and records the fact here.
--
-- `categories_seeded` is a one-way latch:
--   - false (new users)  → the app seeds defaults on first session
--   - true (any user)    → never seeded again, even if the user later
--                          deletes all categories (they made that choice)
--
-- Existing accounts with categories are backfilled to true so they never
-- receive the seed; existing accounts without categories keep false and
-- get seeded on their next session (a friendly improvement, not a reset).

alter table public.profiles
  add column if not exists categories_seeded boolean not null default false;

-- Backfill: users who already have any category never get the seed.
update public.profiles p
set categories_seeded = true
where exists (
  select 1 from public.categories c
  where c.user_id = p.id
);
