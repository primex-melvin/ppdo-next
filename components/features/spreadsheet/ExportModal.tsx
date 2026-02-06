// app/components/Spreadsheet/ExportModal.tsx

"use client";

import { Button } from "@/components/ui/button";
import { ExportModalProps } from "./types";
import { formatCurrency } from "./utils/formatting";

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  selectedYear,
  dataRows,
  detectedColumns,
  totals,
}: ExportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          Export Data as CSV
        </h2>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Year:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {selectedYear || "All Years"}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Total Items:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {dataRows}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Total Columns:</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {detectedColumns.length}
            </span>
          </div>
          
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 mt-3">
            {detectedColumns.filter(col => col.type === "currency").slice(0, 3).map((col) => (
              <div key={col.key} className="flex justify-between text-sm mt-2">
                <span className="text-zinc-600 dark:text-zinc-400">{col.label}:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(totals[col.key] || 0)}
                </span>
              </div>
            ))}
            
            <div className="flex justify-between text-sm mt-2">
              <span className="text-zinc-600 dark:text-zinc-400">Grand Total:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(
                  detectedColumns.reduce((sum, col) => {
                    if (col.type === "currency") {
                      return sum + (totals[col.key] || 0);
                    }
                    return sum;
                  }, 0)
                )}
              </span>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💾 File will be saved to your downloads folder
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-zinc-700 dark:text-zinc-300"
          >
            Cancel
          </Button>
          <Button
            onClick={onExport}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}