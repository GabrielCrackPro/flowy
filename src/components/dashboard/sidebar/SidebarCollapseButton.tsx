"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import { PanelLeftClose, PanelLeftOpen } from "@/lib/icons";
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
  const { t } = useTranslation();

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
        onMouseLeave={() => setTooltipOpen(false)}
        onFocus={() => setTooltipOpen(true)}
        onBlur={() => setTooltipOpen(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl border outline-none transition duration-200 focus-visible:ring-3 focus-visible:ring-ring/50",
          collapsed ? "size-8" : "size-9",
          collapsed
            ? "border-border/40 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            : "border-border/40 bg-card/50 text-foreground/60 shadow-sm hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:shadow-md",
          className,
        )}
      >
        <Icon
          icon={collapsed ? PanelLeftOpen : PanelLeftClose}
          className="size-4 shrink-0"
        />
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
