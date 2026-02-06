
"use client";

import { Filter, GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ProjectSortField, SortDirection } from "../../types";
import { AVAILABLE_COLUMNS, DEFAULT_COLUMN_WIDTHS } from "../../constants";
import { SortIcon } from "./SortIcon";

interface ColumnWidths {
    [key: string]: number | undefined;
}

interface ProjectsTableHeaderProps {
    hiddenColumns: Set<string>;
    sortField: ProjectSortField | null;
    sortDirection: SortDirection;
    onSort: (field: ProjectSortField) => void;
    canManageBulkActions: boolean;
    isAllSelected: boolean;
    isIndeterminate: boolean;
    onSelectAll: (checked: boolean) => void;
    onFilterClick?: (column: string) => void;
    activeFilterColumn?: string | null;
    // Column resizing props (optional for backward compatibility)
    columnWidths?: ColumnWidths;
    onResizeStart?: (column: string, e: React.MouseEvent) => void;
    canEditLayout?: boolean;
}

/**
 * Table header with column names, sorting, and selection
 */
export function ProjectsTableHeader({
    hiddenColumns,
    sortField,
    sortDirection,
    onSort,
    canManageBulkActions,
    isAllSelected,
    isIndeterminate,
    onSelectAll,
    onFilterClick,
    activeFilterColumn,
    columnWidths,
    onResizeStart,
    canEditLayout = false,
}: ProjectsTableHeaderProps) {
    const getColumnWidth = (columnId: string) => {
        if (!columnWidths) return undefined;
        return columnWidths[columnId] ?? DEFAULT_COLUMN_WIDTHS[columnId as keyof typeof DEFAULT_COLUMN_WIDTHS];
    };

    const renderHeaderCell = (column: typeof AVAILABLE_COLUMNS[0]) => {
        const isSortable = column.sortable;
        const isFilterable = column.filterable;

        if (isSortable) {
            return (
                <button
                    onClick={() => onSort(column.id as ProjectSortField)}
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                    {column.label}
                    <SortIcon
                        field={column.id as ProjectSortField}
                        currentSortField={sortField}
                        currentSortDirection={sortDirection}
                    />
                </button>
            );
        }

        if (isFilterable && onFilterClick) {
            return (
                <button
                    onClick={() => onFilterClick(column.id)}
                    className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                    {column.label}
                    <Filter
                        className={`w-3.5 h-3.5 ${activeFilterColumn === column.id
                                ? 'text-blue-600'
                                : 'opacity-50'
                            }`}
                    />
                </button>
            );
        }

        return (
            <span className="text-xs font-semibold uppercase tracking-wide">
                {column.label}
            </span>
        );
    };

    return (
        <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                {/* Checkbox Column */}
                {canManageBulkActions && (
                    <th className="w-10 px-3 py-3 text-center sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-20">
                        <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={onSelectAll}
                            aria-label="Select all"
                            className={isIndeterminate ? "opacity-50" : ""}
                        />
                    </th>
                )}

                {/* Data Columns */}
                {AVAILABLE_COLUMNS.map((column) => {
                    if (hiddenColumns.has(column.id)) return null;

                    const width = getColumnWidth(column.id);
                    const isResizable = column.id === 'particulars' || column.id === 'implementingOffice';

                    return (
                        <th
                            key={column.id}
                            className={`px-3 py-3 sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10 ${column.align === 'right' ? 'text-right' :
                                    column.align === 'center' ? 'text-center' :
                                        'text-left'
                                }`}
                            style={width ? { width: `${width}px`, minWidth: `${width}px` } : undefined}
                        >
                            <div className="relative flex items-center gap-2">
                                {renderHeaderCell(column)}
                                {isResizable && canEditLayout && onResizeStart && (
                                    <button
                                        className="absolute right-0 cursor-col-resize text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-0.5"
                                        onMouseDown={(e) => onResizeStart(column.id, e)}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <GripVertical className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </th>
                    );
                })}
            </tr>
        </thead>
    );
}
