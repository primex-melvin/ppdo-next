
/**
 * Centralized Table Settings Hook
 *
 * Manages column visibility, order, widths, and row heights with persistence via Convex.
 * Column widths are now loaded from database defaults and user preferences.
 */

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ColumnConfig, RowHeights } from "../types/table.types";
import { safeJsonParse } from "../utils/table.utils";

// Debounce helper
function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
}

export interface UseTableSettingsOptions {
    /** Custom table identifier for different table types */
    tableIdentifier: string;
    /** Default columns with widths */
    defaultColumns: ColumnConfig[];
}

export function useTableSettings(options: UseTableSettingsOptions) {
    const { tableIdentifier, defaultColumns } = options;

    const [rowHeights, setRowHeights] = useState<RowHeights>({});
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
    const [columnOrder, setColumnOrder] = useState<string[]>([]);
    const [columnWidths, setColumnWidths] = useState<Map<string, number>>(new Map());

    // Query user settings and defaults from database
    const userSettings = useQuery(api.tableSettings.getSettings, { tableIdentifier });
    const defaultWidths = useQuery(api.tableSettings.getDefaultWidths, { tableIdentifier });
    const saveSettings = useMutation(api.tableSettings.saveSettings);
    const updateWidth = useMutation(api.tableSettings.updateColumnWidth);

    // Check user permissions
    const currentUser = useQuery(api.users.current, {});
    const canEditLayout = currentUser?.role === "super_admin" || currentUser?.role === "admin";

    // Load settings from database
    useEffect(() => {
        if (!defaultWidths) return;

        if (!userSettings?.columns || userSettings.columns.length === 0) {
            // No saved settings or empty columns - use defaults
            setHiddenColumns(new Set());
            setColumnOrder(defaultColumns.map(c => String(c.key)));

            // Apply default widths from database or fallback to config
            const widths = new Map<string, number>();
            defaultColumns.forEach(col => {
                const key = String(col.key);
                const def = defaultWidths[key];
                widths.set(key, def?.width ?? col.width ?? 150);
            });
            setColumnWidths(widths);
            return;
        }

        // Restore from saved user settings
        const hidden = new Set<string>();
        const widths = new Map<string, number>();

        userSettings.columns.forEach(savedCol => {
            if (!savedCol.isVisible) {
                hidden.add(savedCol.fieldKey);
            }
            // Only use saved width if it's a valid positive number
            // Otherwise, fall back to DB default or config default
            if (savedCol.width && savedCol.width > 0) {
                widths.set(savedCol.fieldKey, savedCol.width);
            } else {
                // Find the default column config for this key
                const colConfig = defaultColumns.find(c => String(c.key) === savedCol.fieldKey);
                const dbWidth = defaultWidths?.[savedCol.fieldKey]?.width;
                const fallbackWidth = dbWidth ?? colConfig?.width ?? 150;
                widths.set(savedCol.fieldKey, fallbackWidth);
            }
        });

        setHiddenColumns(hidden);
        setColumnWidths(widths);

        // Restore column order
        const savedOrder = userSettings.columns.map(c => c.fieldKey);
        const hasAllColumns = defaultColumns.every(col =>
            savedOrder.includes(String(col.key))
        );

        if (hasAllColumns) {
            setColumnOrder(savedOrder);
        } else {
            // Reset to default order if schema changed
            setColumnOrder(defaultColumns.map(c => String(c.key)));
        }

        // Restore row heights
        if (userSettings.customRowHeights) {
            setRowHeights(safeJsonParse<RowHeights>(userSettings.customRowHeights, {}));
        }
    }, [userSettings, defaultWidths, defaultColumns]);

    // Build final columns with applied widths
    const columns = useMemo((): ColumnConfig[] => {
        const defaultMap = new Map(defaultColumns.map(c => [String(c.key), c]));

        const ordered: ColumnConfig[] = [];

        columnOrder.forEach(key => {
            const col = defaultMap.get(key);
            if (!col) return;

            // Use saved width, or default from DB, or config default
            const savedWidth = columnWidths.get(key);
            const dbDefault = defaultWidths?.[key]?.width;
            const finalWidth = savedWidth ?? dbDefault ?? col.width ?? 150;

            ordered.push({
                ...col,
                width: finalWidth,
                minWidth: col.minWidth ?? defaultWidths?.[key]?.minWidth ?? 60,
                maxWidth: col.maxWidth ?? defaultWidths?.[key]?.maxWidth ?? 600,
            });
        });

        // Add any new columns not in saved order
        defaultColumns.forEach(col => {
            const key = String(col.key);
            if (!columnOrder.includes(key)) {
                const dbDefault = defaultWidths?.[key]?.width;
                ordered.push({
                    ...col,
                    width: dbDefault ?? col.width ?? 150,
                });
            }
        });

        return ordered;
    }, [defaultColumns, columnOrder, columnWidths, defaultWidths]);

    // Debug logging: Log when columns are loaded
    // NOTE: Temporarily disabled to reduce console noise during search debug
    // useEffect(() => {
    //     if (columns.length === 0) return;
    //     const widthInfo = columns.map(c => {
    //         const savedWidth = columnWidths.get(String(c.key));
    //         const source = savedWidth ? 'db' : 'default';
    //         return `${String(c.key)}: ${savedWidth || c.width}px (${source})`;
    //     }).join(', ');
    //     console.log(`[Table:${tableIdentifier}] Loaded ${columns.length} columns`);
    //     console.log(`[Table:${tableIdentifier}] Widths: ${widthInfo}`);
    // }, [columns, columnWidths, tableIdentifier]);

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

    // Update single column width (called during resize)
    // Debounced save to prevent too many mutation calls
    const saveWidthToDb = useDebouncedCallback(
        async (columnKey: string, width: number) => {
            if (!canEditLayout) return;
            // NOTE: Temporarily disabled to reduce console noise during search debug
            // console.log(`[Table:${tableIdentifier}] Saving width: ${columnKey} = ${width}px`);
            await updateWidth({ tableIdentifier, columnKey, width });
        },
        300 // 300ms debounce
    );

    const updateColumnWidth = useCallback((columnKey: string, newWidth: number) => {
        const col = columns.find(c => String(c.key) === columnKey);
        if (!col) return;

        // Clamp to min/max bounds
        const minW = col.minWidth ?? 60;
        const maxW = col.maxWidth ?? 600;
        const clamped = Math.max(minW, Math.min(maxW, newWidth));

        // Optimistic update - immediate UI update
        setColumnWidths(prev => new Map(prev).set(columnKey, clamped));

        // Schedule save to database (debounced)
        saveWidthToDb(columnKey, clamped);
    }, [columns, saveWidthToDb]);

    // Save full layout to database
    const saveLayout = useCallback((heights: RowHeights) => {
        if (!canEditLayout) return;

        saveSettings({
            tableIdentifier,
            columns: columns.map(c => ({
                fieldKey: String(c.key),
                width: columnWidths.get(String(c.key)) ?? c.width ?? 150,
                isVisible: !hiddenColumns.has(String(c.key)),
                flex: c.flex,
            })),
            customRowHeights: JSON.stringify(heights),
        }).catch(console.error);
    }, [saveSettings, canEditLayout, tableIdentifier, columns, columnWidths, hiddenColumns]);

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
        columnWidths,
        rowHeights,
        canEditLayout,

        // Actions
        setRowHeights,
        setHiddenColumns,
        setColumnOrder,
        toggleColumnVisibility,
        updateColumnWidth,
        saveLayout,

        // Legacy compatibility
        setColumns,
    };
}
