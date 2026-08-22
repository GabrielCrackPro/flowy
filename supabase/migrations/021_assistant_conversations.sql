-- Persisted assistant conversations, scoped to the active space.
create table if not exists public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  space_id uuid not null references public.spaces(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assistant_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.assistant_conversations(id) on delete cascade,
  role varchar(20) not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists assistant_conversations_user_updated_idx
  on public.assistant_conversations(user_id, updated_at desc);
create index if not exists assistant_conversations_space_updated_idx
  on public.assistant_conversations(space_id, updated_at desc);
create index if not exists assistant_conversation_messages_conversation_created_idx
  on public.assistant_conversation_messages(conversation_id, created_at);

alter table public.assistant_conversations enable row level security;
alter table public.assistant_conversation_messages enable row level security;

create policy "Users can read assistant conversations in their spaces"
  on public.assistant_conversations for select to authenticated
  using (user_id = auth.uid() and exists (
    select 1 from public.space_members m
    where m.space_id = assistant_conversations.space_id and m.user_id = auth.uid()
  ));

create policy "Users can manage their assistant conversations"
  on public.assistant_conversations for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (
    select 1 from public.space_members m
    where m.space_id = assistant_conversations.space_id and m.user_id = auth.uid()
  ));

create policy "Users can read their assistant messages"
  on public.assistant_conversation_messages for select to authenticated
  using (exists (
    select 1 from public.assistant_conversations c
    where c.id = assistant_conversation_messages.conversation_id and c.user_id = auth.uid()
  ));

create policy "Users can manage their assistant messages"
  on public.assistant_conversation_messages for all to authenticated
  using (exists (
    select 1 from public.assistant_conversations c
    where c.id = assistant_conversation_messages.conversation_id and c.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.assistant_conversations c
    where c.id = assistant_conversation_messages.conversation_id and c.user_id = auth.uid()
  ));
