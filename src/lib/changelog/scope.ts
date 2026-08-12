/**
 * Scope badge colors shared by the changelog sheet and the About section.
 *
 * Scopes come from conventional commit messages (e.g. `feat(pwa): ...`) and
 * are rendered as small monospace badges. Unknown scopes fall back to a
 * neutral style.
 */
export const SCOPE_COLORS: Record<string, string> = {
  "api-docs":
    "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  subscriptions:
    "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  transactions:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  budgets:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  goals: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  auth: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  ui: "border-pink-500/30 bg-pink-500/10 text-pink-600 dark:text-pink-400",
  ci: "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

export function scopeColor(scope: string | null | undefined): string {
  if (!scope) return "";
  return (
    SCOPE_COLORS[scope] ?? "border-border/50 bg-muted/50 text-muted-foreground"
  );
}
