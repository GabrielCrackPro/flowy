-- Auto-create a profile row AND a personal space (with owner membership and
-- active_space_id) when a new auth user signs up.
--
-- Previously only the profile was created by the trigger; the personal space
-- was created lazily by the app (ProfileService.ensure / SpaceService
-- .getCurrent), which left new users without an assigned active space until
-- something called those code paths. This makes the space creation atomic
-- with signup for every auth flow (email, OAuth, OTP).
--
-- Function + trigger redefinition mirrors the pattern from migrations
-- 003_profile_trigger.sql and 016_signup_preferences.sql.
--
-- NOTE: intentionally does NOT use pgcrypto (gen_random_bytes) — that
-- extension may live in a schema outside the function's search_path, which
-- made the trigger fail at signup. Join codes are derived from
-- gen_random_uuid(), which exists on every PostgreSQL 13+ without extensions.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_name text;
  v_space_id uuid;
  v_slug text;
  v_join_code text;
  v_personal_id uuid;
begin
  v_profile_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    split_part(new.email, '@', 1),
    'Mi espacio'
  );

  -- Profile (same insert as migration 016, name derivation aligned with the
  -- app's ensurePersonalSpace fallback).
  insert into public.profiles (id, email, name, currency, locale)
  values (
    new.id,
    new.email,
    v_profile_name,
    coalesce(nullif(left(new.raw_user_meta_data->>'currency', 8), ''), 'USD'),
    coalesce(nullif(left(new.raw_user_meta_data->>'locale', 10), ''), 'es')
  )
  on conflict (id) do nothing;

  -- Personal space, only if the user does not already have one (the app can
  -- create it in edge cases; never duplicate it).
  select id into v_personal_id
  from public.spaces
  where owner_id = new.id and is_personal = true
  limit 1;

  if v_personal_id is null then
    v_slug := lower(regexp_replace(regexp_replace(v_profile_name, '[^a-z0-9]+', '-', 'gi'), '^-|-$', '', 'g'));
    if v_slug = '' then
      v_slug := 'space';
    end if;
    v_slug := left(v_slug, 40) || '-' || floor(extract(epoch from now()) * 1000)::bigint;

    -- Join code: 6-char uppercase hex from a fresh UUID, collision-avoiding
    -- loop (no pgcrypto dependency).
    loop
      v_join_code := upper(left(replace(gen_random_uuid()::text, '-', ''), 6));
      exit when not exists (select 1 from public.spaces where join_code = v_join_code);
    end loop;

    insert into public.spaces (name, slug, join_code, owner_id, is_personal)
    values (v_profile_name, v_slug, v_join_code, new.id, true)
    returning id into v_space_id;

    insert into public.space_members (space_id, user_id, role)
    values (v_space_id, new.id, 'owner');

    update public.profiles
    set active_space_id = v_space_id
    where id = new.id and active_space_id is null;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
