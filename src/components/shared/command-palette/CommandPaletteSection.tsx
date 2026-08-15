"use client";

import { Command } from "cmdk";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconProps } from "../icon";

interface CommandPaletteSectionProps {
  icon: IconProps["icon"];
  label: string;
  children: ReactNode;
  footer?: ReactNode;
  divided?: boolean;
}

export function CommandPaletteSection({
  icon,
  label,
  children,
  footer,
  divided = false,
}: CommandPaletteSectionProps) {
  return (
    <section
      className={cn(
        divided && "border-t border-border/40 pt-1.5",
        "px-1.5 sm:px-2",
      )}
    >
      <div className="flex items-center gap-2 px-2 pb-1 pt-2.5 sm:pt-2">
        <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon icon={icon} className="size-3" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
          {label}
        </span>
      </div>
      <Command.Group>
        <div className="space-y-0.5">{children}</div>
      </Command.Group>
      {footer}
    </section>
  );
}
