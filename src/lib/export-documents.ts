import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn<T> {
  key: string;
  header: string;
  render: (row: T) => string;
}

export interface ExportConfig<T> {
  title: string;
  subtitle?: string;
  filename: string;
  columns: ExportColumn<T>[];
  data: T[];
  totals?: { label: string; value: string }[];
  locale: string;
  date?: string;
}

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

export function renderRows<T>(config: ExportConfig<T>): string[][] {
  return config.data.map((row) => config.columns.map((col) => col.render(row)));
}

export function generateCSV<T>(config: ExportConfig<T>): string {
  const headers = config.columns.map((c) => c.header);
  const rows = renderRows(config);
  return toCSV([headers, ...rows]);
}

export function downloadCSV<T>(config: ExportConfig<T>) {
  const csv = generateCSV(config);
  downloadBlob(csv, `${config.filename}.csv`, "text/csv;charset=utf-8;");
}

export function generatePDF<T>(config: ExportConfig<T>): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;
  let y = margin + 12;

  // --- Logo + Brand ---
  // Droplet icon (simple SVG path rendered as text-based graphics)
  doc.setDrawColor(59, 130, 246);
  doc.setFillColor(59, 130, 246);
  // Draw a small droplet shape
  const cx = margin + 4;
  const cy = margin + 4;
  doc.setFontSize(6);
  doc.text("◆", cx - 2, cy, { charSpace: -2 });
  // Actually, use a simple text-based logo
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(59, 130, 246);
  doc.text("Flowy", margin + 10, margin + 8);

  // --- Document Title ---
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(config.title, margin, y + 6);

  // --- Subtitle / Date ---
  if (config.subtitle) {
    y += 14;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(config.subtitle, margin, y);
  }

  if (config.date) {
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text(config.date, margin, y);
  }

  // --- Separator line ---
  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);

  // --- Table ---
  const headers = config.columns.map((c) => c.header);
  const rows = renderRows(config);

  const startY = y + 8;
  (autoTable as unknown as (doc: jsPDF, opts: Record<string, unknown>) => void)(
    doc,
    {
      head: [headers],
      body: rows,
      startY,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [230, 230, 230],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {},
      margin: { left: margin, right: margin },
    },
  );

  // --- Totals ---
  const lastY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable?.finalY;
  let totalsY = (lastY ?? doc.internal.pageSize.height - 40) + 10;

  if (config.totals && config.totals.length > 0) {
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, totalsY - 2, pageWidth - margin, totalsY - 2);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);

    for (const total of config.totals) {
      const labelX = margin;
      const valueX = pageWidth - margin;

      doc.setFont("helvetica", "normal");
      doc.text(total.label, labelX, totalsY);
      doc.setFont("helvetica", "bold");
      doc.text(total.value, valueX, totalsY, { align: "right" });

      totalsY += 6;
    }
  }

  // --- Footer ---
  const footerY = doc.internal.pageSize.height - 12;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  doc.text(
    `Flowy · ${new Date().toLocaleDateString(config.locale)} · ${new Date().toLocaleTimeString(config.locale, { hour: "2-digit", minute: "2-digit" })}`,
    margin,
    footerY,
  );

  return doc;
}

export function downloadPDF<T>(config: ExportConfig<T>) {
  const doc = generatePDF(config);
  doc.save(`${config.filename}.pdf`);
}
