"use client";

import { Icon, type IconProps } from "@components/shared";
import { cn } from "@lib/utils";
import { motion } from "framer-motion";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid, Table2 } from "@/lib/icons";

export type ViewMode = "grid" | "table";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (view: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  const { t } = useTranslation();
  const id = useId();

  const options: {
    value: ViewMode;
    label: string;
    icon: IconProps["icon"];
  }[] = [
    { value: "grid", label: t("common.viewGrid"), icon: LayoutGrid },
    { value: "table", label: t("common.viewTable"), icon: Table2 },
  ];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-border/30 bg-card p-1 shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
        className,
      )}
    >
      {options.map((option) => {
        const active = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            aria-pressed={active}
            title={option.label}
            onClick={() => onChange(option.value)}
            className="relative flex size-8 cursor-pointer items-center justify-center rounded-lg outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {active ? (
              <motion.span
                layoutId={`view-toggle-indicator-${id}`}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-lg bg-primary shadow-md shadow-primary/20"
              />
            ) : null}
            <Icon
              icon={option.icon}
              className={cn(
                "relative z-10 size-4 transition-colors duration-200",
                active
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
