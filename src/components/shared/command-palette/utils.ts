export const RECENT_KEY = "flowy-recent-searches";
export const MAX_RECENT = 5;

export function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecent(query: string) {
  const current = getRecent().filter((q) => q !== query);
  current.unshift(query);
  if (current.length > MAX_RECENT) current.length = MAX_RECENT;
  localStorage.setItem(RECENT_KEY, JSON.stringify(current));
}

export function deleteAllRecent() {
  localStorage.removeItem(RECENT_KEY);
}

export function escapeHighlight(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
