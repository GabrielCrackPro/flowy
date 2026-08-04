import { Card, CardContent } from "@components/ui";
import { Icon } from "@/components/shared";
import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "@/lib/icons";

interface TransactionCardProps {
  label: string;
  value: string;
  type: "positive" | "negative";
}

export function TransactionCard({ label, value, type }: TransactionCardProps) {
  const gradientBg =
    type === "positive"
      ? "from-emerald-500/15 via-emerald-500/8 to-emerald-500/3"
      : "from-rose-500/15 via-rose-500/8 to-rose-500/3";

  const gradientBorder =
    type === "positive"
      ? "from-emerald-500/40 via-emerald-500/20 to-transparent"
      : "from-rose-500/40 via-rose-500/20 to-transparent";

  const iconBg =
    type === "positive"
      ? "bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400"
      : "bg-rose-500/20 text-rose-600 dark:bg-rose-500/30 dark:text-rose-400";

  const IconComponent = type === "positive" ? ArrowUpRight : ArrowDownRight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -2 }}
    >
      <Card className="relative overflow-hidden rounded-2xl border border-border/30 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-300 group">
        {/* Background gradient */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-60",
            gradientBg,
          )}
        />

        {/* Top gradient border */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r",
            gradientBorder,
          )}
        />

        <CardContent className="relative flex flex-col gap-2 p-6">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
              {label}
            </span>
            <motion.div
              className={cn(
                "flex size-8 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                iconBg,
              )}
            >
              <Icon icon={IconComponent} className="size-4" />
            </motion.div>
          </div>

          <motion.span
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={cn(
              "text-2xl font-bold leading-none tracking-tight tabular-nums sm:text-3xl",
              type === "positive"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400",
            )}
          >
            {value}
          </motion.span>
        </CardContent>
      </Card>
    </motion.div>
  );
}
