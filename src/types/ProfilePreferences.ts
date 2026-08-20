/**
 * Consolidated user preferences stored as a JSON column in the profiles table.
 * Adding new preferences only requires updating this type and the default —
 * no schema migration needed.
 */
export interface ProfilePreferences {
  /** Show the language switcher in the app header. */
  showLanguageSelector: boolean;
  /** Expand sidebar on hover when collapsed. */
  sidebarHoverExpand: boolean;
  /** Enable status page alert notifications. */
  statusAlertsEnabled: boolean;
  /** Which status components to alert on. Empty = all. */
  statusAlertComponents: string[];
  /** Which severity levels to alert on. Empty = all. */
  statusAlertSeverities: string[];
}

export const DEFAULT_PREFERENCES: ProfilePreferences = {
  showLanguageSelector: true,
  sidebarHoverExpand: true,
  statusAlertsEnabled: true,
  statusAlertComponents: [],
  statusAlertSeverities: [],
};
