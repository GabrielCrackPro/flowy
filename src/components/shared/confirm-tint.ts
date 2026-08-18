/**
 * Shared "primary confirm" color tints.
 *
 * The `AlertDialogAction` primitive bakes in the canonical *destructive*
 * gradient, so every non-destructive confirm has to override it. These tints
 * centralize that override (gradient + hover + shadow + focus ring) so confirm
 * buttons share one source of truth instead of assembling Tailwind class
 * strings — and the destructive hover/ring never leak through a colorized
 * button.
 */

export type ConfirmTint = "primary" | "amber" | "emerald";

interface ConfirmTintStyle {
  /** Raw `from-* to-*` gradient stops for non-button surfaces (progress bars, pills). */
  gradient: string;
  /** Full className override for an `AlertDialogAction` confirm button. */
  action: string;
}

export const CONFIRM_TINTS: Record<ConfirmTint, ConfirmTintStyle> = {
  primary: {
    gradient: "from-primary to-primary/90",
    action:
      "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/20 hover:from-primary/90 hover:to-primary/80 hover:shadow-lg focus-visible:ring-primary/50",
  },
  amber: {
    gradient: "from-amber-500 to-amber-600",
    action:
      "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 hover:from-amber-500/90 hover:to-amber-600/80 hover:shadow-lg focus-visible:ring-amber-500/50",
  },
  emerald: {
    gradient: "from-emerald-500 to-emerald-600",
    action:
      "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500/90 hover:to-emerald-600/80 hover:shadow-lg focus-visible:ring-emerald-500/50",
  },
};
