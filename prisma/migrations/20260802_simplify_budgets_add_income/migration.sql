-- Migration: Simplify Budgets & Add Income Support
-- This migration:
-- 1. Removes the budget_categories junction table
-- 2. Adds direct category_id to budgets table (one-to-one relationship)
-- 3. Adds budget_id to transactions (for income assignment)

-- Step 1: Add category_id column to budgets table (nullable first)
ALTER TABLE "public"."budgets" 
ADD COLUMN IF NOT EXISTS "category_id" UUID;

-- Step 2: Migrate existing data from budget_categories to direct category relationship
-- For each budget, pick the first category from budget_categories as the primary category
UPDATE "public"."budgets" 
SET "category_id" = (
  SELECT "category_id" 
  FROM "public"."budget_categories" 
  WHERE "budget_categories"."budget_id" = "budgets"."id" 
  LIMIT 1
)
WHERE "category_id" IS NULL AND EXISTS (
  SELECT 1 FROM "public"."budget_categories" 
  WHERE "budget_categories"."budget_id" = "budgets"."id"
);

-- Step 3: Drop the junction table
DROP TABLE IF EXISTS "public"."budget_categories" CASCADE;

-- Step 4: Add foreign key constraint for category
ALTER TABLE "public"."budgets" 
ADD CONSTRAINT "budgets_category_id_fkey" 
FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Step 5: Make category_id NOT NULL (after data migration)
-- Note: This will fail if there are budgets without categories
-- You may need to handle those budgets separately
ALTER TABLE "public"."budgets" 
ALTER COLUMN "category_id" SET NOT NULL;

-- Step 6: Add budget_id column to transactions table
ALTER TABLE "public"."transactions" 
ADD COLUMN IF NOT EXISTS "budget_id" UUID;

-- Step 7: Add foreign key constraint for budget
ALTER TABLE "public"."transactions" 
ADD CONSTRAINT "transactions_budget_id_fkey" 
FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Step 8: Add index for budget_id in transactions
CREATE INDEX IF NOT EXISTS "transactions_budget_id_idx" ON "public"."transactions"("budget_id");

-- Step 9: Add index for category_id in budgets
CREATE INDEX IF NOT EXISTS "budgets_category_id_idx" ON "public"."budgets"("category_id");
