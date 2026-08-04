-- Comments (polymorphic: attach to transactions, goals, budgets, subscriptions)
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  entity_type varchar(50) not null,
  entity_id uuid not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists comments_user_id_idx on comments(user_id);
create index if not exists comments_entity_idx on comments(entity_type, entity_id);
