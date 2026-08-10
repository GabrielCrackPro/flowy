// Tracks which changelog version the user has already seen, so the
// "What's new" sheet only auto-opens once per release.
const LAST_SEEN_KEY = "flowy-last-seen-changelog";

export function getLastSeenChangelogVersion(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LAST_SEEN_KEY);
  } catch {
    return null;
  }
}

export function setLastSeenChangelogVersion(version: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_SEEN_KEY, version);
  } catch {
    // Storage can be unavailable (private mode, quota) — never block the UI.
  }
}
