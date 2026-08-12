-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "push_preferences" TEXT[] NOT NULL DEFAULT '{}';
