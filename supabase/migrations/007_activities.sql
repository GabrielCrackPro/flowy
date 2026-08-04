-- Activity log (user actions + replies to comments)
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  type varchar(50) not null,
  entity_type varchar(50),
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activities_user_id_created_at_idx
  on activities(user_id, created_at desc);
