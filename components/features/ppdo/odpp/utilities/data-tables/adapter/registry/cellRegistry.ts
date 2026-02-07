
/**
 * Cell Renderer Registry
 * 
 * Central registry for mapping column types to cell rendering functions.
 * Supports custom renderers while providing sensible defaults.
 */

"use client";

import { ReactNode } from "react";
import { ColumnConfig, ColumnType } from "../../core/types/table.types";
import { CellRendererRegistry } from "../types/adapter.types";
import { defaultCellRenderers, getCellRenderer } from "./defaultRenderers";

export { defaultCellRenderers, getCellRenderer };

/**
 * Create a cell renderer function for a given column type
 * This factory function returns the appropriate renderer with custom overrides applied
 */
export function createCellRenderer<T>(
    type: ColumnType,
    customRenderers?: Partial<CellRendererRegistry<T>>
) {
    return (item: T, column: ColumnConfig<T>): ReactNode => {
        const renderer = getCellRenderer(type as keyof CellRendererRegistry<T>, customRenderers);
        return renderer(item, column);
    };
}

/**
 * Registry of all available cell renderers
 * Used for dynamic cell rendering based on column configuration
 */
export const cellRendererRegistry = {
    ...defaultCellRenderers,
};
