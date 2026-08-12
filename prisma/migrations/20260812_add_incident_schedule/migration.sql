-- AlterTable
ALTER TABLE "incidents" ADD COLUMN "type" VARCHAR(20) NOT NULL DEFAULT 'incident';
ALTER TABLE "incidents" ADD COLUMN "scheduled_start" TIMESTAMPTZ;
ALTER TABLE "incidents" ADD COLUMN "scheduled_end" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "incidents_type_status_idx" ON "incidents"("type", "status");
