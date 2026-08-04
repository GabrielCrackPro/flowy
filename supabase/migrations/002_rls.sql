-- Habilitar Row Level Security y políticas básicas para los usuarios

-- Profiles
alter table if exists profiles enable row level security;

create policy "Users can select their own profile" on profiles
  for select
  using (auth.uid() = id);

create policy "Users can insert their own profile" on profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can delete their own profile" on profiles
  for delete
  using (auth.uid() = id);

-- Categories
alter table if exists categories enable row level security;

create policy "Users can select their own categories" on categories
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own categories" on categories
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories" on categories
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own categories" on categories
  for delete
  using (auth.uid() = user_id);

-- Transactions
alter table if exists transactions enable row level security;

create policy "Users can select their own transactions" on transactions
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions" on transactions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions" on transactions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own transactions" on transactions
  for delete
  using (auth.uid() = user_id);

-- Budgets
alter table if exists budgets enable row level security;

create policy "Users can select their own budgets" on budgets
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own budgets" on budgets
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own budgets" on budgets
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own budgets" on budgets
  for delete
  using (auth.uid() = user_id);

-- Goals
alter table if exists goals enable row level security;

create policy "Users can select their own goals" on goals
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own goals" on goals
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own goals" on goals
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own goals" on goals
  for delete
  using (auth.uid() = user_id);

-- Subscriptions
alter table if exists subscriptions enable row level security;

create policy "Users can select their own subscriptions" on subscriptions
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subscriptions" on subscriptions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subscriptions" on subscriptions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own subscriptions" on subscriptions
  for delete
  using (auth.uid() = user_id);
