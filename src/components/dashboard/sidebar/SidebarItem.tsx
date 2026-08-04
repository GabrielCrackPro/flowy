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
}

export function SidebarItem({
  path,
  label,
  icon: IconComponent,
  active = false,
  collapsed = false,
  onClick,
  badge,
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
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          collapsed
            ? "justify-center px-0 mx-auto h-10 w-10 hover:bg-muted/40"
            : "active:scale-[0.98]",
          active
            ? collapsed
              ? "bg-linear-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 ring-2 ring-primary/25"
              : "bg-linear-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/20"
            : "text-muted-foreground hover:bg-linear-to-r hover:from-muted/50 hover:to-muted/30 hover:text-foreground",
        )}
      >
        <motion.span
          className={cn(
            "absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full transition-all duration-200",
            active ? "bg-white/80 opacity-100" : "opacity-0",
            collapsed ? "hidden" : "",
          )}
          animate={{ opacity: active ? 1 : 0 }}
        />

        <motion.div
          whileHover={{ scale: collapsed ? 1.15 : 1.1, rotate: active ? 0 : 5 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex shrink-0 items-center justify-center transition-all duration-200",
            collapsed ? "h-8 w-8 rounded-lg" : "",
            collapsed && active ? "bg-white/10" : "",
          )}
        >
          <Icon
            icon={IconComponent}
            className={cn(
              "h-5 w-5 shrink-0 transition-all duration-200",
              !active && "text-muted-foreground group-hover:text-foreground",
            )}
          />
        </motion.div>

        <motion.div
          className={cn(
            "flex flex-1 items-center gap-2 overflow-hidden transition-all duration-200",
            collapsed ? "hidden" : "w-auto opacity-100 visible",
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: collapsed ? 0 : 1 }}
        >
          <span className="truncate font-medium">{label}</span>
          {hasBadge ? (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={cn(
                "inline-flex min-w-[1.25rem] h-5 items-center justify-center rounded-md px-1.5 text-[0.7rem] font-semibold tabular-nums shrink-0",
                active
                  ? "bg-white/20 text-white"
                  : "bg-gradient-to-r from-primary/20 to-primary/10 text-primary",
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
