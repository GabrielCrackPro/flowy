"use client";

import { Button } from "@components/ui";
import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import { Filter } from "@/lib/icons";
import { Icon } from "../icon";

interface FiltersToggleButtonProps {
  open: boolean;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
  label: string;
  onClick: () => void;
}

export function FiltersToggleButton({
  open,
  hasActiveFilters,
  activeFiltersCount,
  label,
  onClick,
}: FiltersToggleButtonProps) {
  return (
    <Button
      variant={open ? "secondary" : hasActiveFilters ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 gap-1.5 rounded-xl transition-all duration-150",
        open && "ring-1 ring-primary/20",
      )}
    >
      <motion.span
        animate={{
          rotate: open ? 180 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className="flex"
      >
        <Icon icon={Filter} className="size-4" />
      </motion.span>

      <span className="text-xs font-medium">{label}</span>

      {hasActiveFilters && (
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
          {activeFiltersCount}
        </span>
      )}
    </Button>
  );
}
