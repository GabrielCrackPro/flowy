-- Persist sign-up preferences (currency + locale) into the profile.
-- The sign-up form passes them through auth user metadata; the trigger
-- copies them when the profile row is auto-created, falling back to the
-- same defaults as the profiles table (USD / es).
--
-- Values are clamped to the column widths (currency varchar(8),
-- locale varchar(10)): metadata is attacker-controlled, so an over-long
-- value must degrade to the default instead of failing the insert.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, currency, locale)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    coalesce(nullif(left(new.raw_user_meta_data->>'currency', 8), ''), 'USD'),
    coalesce(nullif(left(new.raw_user_meta_data->>'locale', 10), ''), 'es')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
