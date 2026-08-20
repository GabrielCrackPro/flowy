-- Onboarding wizard completion timestamp.
--
-- Tracks when a user finished (or dismissed) the onboarding flow.
-- The column is nullable: null means onboarding has not been completed yet.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
