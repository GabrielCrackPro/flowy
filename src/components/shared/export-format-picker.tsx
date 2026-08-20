"use client";

import { ChevronRight } from "lucide";
import {
  CONTROL_FOCUS,
  OPTION_ROW_BASE,
  OPTION_ROW_INTERACTION,
} from "@/components/ui/control-styles";
import { Download, FileText } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { BottomSheet } from "./bottom-sheet";
import { Icon } from "./icon";
import { LoadingIcon } from "./loading-icon";

export type ExportFormatOption = "csv" | "pdf";

interface ExportFormatPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (format: ExportFormatOption) => void;
  isBusy?: boolean;
  label: string;
  csvLabel: string;
  pdfLabel: string;
}

/** Mobile-friendly export format picker shared by all export menus. */
export function ExportFormatPicker({
  open,
  onOpenChange,
  onSelect,
  isBusy = false,
  label,
  csvLabel,
  pdfLabel,
}: ExportFormatPickerProps) {
  const options: {
    format: ExportFormatOption;
    label: string;
    extension: string;
    icon: typeof Download;
  }[] = [
    { format: "csv", label: csvLabel, extension: "CSV", icon: Download },
    { format: "pdf", label: pdfLabel, extension: "PDF", icon: FileText },
  ];

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={label}
      icon={<Icon icon={Download} className="size-5" />}
      metadata={
        <span className="inline-flex items-center gap-1.5">
          <span>CSV</span>
          <span aria-hidden="true">·</span>
          <span>PDF</span>
        </span>
      }
      contentClassName="px-4 py-3 sm:px-5"
    >
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.format}
            type="button"
            disabled={isBusy}
            aria-label={option.label}
            aria-busy={isBusy}
            onClick={() => {
              if (isBusy) return;
              onOpenChange(false);
              onSelect(option.format);
            }}
            className={cn(
              OPTION_ROW_BASE,
              "min-h-14 cursor-pointer rounded-xl border border-border/50 bg-card px-3 text-left font-medium text-foreground shadow-sm",
              OPTION_ROW_INTERACTION,
              CONTROL_FOCUS,
              "hover:border-primary/40 hover:bg-primary/5",
              "disabled:pointer-events-none disabled:opacity-60",
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/70 text-muted-foreground">
              <Icon icon={option.icon} className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">
              {option.label}
            </span>
            <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
              {option.extension}
            </span>
            <LoadingIcon
              icon={ChevronRight}
              loading={isBusy}
              size={16}
              className="shrink-0 text-muted-foreground/60"
            />
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
