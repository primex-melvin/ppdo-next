// app/components/Spreadsheet/SpreadsheetHeader.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Lock, ChevronDown } from "lucide-react";
import { SpreadsheetHeaderProps } from "./types";

export function SpreadsheetHeader({
  title,
  selectedYear,
  dataRows,
  columns,
  detectedColumns,
  onShare,
}: SpreadsheetHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg text-gray-800">
              {title}
              {selectedYear && (
                <span className="ml-2 font-bold text-blue-600">
                  {selectedYear}
                </span>
              )}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              ({dataRows} items, {detectedColumns.length} data cols + 1 total = {columns.join(', ')})
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mr-12">
        {onShare && (
          <Button 
            className="h-9 gap-2 rounded-full bg-[#c2e7ff] text-[#001d35] hover:bg-[#a8d4ff]"
            onClick={onShare}
          >
            <Lock className="h-4 w-4" />
            Share
            <ChevronDown className="h-3 w-3" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
          <div className="h-8 w-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center">
            👤
          </div>
        </Button>
      </div>
    </header>
  );
}