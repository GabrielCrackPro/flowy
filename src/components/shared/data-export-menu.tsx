"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  downloadCSV,
  downloadPDF,
  type ExportColumn,
  type ExportFormat,
  type ExportTotal,
  loadFlowyLogoDataUrl,
} from "@/lib/export-documents";
import { ResponsiveExportSelector } from "./responsive-export-selector";
import { toast } from "./toast";

interface DataExportMenuProps<T> {
  data: T[];
  columns: ExportColumn<T>[];
  totals?: ExportTotal[];
  title: string;
  subtitle?: string;
  summaryLabel?: string;
  filenamePrefix: string;
  locale: string;
}

export function DataExportMenu<T>({
  data,
  columns,
  title,
  subtitle,
  summaryLabel,
  filenamePrefix,
  locale,
  totals,
}: DataExportMenuProps<T>) {
  const { t } = useTranslation();
  const filename = `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}`;
  const [isBusy, setIsBusy] = useState(false);
  const busyRef = useRef(false);

  const handleExport = useCallback(
    (format: ExportFormat) => {
      if (busyRef.current || data.length === 0) return;

      busyRef.current = true;
      setIsBusy(true);

      window.setTimeout(async () => {
        try {
          const logoDataUrl =
            format === "pdf" ? await loadFlowyLogoDataUrl() : null;
          const config = {
            title,
            subtitle,
            summaryLabel,
            totals,
            logoDataUrl,
            filename,
            locale,
            data,
            columns,
            date: new Intl.DateTimeFormat(locale, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date()),
          };

          if (format === "pdf") {
            await downloadPDF(config);
          } else {
            downloadCSV(config);
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
    [columns, data, filename, locale, subtitle, summaryLabel, t, title, totals],
  );

  return (
    <ResponsiveExportSelector
      label={t("transactions.export")}
      csvLabel={t("transactions.exportCSV")}
      pdfLabel={t("transactions.exportPDF")}
      disabled={data.length === 0}
      busy={isBusy}
      onSelect={handleExport}
    />
  );
}
