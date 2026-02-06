// components/ppdo/shared/hooks/useGenericTableSettings.ts

/**
 * Generic Table Settings Hook
 *
 * A flexible hook that manages column widths and row heights with Convex persistence.
 * Can be used by any table component - funds, projects, budget items, etc.
 *
 * Usage:
 * ```tsx
 * const { columnWidths, setColumnWidth, rowHeights, setRowHeight, canEditLayout } =
 *   useGenericTableSettings({
 *     tableIdentifier: "trustFundsTable",
 *     defaultColumnWidths: { projectTitle: 260, remarks: 200 },
 *   });
 * ```
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ColumnWidth {
    [key: string]: number;
}

interface RowHeights {
    [rowId: string]: number;
}

interface UseGenericTableSettingsOptions {
    /** Unique identifier for this table (used for persistence) */
    tableIdentifier: string;
    /** Default column widths */
    defaultColumnWidths?: ColumnWidth;
    /** Minimum column width (default: 100) */
    minColumnWidth?: number;
    /** Default row height (default: 40) */
    defaultRowHeight?: number;
    /** Minimum row height (default: 32) */
    minRowHeight?: number;
}

interface ColumnSetting {
    fieldKey: string;
    width: number;
    isVisible: boolean;
}

export function useGenericTableSettings(options: UseGenericTableSettingsOptions) {
    const {
        tableIdentifier,
        defaultColumnWidths = {},
        minColumnWidth = 100,
        defaultRowHeight = 40,
        minRowHeight = 32,
    } = options;

    const [columnWidths, setColumnWidthsState] = useState<ColumnWidth>(defaultColumnWidths);
    const [rowHeights, setRowHeightsState] = useState<RowHeights>({});
    const [isLoaded, setIsLoaded] = useState(false);

    // Query settings from Convex
    const settings = useQuery(api.tableSettings.getSettings, {
        tableIdentifier
    });
    const saveSettings = useMutation(api.tableSettings.saveSettings);

    // Check user permissions
    const currentUser = useQuery(api.users.current, {});
    const canEditLayout = currentUser?.role === "super_admin" || currentUser?.role === "admin";

    // Load settings when they change
    useEffect(() => {
        if (settings === undefined) return; // Still loading

        if (settings?.columns) {
            // Merge saved widths with defaults
            const savedWidths: ColumnWidth = {};
            settings.columns.forEach((col: ColumnSetting) => {
                savedWidths[col.fieldKey] = col.width;
            });
            setColumnWidthsState({ ...defaultColumnWidths, ...savedWidths });
        }

        if (settings?.customRowHeights) {
            try {
                const heights = JSON.parse(settings.customRowHeights) as RowHeights;
                setRowHeightsState(heights);
            } catch {
                setRowHeightsState({});
            }
        }

        setIsLoaded(true);
    }, [settings, defaultColumnWidths]);

    // Save layout to database (debounced internally by Convex)
    const persistSettings = useCallback(
        async (widths: ColumnWidth, heights: RowHeights) => {
            if (!canEditLayout) return;

            try {
                await saveSettings({
                    tableIdentifier,
                    columns: Object.entries(widths).map(([key, width]) => ({
                        fieldKey: key,
                        width,
                        isVisible: true,
                    })),
                    customRowHeights: JSON.stringify(heights),
                });
            } catch (error) {
                console.error("Failed to save table settings:", error);
            }
        },
        [saveSettings, canEditLayout, tableIdentifier]
    );

    // Set a single column width
    const setColumnWidth = useCallback(
        (columnKey: string, width: number) => {
            const newWidth = Math.max(minColumnWidth, width);
            setColumnWidthsState(prev => {
                const next = { ...prev, [columnKey]: newWidth };
                persistSettings(next, rowHeights);
                return next;
            });
        },
        [minColumnWidth, persistSettings, rowHeights]
    );

    // Set a single row height
    const setRowHeight = useCallback(
        (rowId: string, height: number) => {
            const newHeight = Math.max(minRowHeight, height);
            setRowHeightsState(prev => {
                const next = { ...prev, [rowId]: newHeight };
                persistSettings(columnWidths, next);
                return next;
            });
        },
        [minRowHeight, persistSettings, columnWidths]
    );

    // Get row height with fallback to default
    const getRowHeight = useCallback(
        (rowId: string) => rowHeights[rowId] ?? defaultRowHeight,
        [rowHeights, defaultRowHeight]
    );

    // Get column width with fallback to default
    const getColumnWidth = useCallback(
        (columnKey: string, fallback: number = 150) => columnWidths[columnKey] ?? defaultColumnWidths[columnKey] ?? fallback,
        [columnWidths, defaultColumnWidths]
    );

    // Column resize handler (for mouse drag)
    const startResizeColumn = useCallback(
        (e: React.MouseEvent, columnKey: string, currentWidth: number) => {
            if (!canEditLayout) return;

            e.preventDefault();
            e.stopPropagation();

            const startX = e.clientX;
            const startWidth = currentWidth;

            const onMove = (ev: MouseEvent) => {
                const delta = ev.clientX - startX;
                const newWidth = Math.max(minColumnWidth, startWidth + delta);
                setColumnWidthsState(prev => ({ ...prev, [columnKey]: newWidth }));
            };

            const onUp = () => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                // Persist after drag ends
                setColumnWidthsState(prev => {
                    persistSettings(prev, rowHeights);
                    return prev;
                });
            };

            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        },
        [canEditLayout, minColumnWidth, persistSettings, rowHeights]
    );

    // Row resize handler (for mouse drag)
    const startResizeRow = useCallback(
        (e: React.MouseEvent, rowId: string, currentHeight: number) => {
            if (!canEditLayout) return;

            e.preventDefault();
            e.stopPropagation();

            const startY = e.clientY;
            const startHeight = currentHeight;

            const onMove = (ev: MouseEvent) => {
                const delta = ev.clientY - startY;
                const newHeight = Math.max(minRowHeight, startHeight + delta);
                setRowHeightsState(prev => ({ ...prev, [rowId]: newHeight }));
            };

            const onUp = () => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
                // Persist after drag ends
                setRowHeightsState(prev => {
                    persistSettings(columnWidths, prev);
                    return prev;
                });
            };

            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        },
        [canEditLayout, minRowHeight, persistSettings, columnWidths]
    );

    // Reset all settings to defaults
    const resetToDefaults = useCallback(() => {
        setColumnWidthsState(defaultColumnWidths);
        setRowHeightsState({});
        persistSettings(defaultColumnWidths, {});
    }, [defaultColumnWidths, persistSettings]);

    return {
        // State
        columnWidths,
        rowHeights,
        isLoaded,
        canEditLayout,

        // Getters
        getColumnWidth,
        getRowHeight,

        // Setters
        setColumnWidth,
        setRowHeight,

        // Mouse drag handlers
        startResizeColumn,
        startResizeRow,

        // Utilities
        resetToDefaults,
        persistSettings,
    };
}

// Export types for consumers
export type { ColumnWidth, RowHeights, UseGenericTableSettingsOptions };
