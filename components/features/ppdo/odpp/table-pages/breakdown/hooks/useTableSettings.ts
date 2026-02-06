// components/ppdo/odpp/breakdown/hooks/useTableSettings.ts

/**
 * @deprecated Use useTableSettings from @/components/features/ppdo/odpp/data-tables/core/hooks instead
 * This wrapper is maintained for backward compatibility with breakdown components.
 */

"use client";

import { useTableSettings as useGenericTableSettings } from "@/components/features/ppdo/odpp/utilities/data-tables/core/hooks/useTableSettings";
import { ColumnConfig, RowHeights } from "../types/breakdown.types";
import {
  DEFAULT_COLUMNS,
  TABLE_IDENTIFIER,
} from "../constants/table.constants";

interface UseTableSettingsOptions {
  /** Custom table identifier for different breakdown types */
  tableIdentifier?: string;
  /** Custom default columns if different from standard */
  defaultColumns?: ColumnConfig[];
}

interface UseTableSettingsReturn {
  columns: ColumnConfig[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnConfig[]>>;
  rowHeights: RowHeights;
  setRowHeights: React.Dispatch<React.SetStateAction<RowHeights>>;
  canEditLayout: boolean;
  saveLayout: (cols: ColumnConfig[], heights: RowHeights) => void;
}

export function useTableSettings(options: UseTableSettingsOptions = {}) {
  const { tableIdentifier = TABLE_IDENTIFIER, defaultColumns = DEFAULT_COLUMNS } = options;

  // Call the generic version with breakdown-specific defaults
  // Cast the defaultColumns to any to satisfy the generic hook
  return useGenericTableSettings({
    tableIdentifier,
    defaultColumns: defaultColumns as any,
  });
}