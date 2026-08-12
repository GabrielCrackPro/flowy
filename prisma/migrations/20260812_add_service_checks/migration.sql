-- CreateTable
CREATE TABLE "service_checks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "component" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "latency_ms" INTEGER,
    "detail" TEXT,
    "checked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_checks_component_checked_at_idx" ON "service_checks"("component", "checked_at");
