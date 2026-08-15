import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface TransactionDetailsRowProps {
  icon: ReactNode;
  label: string;
  hint?: string;
  children: ReactNode;
}

export function TransactionDetailsRow({
  icon,
  label,
  hint,
  children,
}: TransactionDetailsRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground/70 ring-1 ring-inset ring-border/20">
          {icon}
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-medium text-foreground/85">{label}</p>
          {hint ? (
            <p className="text-xs text-muted-foreground/50">{hint}</p>
          ) : null}
        </div>
      </div>
      <div className="flex min-w-0 max-w-[62%] flex-1 justify-end pt-0.5">
        {children}
      </div>
    </motion.div>
  );
}
