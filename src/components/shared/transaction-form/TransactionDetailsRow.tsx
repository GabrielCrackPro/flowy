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
      className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-muted/30 rounded-lg"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-muted-foreground/50">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground/90 font-medium">
            {label}
          </p>
          {hint ? (
            <p className="text-xs text-muted-foreground/50">{hint}</p>
          ) : null}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 justify-end">{children}</div>
    </motion.div>
  );
}
