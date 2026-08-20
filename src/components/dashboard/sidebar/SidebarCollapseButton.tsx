"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide";
import { MorphIcon } from "morphicons/react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn, isMacPlatform } from "@/lib/utils";
import { SidebarTooltip } from "./SidebarTooltip";

const TOOLTIP_ID = "sidebar-collapse-tooltip";

interface SidebarCollapseButtonProps {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export function SidebarCollapseButton({
  collapsed,
  onToggle,
  className,
}: SidebarCollapseButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setTarget(buttonRef.current);
  }, []);

  const isMac = isMacPlatform();
  const label = collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar");
  const shortcut = isMac ? "⌘B" : "Ctrl B";

  return (
    <>
      <motion.button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={!collapsed}
        aria-controls="sidebar"
        aria-describedby={tooltipOpen ? TOOLTIP_ID : undefined}
        onClick={() => {
          // Touch devices never fire mouseleave, so dismiss the tooltip on click.
          setTooltipOpen(false);
          onToggle();
        }}
        onMouseEnter={() => setTooltipOpen(true)}
        onMouseLeave={() => {
          setTooltipOpen(false);
          setIsPressed(false);
        }}
        onFocus={() => setTooltipOpen(true)}
        onBlur={() => setTooltipOpen(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
        className={cn(
          "group relative flex shrink-0 items-center justify-center rounded-xl border outline-none transition-all duration-300 focus-visible:ring-3 focus-visible:ring-ring/50",
          collapsed ? "size-8" : "size-9",
          // Base state
          "border-border/40 bg-muted/20 text-muted-foreground",
          // Hover state - subtle glow effect
          "hover:border-primary/40 hover:bg-primary/8 hover:text-primary hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.2)]",
          // Active/pressed state
          isPressed && "scale-95 bg-primary/12 border-primary/50",
          className,
        )}
      >
        {/* Subtle background glow on hover */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/0 to-primary/0 transition-all duration-300 group-hover:from-primary/5 group-hover:to-primary/0" />

        <MorphIcon
          icon={collapsed ? PanelLeftOpen : PanelLeftClose}
          size={16}
          reducedMotion="user"
          className="relative z-10"
        />

        {/* Tooltip hint for keyboard shortcut */}
        {!collapsed && (
          <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded border border-border/30 bg-background/80 px-0.5 py-px text-[0.5rem] font-medium tabular-nums text-muted-foreground/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {isMac ? "⌘" : "⌃"}
          </span>
        )}
      </motion.button>

      <SidebarTooltip
        id={TOOLTIP_ID}
        target={target}
        open={tooltipOpen}
        label={
          <span className="flex items-center gap-1.5">
            {label}
            <span className="inline-flex items-center rounded border border-border/40 bg-background px-1 py-px text-[0.62rem] font-medium tabular-nums text-muted-foreground">
              {shortcut}
            </span>
          </span>
        }
      />
    </>
  );
}
