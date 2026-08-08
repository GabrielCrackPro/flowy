-- Composite indexes for hot query paths.
-- Column order follows the leftmost-prefix rule: equality columns first,
-- range columns last (see Supabase Postgres best practices).

-- Transactions are listed and month-aggregated by space + date range
-- (TransactionService.list, BudgetService month rollups).
create index if not exists transactions_space_id_date_idx
  on transactions(space_id, date);

-- Budgets are filtered by space + month + year (BudgetService.list).
create index if not exists budgets_space_id_month_year_idx
  on budgets(space_id, month, year);

-- Entity history cleanup runs deleteMany on entity_type + entity_id for every
-- deleted transaction/budget/category/goal/subscription
-- (ActivityService.replaceEntityHistoryWithDeletion).
create index if not exists activities_entity_type_entity_id_idx
  on activities(entity_type, entity_id);
