
"use client";

import { GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnConfig } from "./types/table.types";
import { EditableColumnLabel } from "./EditableColumnLabel";

interface ResizableTableHeaderProps {
    columns: ColumnConfig[];
    canEditLayout: boolean;
    onDragStart: (index: number) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (index: number) => void;
    onStartResize: (e: React.MouseEvent, index: number) => void;

    // Selection props
    isAllSelected?: boolean;
    isIndeterminate?: boolean;
    onSelectAll?: (checked: boolean) => void;

    // Customization
    showActionsColumn?: boolean;
    actionsColumnWidth?: number;

    // Dynamic widths calculated from flex
    columnWidths?: Map<string, number>;

    // Custom column names (system-wide, optional — backward compatible)
    columnCustomLabels?: Map<string, string>;
    isLoadingLabels?: boolean;
    onRenameColumn?: (columnKey: string, newLabel: string) => void;
}

export function ResizableTableHeader({
    columns,
    canEditLayout,
    onDragStart,
    onDragOver,
    onDrop,
    onStartResize,
    isAllSelected,
    isIndeterminate,
    onSelectAll,
    showActionsColumn = true,
    actionsColumnWidth = 64,
    columnWidths,
    columnCustomLabels,
    isLoadingLabels,
    onRenameColumn,
}: ResizableTableHeaderProps) {
    // Calculate width for a column (use dynamic width if available, fallback to flex-based)
    const getColumnWidth = (column: ColumnConfig): number => {
        if (columnWidths?.has(column.key as string)) {
            return columnWidths.get(column.key as string)!;
        }
        // Fallback: calculate from flex (approximate for SSR)
        const totalFlex = columns.reduce((sum, c) => sum + c.flex, 0);
        const avgWidth = 1200 / totalFlex; // Assume 1200px container
        return Math.round(column.flex * avgWidth);
    };
    return (
        <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800">
            <tr>
                {/* Checkbox Column */}
                <th
                    className="text-center py-2 px-2"
                    style={{
                        width: '40px',
                        border: '1px solid rgb(228 228 231 / 1)',
                    }}
                >
                    {onSelectAll && (
                        <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={onSelectAll}
                            aria-label="Select all"
                            className={isIndeterminate ? "opacity-50" : ""}
                        />
                    )}
                </th>

                {/* Row Number Column */}
                <th
                    className="text-center py-2 text-[11px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide"
                    style={{
                        width: '48px',
                        border: '1px solid rgb(228 228 231 / 1)',
                        borderColor: 'rgb(228 228 231 / 1)',
                    }}
                >
                    #
                </th>

                {/* Data Columns */}
                {columns.map((column, index) => (
                    <th
                        key={String(column.key)}
                        draggable={canEditLayout}
                        onDragStart={() => onDragStart(index)}
                        onDragOver={onDragOver}
                        onDrop={() => onDrop(index)}
                        className={`relative px-2 sm:px-3 py-2 text-zinc-700 dark:text-zinc-200 ${canEditLayout ? "cursor-move" : ""
                            }`}
                        style={{
                            width: `${getColumnWidth(column)}px`,
                            minWidth: `${column.minWidth || 60}px`,
                            border: '1px solid rgb(228 228 231 / 1)',
                            textAlign: column.align,
                        }}
                    >
                        <div className="flex items-center gap-1.5">
                            {canEditLayout && (
                                <GripVertical
                                    className="text-zinc-400 dark:text-zinc-500 flex-shrink-0"
                                    style={{ width: '12px', height: '12px' }}
                                />
                            )}

                            <EditableColumnLabel
                                columnKey={String(column.key)}
                                originalLabel={column.label}
                                customLabel={columnCustomLabels?.get(String(column.key))}
                                isLoading={isLoadingLabels ?? false}
                                canEdit={canEditLayout && !!onRenameColumn}
                                onSave={(key, label) => onRenameColumn?.(key, label)}
                            />
                        </div>

                        {canEditLayout && (
                            <div
                                className="absolute right-0 top-0 h-full cursor-col-resize z-10 hover:bg-blue-400/50"
                                onMouseDown={e => onStartResize(e, index)}
                                style={{
                                    width: '6px',
                                    marginRight: '-3px',
                                    backgroundColor: 'transparent',
                                    transition: 'background-color 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgb(59 130 246 / 0.6)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            />
                        )}
                    </th>
                ))}

                {/* Actions Column */}
                {showActionsColumn && (
                    <th
                        className="text-center py-2 text-[11px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wide"
                        style={{
                            width: `${actionsColumnWidth}px`,
                            border: '1px solid rgb(228 228 231 / 1)',
                        }}
                    >
                        Actions
                    </th>
                )}
            </tr>
        </thead>
    );
}
