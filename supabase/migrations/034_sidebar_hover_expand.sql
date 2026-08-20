-- Add sidebarHoverExpand preference to profiles
ALTER TABLE profiles
ADD COLUMN sidebar_hover_expand BOOLEAN NOT NULL DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN profiles.sidebar_hover_expand IS 'Whether sidebar expands on hover when collapsed';
