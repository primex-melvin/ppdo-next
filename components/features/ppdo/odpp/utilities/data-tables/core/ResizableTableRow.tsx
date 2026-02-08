
"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { ColumnConfig } from "./types/table.types";

interface ResizableTableRowProps<T extends { _id: string }> {
    data: T;
    index: number;
    columns: ColumnConfig[];
    rowHeight: number;
    canEditLayout: boolean;
    renderCell: (item: T, column: ColumnConfig) => React.ReactNode;
    renderActions?: (item: T) => React.ReactNode;

    onRowClick?: (item: T, event: React.MouseEvent) => void;
    onStartRowResize: (e: React.MouseEvent, rowId: string) => void;

    // Selection props
    isSelected?: boolean;
    onSelectRow?: (id: string, checked: boolean) => void;

    // Dynamic widths from resize hook
    columnWidths?: Map<string, number>;

    // Customization
    className?: string;

    // Highlight support for search deep-linking
    isHighlighted?: boolean;
}

export function ResizableTableRow<T extends { _id: string }>({
    data,
    index,
    columns,
    rowHeight,
    canEditLayout,
    renderCell,
    renderActions,
    onRowClick,
    onStartRowResize,
    isSelected = false,
    onSelectRow,
    columnWidths,
    className = "",
    isHighlighted = false,
}: ResizableTableRowProps<T>) {
    // Helper to get column width (use resized width if available, fallback to column config)
    const getColumnWidth = (column: ColumnConfig): number => {
        const key = String(column.key);
        if (columnWidths?.has(key)) {
            return columnWidths.get(key)!;
        }
        return column.width ?? 150;
    };

    return (
        <tr
            id={`row-${data._id}`}
            className={`cursor-pointer transition-colors ${isSelected
                ? "bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                : "bg-white dark:bg-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                } ${isHighlighted ? "highlight-row-active" : ""} ${className}`}
            style={{ height: rowHeight }}
            onClick={(e) => onRowClick?.(data, e)}
        >
            {/* Checkbox */}
            <td
                className="text-center px-2"
                style={{
                    border: '1px solid rgb(228 228 231 / 1)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {onSelectRow && (
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelectRow(data._id, checked as boolean)}
                        aria-label={`Select row ${index + 1}`}
                    />
                )}
            </td>

            {/* Row Number */}
            <td
                className="text-center text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 relative"
                style={{
                    border: '1px solid rgb(228 228 231 / 1)',
                }}
            >
                {index + 1}
                {canEditLayout && (
                    <div
                        className="absolute bottom-0 left-0 right-0 cursor-row-resize"
                        onMouseDown={e => onStartRowResize(e, data._id)}
                        style={{
                            height: '4px',
                            marginBottom: '-2px',
                            backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgb(59 130 246 / 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    />
                )}
            </td>

            {/* Data Cells */}
            {columns.map((column) => {
                const colWidth = getColumnWidth(column);
                return (
                    <td
                        key={column.key as string}
                        className="px-2 sm:px-3 py-2 text-[11px] sm:text-xs text-zinc-900 dark:text-zinc-100"
                        style={{
                            width: `${colWidth}px`,
                            minWidth: `${column.minWidth || 60}px`,
                            maxWidth: `${column.maxWidth || 600}px`,
                            border: '1px solid rgb(228 228 231 / 1)',
                            textAlign: column.align,
                            overflow: 'hidden',
                        }}
                    >
                        {renderCell(data, column)}
                    </td>
                );
            })}

            {/* Actions */}
            {renderActions && (
                <td
                    className="text-center"
                    style={{
                        border: '1px solid rgb(228 228 231 / 1)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {renderActions(data)}
                </td>
            )}
        </tr>
    );
}
