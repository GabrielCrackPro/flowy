import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn<T> {
  key: string;
  header: string;
  render: (row: T) => string;
}

export interface ExportTotal {
  label: string;
  value: string;
}

export interface ExportConfig<T> {
  title: string;
  subtitle?: string;
  summaryLabel?: string;
  filename: string;
  columns: ExportColumn<T>[];
  data: T[];
  totals?: ExportTotal[];
  logoDataUrl?: string | null;
  locale: string;
  date?: string;
}

const CSV_BOM = "\ufeff";

const PDF_COLORS = {
  ink: [15, 23, 42] as const,
  primary: [37, 99, 235] as const,
  primaryLight: [239, 246, 255] as const,
  muted: [100, 116, 139] as const,
  border: [226, 232, 240] as const,
  surface: [248, 250, 252] as const,
};

function toCSV(rows: string[][]): string {
  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type ExportFormat = "csv" | "pdf";

let flowyLogoDataUrlPromise: Promise<string | null> | null = null;

async function rasterizeLogo(path: string): Promise<string | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  try {
    const response = await fetch(path, { cache: "force-cache" });
    if (!response.ok) return null;

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      return await new Promise<string | null>((resolve) => {
        const image = new Image();
        image.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 512;
            canvas.height = 512;
            const context = canvas.getContext("2d");
            if (!context) {
              resolve(null);
              return;
            }
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/png"));
          } catch {
            resolve(null);
          }
        };
        image.onerror = () => resolve(null);
        image.src = objectUrl;
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

/** Loads the high-resolution Flowy app icon once and rasterizes it for jsPDF. */
export function loadFlowyLogoDataUrl(): Promise<string | null> {
  if (!flowyLogoDataUrlPromise) {
    flowyLogoDataUrlPromise = rasterizeLogo("/icons/icon-512.png")
      .then((logo) => logo ?? rasterizeLogo("/app-icon.svg"))
      .catch(() => null);
  }
  return flowyLogoDataUrlPromise;
}

export function renderRows<T>(config: ExportConfig<T>): string[][] {
  return config.data.map((row) => config.columns.map((col) => col.render(row)));
}

/**
 * Creates a spreadsheet-friendly report: branded metadata first, the data
 * table in the middle, and the same summary totals used by the PDF export.
 */
export function generateCSV<T>(config: ExportConfig<T>): string {
  const headers = config.columns.map((column) => column.header);
  const rows = renderRows(config);
  const reportRows: string[][] = [["Flowy", config.title]];

  if (config.subtitle) reportRows.push([config.subtitle]);
  if (config.date) reportRows.push([config.date]);

  reportRows.push([], headers, ...rows);

  if (config.totals && config.totals.length > 0) {
    reportRows.push([]);
    if (config.summaryLabel) reportRows.push([config.summaryLabel]);
    reportRows.push(
      ...config.totals.map((total) => [total.label, total.value]),
    );
  }

  return `${CSV_BOM}${toCSV(reportRows)}`;
}

export function downloadCSV<T>(config: ExportConfig<T>) {
  const csv = generateCSV(config);
  downloadBlob(csv, `${config.filename}.csv`, "text/csv;charset=utf-8;");
}

function drawBrandHeader(
  doc: jsPDF,
  title: string,
  reportLabel: string | undefined,
  logoDataUrl: string | null | undefined,
  margin: number,
  width: number,
) {
  // Keep the header white and low-ink so it remains clear on office printers
  // and photocopies while retaining Flowy's blue accent.
  const headerHeight = 34;
  const leftX = margin + 8;
  const rightX = margin + width - 8;
  const logoSize = 18;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", leftX, margin + 6, logoSize, logoSize);
  } else {
    // An outlined fallback is intentionally printer-friendly too.
    doc.setDrawColor(...PDF_COLORS.primary);
    doc.setLineWidth(0.8);
    doc.roundedRect(leftX, margin + 6, logoSize, logoSize, 3, 3, "S");
    doc.setTextColor(...PDF_COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("F", leftX + 6.5, margin + 19);
  }

  doc.setTextColor(...PDF_COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Flowy", leftX + logoSize + 7, margin + 15);

  if (reportLabel) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(reportLabel, leftX + logoSize + 7, margin + 25);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF_COLORS.ink);
  const titleLines = doc.splitTextToSize(title, 82).slice(0, 2);
  doc.text(titleLines, rightX, margin + 16, { align: "right" });

  doc.setDrawColor(...PDF_COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(
    margin,
    margin + headerHeight,
    margin + width,
    margin + headerHeight,
  );

  return margin + headerHeight + 10;
}

function drawSummaryCards(
  doc: jsPDF,
  totals: ExportTotal[],
  summaryLabel: string | undefined,
  margin: number,
  pageWidth: number,
  startY: number,
) {
  if (totals.length === 0) return startY;

  let y = startY;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.ink);
  if (summaryLabel) {
    doc.text(summaryLabel, margin, y);
    y += 7;
  }

  const gap = 4;
  const cardCount = Math.min(totals.length, 4);
  const cardWidth =
    (pageWidth - margin * 2 - gap * (cardCount - 1)) / cardCount;
  const cardHeight = 27;

  totals.forEach((total, index) => {
    const column = index % cardCount;
    const row = Math.floor(index / cardCount);
    const x = margin + column * (cardWidth + gap);
    const cardY = y + row * (cardHeight + gap);

    doc.setFillColor(...PDF_COLORS.surface);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, "FD");

    doc.setFillColor(...PDF_COLORS.primary);
    doc.roundedRect(x, cardY, 2, cardHeight, 1, 1, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_COLORS.muted);
    const label = doc.splitTextToSize(total.label, cardWidth - 10);
    doc.text(label, x + 7, cardY + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(cardWidth < 45 ? 8.5 : 10);
    doc.setTextColor(...PDF_COLORS.ink);
    doc.text(total.value, x + 7, cardY + 20);
  });

  const rows = Math.ceil(totals.length / cardCount);
  return y + rows * cardHeight + (rows - 1) * gap + 8;
}

function drawFooters(doc: jsPDF, locale: string, date: string | undefined) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 14;
  const footerDate =
    date ??
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(`Flowy · ${footerDate}`, margin, pageHeight - 10);
    doc.text(`${page} / ${pageCount}`, pageWidth - margin, pageHeight - 10, {
      align: "right",
    });
  }
}

export function generatePDF<T>(config: ExportConfig<T>): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  doc.setProperties({
    title: config.title,
    subject: config.subtitle ?? config.title,
    author: "Flowy",
    creator: "Flowy",
  });

  let y = drawBrandHeader(
    doc,
    config.title,
    config.summaryLabel,
    config.logoDataUrl,
    margin,
    contentWidth,
  );

  if (config.subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(doc.splitTextToSize(config.subtitle, contentWidth), margin, y);
    y += 8;
  }

  if (config.date) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(config.date, margin, y);
    y += 7;
  }

  y += 2;
  y = drawSummaryCards(
    doc,
    config.totals ?? [],
    config.summaryLabel,
    margin,
    pageWidth,
    y,
  );

  const headers = config.columns.map((column) => column.header);
  const rows = renderRows(config);
  const startY = y + 2;

  (autoTable as unknown as (doc: jsPDF, opts: Record<string, unknown>) => void)(
    doc,
    {
      head: [headers],
      body: rows,
      startY,
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3.2,
        lineColor: PDF_COLORS.border,
        lineWidth: 0.25,
        textColor: PDF_COLORS.ink,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: PDF_COLORS.primaryLight,
        textColor: PDF_COLORS.ink,
        fontStyle: "bold",
        fontSize: 8.5,
        lineColor: PDF_COLORS.border,
      },
      alternateRowStyles: {
        fillColor: PDF_COLORS.surface,
      },
      bodyStyles: {
        minCellHeight: 8,
      },
      margin: { top: margin, right: margin, bottom: 24, left: margin },
      tableWidth: "auto",
      pageBreak: "auto",
    },
  );

  drawFooters(doc, config.locale, config.date);
  return doc;
}

export async function downloadPDF<T>(config: ExportConfig<T>) {
  const logoDataUrl = config.logoDataUrl ?? (await loadFlowyLogoDataUrl());
  const doc = generatePDF({ ...config, logoDataUrl });
  doc.save(`${config.filename}.pdf`);
}
