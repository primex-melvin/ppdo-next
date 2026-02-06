// app/components/spreadsheet/utils/exportUtils.ts

import { ColumnDefinition } from "../types";

/**
 * Export data to CSV
 */
export function exportToCSV(
  data: any[],
  columns: ColumnDefinition[],
  totals: Record<string, number>,
  filename: string
): void {
  // Build CSV content
  const headers = columns.map(col => col.label).join(",");
  
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key];
      if (value === null || value === undefined) return "";
      
      // Format based on type
      if (col.type === "text" || col.type === "number") {
        return `"${String(value).replace(/"/g, '""')}"`;
      }
      return value;
    }).join(",");
  });
  
  // Add totals row
  const totalsRow = columns.map((col, index) => {
    if (index === 0) return "TOTAL";
    if (col.key === "year" || col.key === "status") return "";
    if (totals[col.key] !== undefined) {
      return totals[col.key];
    }
    return "";
  }).join(",");
  
  const csvContent = [headers, ...rows, totalsRow].join("\n");
  
  // Download CSV
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}