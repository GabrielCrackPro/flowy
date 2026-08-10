"use client";

import { Icon, toast } from "@components/shared";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui";
import { exportCSV, exportPDF } from "@lib/export-transactions";
import { useCallback, useRef, useState } from "react";
import { Download, FileText, Loader2 } from "@/lib/icons";
import type { Transaction } from "@/types/Transaction";

type ExportFormat = "csv" | "pdf";

type Translate = (key: string) => string;

interface TransactionExportMenuProps {
  transactions: Transaction[];
  locale: string;
  currency: string;
  t: Translate;
}

/**
 * Shared export dropdown (CSV / PDF) for the transactions surface.
 * CSV/PDF generation is synchronous, so the click defers the export one
 * frame to let the pending spinner paint, disables re-entry while running,
 * and reports success/error via toast — no more silent "nothing happened"
 * clicks or double-exports.
 */
export function TransactionExportMenu({
  transactions,
  locale,
  currency,
  t,
}: TransactionExportMenuProps) {
  const [isBusy, setIsBusy] = useState(false);
  const busyRef = useRef(false);

  const handleExport = useCallback(
    (format: ExportFormat) => {
      if (busyRef.current || transactions.length === 0) return;
      busyRef.current = true;
      setIsBusy(true);

      // Yield to the browser so the pending state paints before the
      // synchronous CSV/PDF generation blocks the main thread.
      window.setTimeout(() => {
        try {
          if (format === "csv") {
            exportCSV(transactions, t, locale, currency);
          } else {
            exportPDF(transactions, t, locale, currency);
          }
          toast.success(t("transactions.exportSuccess"));
        } catch {
          toast.error(t("transactions.exportError"));
        } finally {
          busyRef.current = false;
          setIsBusy(false);
        }
      }, 30);
    },
    [transactions, locale, currency, t],
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            disabled={isBusy}
            aria-busy={isBusy}
            aria-label={t("transactions.export")}
            className="size-7 rounded-lg text-muted-foreground/40 hover:bg-muted/60 hover:text-foreground"
          >
            <Icon
              icon={isBusy ? Loader2 : Download}
              className={`size-3.5 ${isBusy ? "animate-spin" : ""}`}
            />
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={4} className="min-w-40">
        <DropdownMenuItem disabled={isBusy} onClick={() => handleExport("csv")}>
          <Icon icon={Download} className="size-3.5" />
          {t("transactions.exportCSV")}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isBusy} onClick={() => handleExport("pdf")}>
          <Icon icon={FileText} className="size-3.5" />
          {t("transactions.exportPDF")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
