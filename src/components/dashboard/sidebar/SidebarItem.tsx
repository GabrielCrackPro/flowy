"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon, type IconProps } from "@/components/shared";
import { cn } from "@/lib/utils";
import { SidebarTooltip } from "./SidebarTooltip";

interface SidebarItemProps {
  path: string;
  label: string;
  icon: IconProps["icon"];
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
  badge?: string | number;
  /** Shared-layout id for the sliding active pill; must be unique per mounted tree. */
  pillLayoutId?: string;
  /** Stagger delay (ms) for the label fade when the sidebar expands. */
  expandDelay?: number;
}

export function SidebarItem({
  path,
  label,
  icon: IconComponent,
  active = false,
  collapsed = false,
  onClick,
  badge,
  pillLayoutId = "sidebar-active-pill",
  expandDelay = 0,
}: SidebarItemProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    setTarget(linkRef.current);
  }, []);

  useEffect(() => {
    if (!collapsed) setTooltipOpen(false);
  }, [collapsed]);

  const hasBadge = badge !== undefined && badge !== null && badge !== "";

  return (
    <>
      <Link
        ref={linkRef}
        href={path}
        onClick={onClick}
        aria-label={collapsed ? label : undefined}
        aria-current={active ? "page" : undefined}
        onMouseEnter={() => {
          if (collapsed) setTooltipOpen(true);
        }}
        onMouseLeave={() => setTooltipOpen(false)}
        onFocus={() => {
          if (collapsed) setTooltipOpen(true);
        }}
        onBlur={() => setTooltipOpen(false)}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          collapsed
            ? "justify-center px-0 mx-auto size-10 hover:bg-muted/40"
            : "active:scale-[0.98]",
          active
            ? collapsed
              ? "bg-primary/10 text-primary ring-1 ring-inset ring-primary/15"
              : "text-foreground"
            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
        )}
      >
        {/* Sliding active pill (expanded) — glides between items on navigation */}
        {active && !collapsed ? (
          <motion.span
            layoutId={pillLayoutId}
            className="absolute inset-0 rounded-xl bg-primary/10 ring-1 ring-inset ring-primary/15"
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
        ) : null}

        {/* Left accent indicator */}
        <motion.span
          className={cn(
            "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary transition duration-200",
            collapsed ? "hidden" : "",
          )}
          initial={false}
          animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.5 }}
        />

        <motion.div
          whileHover={{ scale: collapsed ? 1.15 : 1.08 }}
          transition={{ duration: 0.2 }}
          className="flex shrink-0 items-center justify-center rounded-lg transition duration-200"
        >
          <Icon
            icon={IconComponent}
            className={cn(
              "size-5 shrink-0 transition duration-200 group-hover:scale-105",
              active
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground",
            )}
          />
        </motion.div>

        <motion.div
          className="flex min-w-0 items-center gap-2 overflow-hidden"
          initial={false}
          animate={{
            opacity: collapsed ? 0 : 1,
            x: collapsed ? -8 : 0,
            width: collapsed ? 0 : "auto",
          }}
          transition={{
            duration: 0.25,
            ease: [0.16, 1, 0.3, 1],
            delay: collapsed ? 0 : expandDelay / 1000,
          }}
        >
          <span
            className={cn(
              "truncate font-medium transition-transform duration-200 group-hover:translate-x-0.5",
              active && "font-semibold",
            )}
          >
            {label}
          </span>
          {hasBadge ? (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={cn(
                "inline-flex min-w-[1.25rem] h-5 items-center justify-center rounded-md px-1.5 text-[0.7rem] font-semibold tabular-nums shrink-0",
                active
                  ? "bg-primary/15 text-primary"
                  : "bg-muted/60 text-muted-foreground",
              )}
            >
              {badge}
            </motion.span>
          ) : null}
        </motion.div>

        {collapsed && hasBadge ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-5 min-w-[1.1rem] items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary/80 px-1 text-[0.65rem] font-semibold text-primary-foreground shadow-md ring-2 ring-background"
          >
            {badge}
          </motion.span>
        ) : null}
      </Link>

      <SidebarTooltip
        target={collapsed ? target : null}
        open={tooltipOpen}
        label={
          <>
            <span>{label}</span>
            {hasBadge ? (
              <span className="inline-flex min-w-4 items-center justify-center rounded bg-primary/15 px-1 py-px text-[0.65rem] font-semibold tabular-nums text-primary">
                {badge}
              </span>
            ) : null}
          </>
        }
      />
    </>
  );
}
