// ============================================================
// CSV Export — Export threads and patterns as CSV
// ============================================================

import Papa from "papaparse";
import type { ThreadInventoryItem, Pattern } from "@/types";

/** Export thread inventory to CSV and trigger download */
export function exportThreadsCSV(threads: ThreadInventoryItem[]) {
  const rows = threads.map((t) => ({
    Manufacturer: t.manufacturer,
    "Color Number": t.color_number ?? "",
    "Color Name": t.color_name ?? "",
    Quantity: t.quantity,
    "Thread Type": t.thread_type ?? "",
    Notes: t.notes ?? "",
  }));

  const csv = Papa.unparse(rows);
  downloadCSV(csv, `stitch-studio-threads-${dateStamp()}.csv`);
}

/** Export patterns to CSV and trigger download */
export function exportPatternsCSV(patterns: Pattern[]) {
  const rows = patterns.map((p) => ({
    Name: p.name,
    Designer: p.designer ?? "",
    Company: p.company ?? "",
    Type: p.type,
    "Size (Inches)": p.size_inches ?? "",
    "Size (Stitches)": p.size_stitches ?? "",
    "Thread Brand": p.rec_thread_brand ?? "",
    Fabric: p.rec_fabric ?? "",
    "Chart Type": p.chart_type ?? "",
    Kitted: p.kitted ? "Yes" : "No",
    "Work in Progress": p.wip ? "Yes" : "No",
    "Progress %": p.wip_pct,
    "Start Date": p.start_date ?? "",
    "Completion Date": p.completion_date ?? "",
    Notes: p.notes ?? "",
  }));

  const csv = Papa.unparse(rows);
  downloadCSV(csv, `stitch-studio-patterns-${dateStamp()}.csv`);
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
