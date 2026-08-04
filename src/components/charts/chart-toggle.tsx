"use client";

import { Icon, type IconProps } from "@components/shared";
import { AnimatePresence, motion } from "framer-motion";
import { useId } from "react";
import { ChevronRight } from "@/lib/icons";
import { cn } from "@/lib/utils";

export interface ChartToggleOption<T extends string> {
  value: T;
  label: string;
  icon: IconProps["icon"];
}

interface ChartToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ChartToggleOption<T>[];
  groupIcon?: IconProps["icon"];
  collapsible?: boolean;
  collapsed?: boolean;
  onCollapseToggle?: () => void;
  labelHiddenUntil?: "sm" | "md";
  className?: string;
}

const labelHiddenClass = {
  sm: "hidden sm:inline",
  md: "hidden md:inline",
} as const;

export function ChartToggle<T extends string>({
  value,
  onChange,
  options,
  groupIcon,
  collapsible = false,
  collapsed = false,
  onCollapseToggle,
  labelHiddenUntil = "sm",
  className,
}: ChartToggleProps<T>) {
  const id = useId();
  const layoutId = `chart-toggle-${id}`;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-border/30 bg-card p-1 shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
        className,
      )}
    >
      {collapsible ? (
        <motion.button
          type="button"
          onClick={onCollapseToggle}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          aria-expanded={!collapsed}
          className="flex items-center gap-1.5 rounded-lg py-1.5 pr-1.5 pl-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
        >
          {groupIcon ? <Icon icon={groupIcon} className="size-3.5" /> : null}
          <motion.span
            animate={{ rotate: collapsed ? 0 : 90 }}
            transition={{ duration: 0.2 }}
            className="flex"
          >
            <Icon icon={ChevronRight} className="size-3" />
          </motion.span>
        </motion.button>
      ) : null}

      <AnimatePresence initial={false}>
        {!collapsible || !collapsed ? (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1 overflow-hidden"
          >
            {options.map((option) => {
              const active = value === option.value;
              const IconComponent = option.icon;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange(option.value)}
                  aria-pressed={active}
                  className="relative flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/40 hover:bg-muted/60"
                >
                  {active ? (
                    <motion.span
                      layoutId={layoutId}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 32,
                      }}
                      className="absolute inset-0 rounded-lg bg-primary shadow-sm shadow-primary/20"
                    />
                  ) : null}
                  <Icon
                    icon={IconComponent}
                    className={cn(
                      "relative z-10 size-3.5 shrink-0 transition-colors duration-200",
                      active
                        ? "text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "relative z-10 transition-colors duration-200",
                      labelHiddenClass[labelHiddenUntil],
                      active
                        ? "text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
