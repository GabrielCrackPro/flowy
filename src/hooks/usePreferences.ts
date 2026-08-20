"use client";

import { useCallback, useMemo, useState } from "react";
import type { ProfilePreferences } from "@/types/ProfilePreferences";
import { DEFAULT_PREFERENCES } from "@/types/ProfilePreferences";
import { useProfile } from "./useProfile";

type PreferenceKey = keyof ProfilePreferences;

export interface UsePreferencesReturn {
  /** Current preferences (falls back to defaults if profile is loading). */
  preferences: ProfilePreferences;
  /** Update one or more preference fields and persist to the database. */
  updatePreferences: (values: Partial<ProfilePreferences>) => Promise<void>;
  /** Whether a preference update is in flight. */
  saving: boolean;
  /** Read a single preference by key. */
  get: <K extends PreferenceKey>(key: K) => ProfilePreferences[K];
}

/**
 * Typed hook for reading and writing the consolidated profile preferences.
 *
 * Usage:
 * ```tsx
 * const { preferences, updatePreferences, saving, get } = usePreferences();
 *
 * // Read a single value
 * const isExpanded = get("sidebarHoverExpand");
 *
 * // Update one or more fields
 * await updatePreferences({ sidebarHoverExpand: false });
 * ```
 */
export function usePreferences(): UsePreferencesReturn {
  const { profile, update } = useProfile();
  const [saving, setSaving] = useState(false);

  const preferences = useMemo<ProfilePreferences>(
    () => ({
      ...DEFAULT_PREFERENCES,
      ...(profile?.preferences ?? {}),
    }),
    [profile?.preferences],
  );

  const get = useCallback(
    <K extends PreferenceKey>(key: K): ProfilePreferences[K] =>
      preferences[key],
    [preferences],
  );

  const updatePreferences = useCallback(
    async (values: Partial<ProfilePreferences>) => {
      setSaving(true);
      try {
        await update({
          preferences: {
            ...preferences,
            ...values,
          },
        });
      } finally {
        setSaving(false);
      }
    },
    [update, preferences],
  );

  return { preferences, updatePreferences, saving, get };
}
