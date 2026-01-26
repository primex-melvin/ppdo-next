// components/ppdo/breakdown/hooks/useTableSettings.ts

/**
 * Centralized Table Settings Hook for Breakdown Components
 *
 * Manages column layout and row heights with persistence via Convex.
 * Used by both Project and Trust Fund breakdown tables.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ColumnConfig, RowHeights } from "../types/breakdown.types";
import {
  DEFAULT_COLUMNS,
  TABLE_IDENTIFIER
} from "../constants/table.constants";
import { mergeColumnSettings, safeJsonParse } from "../utils/helpers";

interface UseTableSettingsOptions {
  /** Custom table identifier for different breakdown types */
  tableIdentifier?: string;
  /** Custom default columns if different from standard */
  defaultColumns?: ColumnConfig[];
}

export function useTableSettings(options: UseTableSettingsOptions = {}) {
  const {
    tableIdentifier = TABLE_IDENTIFIER,
    defaultColumns = DEFAULT_COLUMNS
  } = options;

  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [rowHeights, setRowHeights] = useState<RowHeights>({});

  // Query settings
  const settings = useQuery(api.tableSettings.getSettings, {
    tableIdentifier
  });
  const saveSettings = useMutation(api.tableSettings.saveSettings);

  // Check user permissions
  const currentUser = useQuery(api.users.current);
  const canEditLayout = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  // Load settings when they change
  useEffect(() => {
    if (!settings?.columns) return;

    const mergedColumns = mergeColumnSettings(settings.columns, defaultColumns);
    setColumns(mergedColumns);

    if (settings.customRowHeights) {
      const heights = safeJsonParse<RowHeights>(settings.customRowHeights, {});
      setRowHeights(heights);
    }
  }, [settings, defaultColumns]);

  // Save layout to database
  const saveLayout = useCallback(
    (cols: ColumnConfig[], heights: RowHeights) => {
      if (!canEditLayout) return;

      saveSettings({
        tableIdentifier,
        columns: cols.map(c => ({
          fieldKey: c.key,
          width: c.width,
          isVisible: true,
        })),
        customRowHeights: JSON.stringify(heights),
      }).catch(console.error);
    },
    [saveSettings, canEditLayout, tableIdentifier]
  );

  return {
    columns,
    setColumns,
    rowHeights,
    setRowHeights,
    canEditLayout,
    saveLayout,
  };
}
