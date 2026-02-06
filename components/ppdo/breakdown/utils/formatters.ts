// components/ppdo/breakdown/utils/formatters.ts

import { Breakdown, ColumnConfig } from "../types/breakdown.types";
import {
  formatCurrency,
  formatDate,
  formatPercentage
} from "@/lib/shared/utils/formatting";

// Re-export for convenience if needed within breakdown module
export { formatCurrency, formatDate, formatPercentage };

/**
 * Formats a cell value based on column type
 */
export function formatCellValue(
  value: any,
  column: ColumnConfig,
  row: Breakdown
): string {
  if (value == null || value === undefined || value === "") {
    return "-";
  }

  switch (column.type) {
    case "currency":
      return formatCurrency(value);

    case "date":
      return formatDate(value);

    case "number":
      return formatPercentage(value);

    case "status":
      // Return capitalized plain text
      return String(value).charAt(0).toUpperCase() + String(value).slice(1);

    default:
      // Special case for municipality field
      if (column.key === "municipality") {
        return formatLocation(row);
      }
      return String(value);
  }
}

/**
 * Formats location by combining barangay, municipality, and district
 */
export function formatLocation(row: Breakdown): string {
  const locationParts = [
    row.barangay,
    row.municipality,
    row.district
  ].filter(Boolean);

  return locationParts.length > 0 ? locationParts.join(", ") : "-";
}
