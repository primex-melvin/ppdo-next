
/**
 * Centralized Table Settings Hook
 *
 * Manages column visibility, order, and row heights with persistence via Convex.
 * NOTE: Column widths are now calculated dynamically based on flex values,
 * not saved/restored from database.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ColumnConfig, RowHeights } from "../types/table.types";
import { safeJsonParse } from "../utils/table.utils";

export interface UseTableSettingsOptions {
    /** Custom table identifier for different table types */
    tableIdentifier: string;
    /** Default columns - widths are always taken from here (flex values) */
    defaultColumns: ColumnConfig[];
}

export function useTableSettings(options: UseTableSettingsOptions) {
    const { tableIdentifier, defaultColumns } = options;

    const [rowHeights, setRowHeights] = useState<RowHeights>({});
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
    const [columnOrder, setColumnOrder] = useState<string[]>([]);

    // Query settings from database
    const settings = useQuery(api.tableSettings.getSettings, { tableIdentifier });
    const saveSettings = useMutation(api.tableSettings.saveSettings);

    // Check user permissions
    const currentUser = useQuery(api.users.current, {});
    const canEditLayout = currentUser?.role === "super_admin" || currentUser?.role === "admin";

    // Load settings when they change
    useEffect(() => {
        if (!settings?.columns) {
            // No saved settings - use defaults
            setHiddenColumns(new Set());
            setColumnOrder(defaultColumns.map(c => String(c.key)));
            return;
        }

        // Restore visibility from saved settings
        const savedHidden = new Set<string>();
        settings.columns.forEach(savedCol => {
            if (!savedCol.isVisible) {
                savedHidden.add(savedCol.fieldKey);
            }
        });
        setHiddenColumns(savedHidden);

        // Restore column order if different from default
        const savedOrder = settings.columns.map(c => c.fieldKey);
        const hasAllColumns = defaultColumns.every(col => 
            savedOrder.includes(String(col.key))
        );
        
        if (hasAllColumns && savedOrder.length === defaultColumns.length) {
            setColumnOrder(savedOrder);
        } else {
            // Reset to default order if schema changed
            setColumnOrder(defaultColumns.map(c => String(c.key)));
        }

        // Restore row heights
        if (settings.customRowHeights) {
            const heights = safeJsonParse<RowHeights>(settings.customRowHeights, {});
            setRowHeights(heights);
        }
    }, [settings, defaultColumns]);

    // Build final columns - always use flex/width from defaultColumns
    const columns = useMemo(() => {
        // Create map of default columns by key
        const defaultMap = new Map(defaultColumns.map(c => [String(c.key), c]));
        
        // Reorder based on columnOrder
        const ordered = columnOrder
            .map(key => defaultMap.get(key))
            .filter((col): col is ColumnConfig => col !== undefined);
        
        // Add any new columns not in order yet
        defaultColumns.forEach(col => {
            if (!columnOrder.includes(String(col.key))) {
                ordered.push(col);
            }
        });
        
        return ordered;
    }, [defaultColumns, columnOrder]);

    // Toggle column visibility
    const toggleColumnVisibility = useCallback((columnKey: string, isVisible: boolean) => {
        setHiddenColumns(prev => {
            const next = new Set(prev);
            if (isVisible) {
                next.delete(columnKey);
            } else {
                next.add(columnKey);
            }
            return next;
        });
    }, []);

    // Save layout to database (visibility, order, row heights - NOT widths)
    const saveLayout = useCallback(
        (_cols: ColumnConfig[] | RowHeights, heights?: RowHeights) => {
            if (!canEditLayout) return;

            // Handle both signatures: saveLayout(heights) or saveLayout(cols, heights)
            const actualHeights = heights || (_cols as RowHeights);

            saveSettings({
                tableIdentifier,
                columns: columns.map(c => ({
                    fieldKey: String(c.key),
                    width: 0, // Not used anymore, but kept for schema compatibility
                    isVisible: !hiddenColumns.has(String(c.key)),
                })),
                customRowHeights: JSON.stringify(actualHeights),
            }).catch(console.error);
        },
        [saveSettings, canEditLayout, tableIdentifier, columns, hiddenColumns]
    );

    // Legacy compatibility: setColumns updates column order
    const setColumns = useCallback((updater: React.SetStateAction<ColumnConfig[]>) => {
        const newColumns = typeof updater === 'function' 
            ? (updater as (prev: ColumnConfig[]) => ColumnConfig[])(columns)
            : updater;
        setColumnOrder(newColumns.map((c: ColumnConfig) => String(c.key)));
    }, [columns]);

    return {
        // State
        columns,
        hiddenColumns,
        rowHeights,
        canEditLayout,

        // Actions
        setRowHeights,
        setHiddenColumns,
        setColumnOrder,
        toggleColumnVisibility,
        saveLayout,
        
        // Legacy compatibility
        setColumns,
    };
}
