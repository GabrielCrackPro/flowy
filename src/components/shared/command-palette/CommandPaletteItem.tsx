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
      className="group flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm outline-none transition-colors data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground sm:min-h-10 sm:rounded-lg sm:px-2"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors group-data-[selected=true]:bg-primary/15 group-data-[selected=true]:text-primary sm:size-7">
        <Icon icon={IconComponent} className="size-4" />
      </span>

      <div className="min-w-0 flex-1">{label}</div>

      {right}

      {showChevron ? (
        <Icon
          icon={ChevronRight}
          className="size-4 shrink-0 text-muted-foreground/40 transition-transform group-data-[selected=true]:translate-x-0.5 group-data-[selected=true]:text-primary/70"
        />
      ) : null}
    </Command.Item>
  );
}
