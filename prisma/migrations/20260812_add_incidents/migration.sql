-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "message" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "component" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incidents_status_created_at_idx" ON "incidents"("status", "created_at");

-- CreateTable
CREATE TABLE "incident_updates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "incident_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incident_updates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "incident_updates_incident_id_created_at_idx" ON "incident_updates"("incident_id", "created_at");

-- AddForeignKey
ALTER TABLE "incident_updates" ADD CONSTRAINT "incident_updates_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
