// services/export/csvExport.ts
// NEW FILE - CREATE THIS

import { generateCSV as sharedGenerateCSV, downloadCSV as sharedDownloadCSV } from "@/lib/shared/utils/csv";
import { TableColumn } from "@/lib/shared/types/table.types";

/**
 * CSV export configuration
 */
export interface CSVExportConfig {
  filename: string;
  columns: TableColumn[];
  hiddenColumns: Set<string>;
  includeTimestamp?: boolean;
  customTransform?: (row: any, column: TableColumn) => string;
}

/**
 * Generates and downloads CSV file
 * Wraps shared CSV utilities with enhanced configuration
 * 
 * @param data - Array of data to export
 * @param config - Export configuration
 * 
 * @example
 * ```typescript
 * exportToCSV(budgetItems, {
 *   filename: "budget_export",
 *   columns: BUDGET_COLUMNS,
 *   hiddenColumns: new Set(["id"]),
 *   includeTimestamp: true,
 * });
 * ```
 */
export function exportToCSV<T>(
  data: T[],
  config: CSVExportConfig
): void {
  try {
    // Generate filename with timestamp if requested
    const filename = config.includeTimestamp
      ? `${config.filename}_${new Date().toISOString().split('T')[0]}.csv`
      : `${config.filename}.csv`;

    // Generate CSV content
    const csvContent = config.customTransform
      ? generateCSVWithTransform(data, config.columns, config.hiddenColumns, config.customTransform)
      : sharedGenerateCSV(data, config.columns, config.hiddenColumns);

    // Download file
    sharedDownloadCSV(csvContent, filename);
  } catch (error) {
    console.error("CSV export failed:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to export CSV"
    );
  }
}

/**
 * Generates CSV with custom transform function
 * 
 * @param data - Array of data
 * @param columns - Column definitions
 * @param hiddenColumns - Hidden column IDs
 * @param transform - Transform function
 * @returns CSV string
 */
function generateCSVWithTransform<T>(
  data: T[],
  columns: TableColumn[],
  hiddenColumns: Set<string>,
  transform: (row: T, column: TableColumn) => string
): string {
  const visibleCols = columns.filter((col) => !hiddenColumns.has(col.id));

  if (visibleCols.length === 0) {
    throw new Error("No columns are visible to export");
  }

  const headers = visibleCols.map((c) => c.label).join(",");
  const rows = data.map((item) => {
    return visibleCols
      .map((col) => transform(item, col))
      .join(",");
  });

  return [headers, ...rows].join("\n");
}

/**
 * Validates data before export
 * 
 * @param data - Data to validate
 * @param config - Export configuration
 * @returns Boolean indicating if data is valid
 */
export function validateExportData<T>(
  data: T[],
  config: CSVExportConfig
): { valid: boolean; error?: string } {
  if (!data || data.length === 0) {
    return { valid: false, error: "No data to export" };
  }

  const visibleColumns = config.columns.filter(
    (col) => !config.hiddenColumns.has(col.id)
  );

  if (visibleColumns.length === 0) {
    return { valid: false, error: "No visible columns to export" };
  }

  return { valid: true };
}

/**
 * Creates a budget-specific CSV export config
 * 
 * @param hiddenColumns - Hidden column IDs
 * @returns CSVExportConfig for budget items
 */
export function createBudgetExportConfig(
  columns: TableColumn[],
  hiddenColumns: Set<string>
): CSVExportConfig {
  return {
    filename: "budget_export",
    columns,
    hiddenColumns,
    includeTimestamp: true,
    customTransform: (row: any, column: TableColumn) => {
      const val = row[column.id];

      if (val === undefined || val === null) return "";

      // Format currency fields
      if (column.id.includes("Budget") || column.id.includes("Allocated") || column.id.includes("Utilized")) {
        return `"₱${val.toLocaleString()}"`;
      }

      // Format percentage fields
      if (column.id.includes("Rate")) {
        return `${val.toFixed(2)}%`;
      }

      // Escape strings
      if (typeof val === "string") {
        return `"${val.replace(/"/g, '""')}"`;
      }

      return String(val);
    },
  };
}

/**
 * Creates a 20% DF-specific CSV export config
 * 
 * @param hiddenColumns - Hidden column IDs
 * @returns CSVExportConfig for 20% DF items
 */
export function createTwentyPercentDFExportConfig(
  columns: TableColumn[],
  hiddenColumns: Set<string>
): CSVExportConfig {
  return {
    filename: "twenty_percent_df_export",
    columns,
    hiddenColumns,
    includeTimestamp: true,
    customTransform: (row: any, column: TableColumn) => {
      const val = row[column.id];

      if (val === undefined || val === null) return "";

      // Format currency fields
      if (column.id.includes("Budget") || column.id.includes("Allocated") || column.id.includes("Utilized")) {
        return `"₱${val.toLocaleString()}"`;
      }

      // Format percentage fields
      if (column.id.includes("Rate") || column.id.includes("Utilization")) {
        return `${val.toFixed(2)}%`;
      }

      // Format status
      if (column.id === "status") {
        return val.charAt(0).toUpperCase() + val.slice(1);
      }

      // Escape strings
      if (typeof val === "string") {
        return `"${val.replace(/"/g, '""')}"`;
      }

      return String(val);
    },
  };
}

/**
 * Creates a project-specific CSV export config
 * 
 * @param hiddenColumns - Hidden column IDs
 * @returns CSVExportConfig for project items
 */
export function createProjectExportConfig(
  columns: TableColumn[],
  hiddenColumns: Set<string>
): CSVExportConfig {
  return {
    filename: "projects_export",
    columns,
    hiddenColumns,
    includeTimestamp: true,
    customTransform: (row: any, column: TableColumn) => {
      const val = row[column.id];

      if (val === undefined || val === null) return "";

      // Format currency fields
      if (column.id.includes("Budget") || column.id.includes("Allocated") || column.id.includes("Utilized")) {
        return `"₱${val.toLocaleString()}"`;
      }

      // Format percentage fields
      if (column.id.includes("Rate") || column.id.includes("Utilization")) {
        return `${val.toFixed(2)}%`;
      }

      // Format status
      if (column.id === "status") {
        return val.charAt(0).toUpperCase() + val.slice(1);
      }

      // Escape strings
      if (typeof val === "string") {
        return `"${val.replace(/"/g, '""')}"`;
      }

      return String(val);
    },
  };
}