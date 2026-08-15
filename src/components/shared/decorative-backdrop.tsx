import { cn } from "@/lib/utils";

interface DecorativeBackdropProps {
  /** Accent tint applied to the gradient wash. */
  tint?: "primary" | "destructive";
  className?: string;
}

/**
 * Decorative full-bleed backdrop shared by full-page states (error, not
 * found): a soft corner-to-corner gradient wash plus a subtle dot pattern.
 * Renders absolutely within a positioned, overflow-hidden parent.
 */
export function DecorativeBackdrop({
  tint = "primary",
  className,
}: DecorativeBackdropProps) {
  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-linear-to-br via-transparent",
          tint === "primary"
            ? "from-primary/5 to-primary/5"
            : "from-destructive/5 to-destructive/5",
          className,
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--border)/0.3) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
    </>
  );
}
