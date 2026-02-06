
/**
 * Centralized Table Settings Hook
 *
 * Manages column layout and row heights with persistence via Convex.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ColumnConfig, RowHeights } from "../types/table.types";
import { mergeColumnSettings, safeJsonParse } from "../utils/table.utils";

export interface UseTableSettingsOptions {
    /** Custom table identifier for different table types */
    tableIdentifier: string;
    /** Default columns */
    defaultColumns: ColumnConfig[];
}

export function useTableSettings(options: UseTableSettingsOptions) {
    const {
        tableIdentifier,
        defaultColumns
    } = options;

    const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
    const [rowHeights, setRowHeights] = useState<RowHeights>({});

    // Query settings
    const settings = useQuery(api.tableSettings.getSettings, {
        tableIdentifier
    });
    const saveSettings = useMutation(api.tableSettings.saveSettings);

    // Check user permissions
    const currentUser = useQuery(api.users.current, {});
    const canEditLayout = currentUser?.role === "super_admin" || currentUser?.role === "admin";

    // Load settings when they change
    useEffect(() => {
        if (!settings?.columns) {
            setColumns(defaultColumns);
            return;
        }

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
                    fieldKey: String(c.key),
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
