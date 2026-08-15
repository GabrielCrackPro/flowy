"use client";

import { ResponsiveExportSelector, toast } from "@components/shared";
import { exportCSV, exportPDF } from "@lib/export-transactions";
import { useCallback, useRef, useState } from "react";
import { loadFlowyLogoDataUrl } from "@/lib/export-documents";
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
 * Export generation defers one frame so the pending spinner paints before
 * document work begins, disables re-entry while running, and reports
 * success/error via toast — no more silent clicks or double-exports.
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
      window.setTimeout(async () => {
        try {
          const logoDataUrl =
            format === "pdf" ? await loadFlowyLogoDataUrl() : null;
          if (format === "csv") {
            exportCSV(transactions, t, locale, currency);
          } else {
            await exportPDF(transactions, t, locale, currency, logoDataUrl);
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

  const label = t("transactions.export");
  const csvLabel = t("transactions.exportCSV");
  const pdfLabel = t("transactions.exportPDF");

  return (
    <ResponsiveExportSelector
      label={label}
      csvLabel={csvLabel}
      pdfLabel={pdfLabel}
      busy={isBusy}
      onSelect={handleExport}
    />
  );
}
