import { cn } from "@lib/utils";
import { motion } from "framer-motion";

interface FilterButtonProps
  extends Omit<
    React.ComponentPropsWithoutRef<"button">,
    | "onAnimationEnd"
    | "onAnimationStart"
    | "onDrag"
    | "onDragEnd"
    | "onDragStart"
  > {
  active: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FilterButton({
  active,
  children,
  className,
  ...props
}: FilterButtonProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-xl border px-3.5 text-xs font-medium whitespace-nowrap transition-all duration-200 shadow-sm",
        active
          ? "border-primary/40 bg-gradient-to-r from-primary/12 to-primary/6 text-foreground shadow-md"
          : "border-border/30 bg-card text-muted-foreground hover:border-border/50 hover:bg-gradient-to-r hover:from-muted/50 hover:to-muted/30 hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
