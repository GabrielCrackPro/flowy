-- Add per-severity status preferences and push delivery health metadata.
ALTER TABLE "profiles"
  ADD COLUMN "status_alert_severities" TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE "push_subscriptions"
  ADD COLUMN "device_name" VARCHAR(80),
  ADD COLUMN "installation_type" VARCHAR(20),
  ADD COLUMN "last_seen_at" TIMESTAMPTZ,
  ADD COLUMN "last_delivery_at" TIMESTAMPTZ,
  ADD COLUMN "last_delivery_status" VARCHAR(20),
  ADD COLUMN "failure_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "last_failure_reason" TEXT;

CREATE TABLE "push_deliveries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "subscription_id" UUID,
  "type" VARCHAR(50) NOT NULL DEFAULT 'status',
  "component" VARCHAR(50),
  "severity" VARCHAR(20),
  "title" TEXT NOT NULL,
  "status" VARCHAR(20) NOT NULL,
  "error" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "push_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "push_deliveries_user_id_created_at_idx"
  ON "push_deliveries"("user_id", "created_at");

CREATE INDEX "push_deliveries_subscription_id_created_at_idx"
  ON "push_deliveries"("subscription_id", "created_at");

ALTER TABLE "push_deliveries"
  ADD CONSTRAINT "push_deliveries_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "push_deliveries"
  ADD CONSTRAINT "push_deliveries_subscription_id_fkey"
  FOREIGN KEY ("subscription_id") REFERENCES "push_subscriptions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
