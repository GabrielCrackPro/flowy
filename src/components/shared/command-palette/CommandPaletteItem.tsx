"use client";

import { Command } from "cmdk";
import type { ReactNode } from "react";
import { ChevronRight } from "@/lib/icons";
import { Icon, type IconProps } from "../icon";

interface CommandPaletteItemProps {
  value: string;
  onSelect?: () => void;
  icon: IconProps["icon"];
  label: ReactNode;
  right?: ReactNode;
  showChevron?: boolean;
}

export function CommandPaletteItem({
  value,
  onSelect,
  icon: IconComponent,
  label,
  right,
  showChevron = false,
}: CommandPaletteItemProps) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm outline-none transition-colors data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
    >
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground transition-colors group-data-[selected=true]:bg-accent-foreground/10 group-data-[selected=true]:text-accent-foreground">
        <Icon icon={IconComponent} className="size-4" />
      </span>

      <div className="min-w-0 flex-1">{label}</div>

      {right}

      {showChevron ? (
        <Icon
          icon={ChevronRight}
          className="size-3.5 shrink-0 text-muted-foreground/30 transition-transform group-data-[selected=true]:translate-x-0.5 group-data-[selected=true]:text-accent-foreground/50"
        />
      ) : null}
    </Command.Item>
  );
}
