"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui";
import { Download } from "lucide";
import { useState } from "react";
import {
  CONTROL_DISABLED,
  CONTROL_FOCUS,
  CONTROL_SURFACE,
} from "@/components/ui/control-styles";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Download as DlComponent, FileText as FtComponent } from "@/lib/icons";
import { cn } from "@/lib/utils";
import {
  type ExportFormatOption,
  ExportFormatPicker,
} from "./export-format-picker";
import { Icon } from "./icon";
import { LoadingIcon } from "./loading-icon";

interface ResponsiveExportSelectorProps {
  label: string;
  csvLabel: string;
  pdfLabel: string;
  disabled?: boolean;
  busy?: boolean;
  onSelect: (format: ExportFormatOption) => void;
}

/**
 * Responsive export control: a filter-style trigger on mobile with a global
 * bottom sheet, and a compact dropdown on desktop.
 */
export function ResponsiveExportSelector({
  label,
  csvLabel,
  pdfLabel,
  disabled = false,
  busy = false,
  onSelect,
}: ResponsiveExportSelectorProps) {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDisabled = disabled || busy;

  const trigger = (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={busy}
      aria-label={label}
      aria-haspopup={isMobile ? "dialog" : "menu"}
      title={label}
      onClick={isMobile ? () => setMobileOpen(true) : undefined}
      className={cn(
        "inline-flex size-10 shrink-0 touch-manipulation items-center justify-center text-xs font-medium sm:size-9",
        CONTROL_SURFACE,
        CONTROL_FOCUS,
        CONTROL_DISABLED,
        "text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground",
        "max-sm:border-border/50 max-sm:bg-secondary/80 max-sm:text-secondary-foreground max-sm:hover:border-border max-sm:hover:bg-secondary",
      )}
    >
      <LoadingIcon icon={Download} loading={busy} size={16} />
    </button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <ExportFormatPicker
          open={mobileOpen}
          onOpenChange={setMobileOpen}
          onSelect={onSelect}
          isBusy={busy}
          label={label}
          csvLabel={csvLabel}
          pdfLabel={pdfLabel}
        />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align="end" sideOffset={4} className="min-w-40">
        <DropdownMenuItem
          disabled={isDisabled}
          onClick={() => onSelect("csv")}
          className="min-h-9"
        >
          <Icon icon={DlComponent} className="size-3.5" />
          {csvLabel}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isDisabled}
          onClick={() => onSelect("pdf")}
          className="min-h-9"
        >
          <Icon icon={FtComponent} className="size-3.5" />
          {pdfLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
