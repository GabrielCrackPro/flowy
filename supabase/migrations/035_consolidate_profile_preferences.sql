-- Consolidate profile preferences into a single JSON column
-- This migration:
-- 1. Adds the new preferences JSON column with defaults
-- 2. Migrates data from individual columns
-- 3. Drops the old columns

-- Step 1: Add the new preferences column
ALTER TABLE profiles
ADD COLUMN preferences JSONB NOT NULL DEFAULT '{}';

-- Step 2: Migrate existing data into the preferences JSON column
UPDATE profiles
SET preferences = jsonb_build_object(
  'showLanguageSelector', show_language_selector,
  'sidebarHoverExpand', sidebar_hover_expand,
  'statusAlertsEnabled', status_alerts_enabled,
  'statusAlertComponents', COALESCE(
    CASE 
      WHEN status_alert_components = '{}' THEN '[]'::jsonb
      ELSE to_jsonb(status_alert_components)
    END,
    '[]'::jsonb
  ),
  'statusAlertSeverities', COALESCE(
    CASE 
      WHEN status_alert_severities = '{}' THEN '[]'::jsonb
      ELSE to_jsonb(status_alert_severities)
    END,
    '[]'::jsonb
  )
);

-- Step 3: Drop the old columns
ALTER TABLE profiles
DROP COLUMN show_language_selector,
DROP COLUMN sidebar_hover_expand,
DROP COLUMN status_alerts_enabled,
DROP COLUMN status_alert_components,
DROP COLUMN status_alert_severities;

-- Step 4: Add comment for clarity
COMMENT ON COLUMN profiles.preferences IS 'Consolidated user preferences (UI settings, alerts, etc.)';
