
"use client";

import { useMemo } from "react";
import {
    ResizableTableContainer,
    ResizableTableHeader,
    ResizableTableRow,
    useResizableColumns,
    ColumnConfig,
    DEFAULT_ROW_HEIGHT,
} from "../core";
import { TWENTY_PERCENT_DF_COLUMNS } from "../configs";
import {
    TwentyPercentDFNameCell,
    TwentyPercentDFStatusCell,
    TwentyPercentDFAmountCell,
    FundRemarksCell,
} from "../cells";
import { Edit, Trash2, Pin, Eye, MoreHorizontal, Calculator, FolderInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercentage } from "../core/utils/formatters";
import { Checkbox } from "@/components/ui/checkbox";
import React from "react";
import type { TwentyPercentDF, TwentyPercentDFTotals, GroupedTwentyPercentDF, ProjectCategory } from "@/components/features/ppdo/odpp/table-pages/twenty-percent-df/types";

interface TwentyPercentDFTableProps {
    data: TwentyPercentDF[];
    groupedData?: [string, GroupedTwentyPercentDF][];
    totals: TwentyPercentDFTotals;
    hiddenColumns?: Set<string>;
    onRowClick: (item: TwentyPercentDF, e: React.MouseEvent) => void;
    onEdit?: (item: TwentyPercentDF) => void;
    onDelete?: (item: TwentyPercentDF) => void;
    onPin?: (item: TwentyPercentDF) => void;
    onToggleAutoCalculate?: (item: TwentyPercentDF) => void;
    onChangeCategory?: (item: TwentyPercentDF) => void;
    onViewLog?: (item: TwentyPercentDF) => void;
    selectedIds?: Set<string>;
    onSelectRow?: (id: string, checked: boolean) => void;
    onSelectAll?: (checked: boolean) => void;
    onSelectCategory?: (projects: TwentyPercentDF[], checked: boolean) => void;
    /** Callback to check if a row is highlighted (from useAutoScrollHighlight) */
    isHighlighted?: (id: string) => boolean;
    onContextMenu?: (item: TwentyPercentDF, e: React.MouseEvent) => void;
}

// Category header style helper
function getCategoryHeaderStyle(category: ProjectCategory | null) {
    if (!category || !category.colorCode) {
        return { backgroundColor: "#71717a", color: "#fff" };
    }
    return { backgroundColor: category.colorCode, color: "#fff" };
}

// Totals Row Component
interface TwentyPercentDFResizableTotalsRowProps {
    columns: ColumnConfig[];
    totals: TwentyPercentDFTotals;
}

function TwentyPercentDFResizableTotalsRow({ columns, totals }: TwentyPercentDFResizableTotalsRowProps) {
    return (
        <tr className="sticky bottom-0 bg-zinc-50 dark:bg-zinc-800 font-bold z-20 shadow-[0_-1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_-1px_0_0_rgba(255,255,255,0.1)]">
            <td className="text-center py-2" style={{ border: '1px solid rgb(228 228 231 / 1)' }} />
            <td className="text-center py-2 text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-200" style={{ border: '1px solid rgb(228 228 231 / 1)' }} />
            {columns.map(column => {
                let cellContent: React.ReactNode = "";
                if (column.key === "totalBudgetAllocated") {
                    cellContent = formatCurrency(totals.totalBudgetAllocated);
                } else if (column.key === "totalBudgetUtilized") {
                    cellContent = formatCurrency(totals.totalBudgetUtilized);
                } else if (column.key === "utilizationRate") {
                    cellContent = (
                        <span className={cn(totals.utilizationRate >= 100 ? "text-green-600 dark:text-green-400" : "")}>
                            {formatPercentage(totals.utilizationRate)}
                        </span>
                    );
                } else if (column.key === "projectCompleted") {
                    cellContent = Math.round(totals.projectCompleted).toString();
                } else if (column.key === "projectDelayed") {
                    cellContent = Math.round(totals.projectDelayed).toString();
                } else if (column.key === "projectsOngoing") {
                    cellContent = Math.round(totals.projectsOngoing).toString();
                } else if (column.key === "particulars") {
                    cellContent = "TOTALS";
                }

                return (
                    <td
                        key={column.key as string}
                        className="px-2 sm:px-3 py-2 text-[11px] sm:text-xs text-zinc-800 dark:text-zinc-200"
                        style={{ border: '1px solid rgb(228 228 231 / 1)', textAlign: column.align }}
                    >
                        {cellContent}
                    </td>
                );
            })}
            <td className="text-center" style={{ border: '1px solid rgb(228 228 231 / 1)' }} />
        </tr>
    );
}

export function TwentyPercentDFTable({
    data,
    groupedData,
    totals,
    hiddenColumns,
    onRowClick,
    onEdit,
    onDelete,
    onPin,
    onToggleAutoCalculate,
    onChangeCategory,
    onViewLog,
    selectedIds,
    onSelectRow,
    onSelectAll,
    onSelectCategory,
    isHighlighted,
    onContextMenu,
}: TwentyPercentDFTableProps) {
    const {
        columns: allColumns,
        columnWidths,
        rowHeights,
        canEditLayout,
        startResizeColumn,
        startResizeRow,
        onDragStart,
        onDrop,
        onDragOver
    } = useResizableColumns({
        tableIdentifier: "twentyPercentDFTable_v2",
        defaultColumns: TWENTY_PERCENT_DF_COLUMNS
    });

    const visibleColumns = useMemo(() => {
        if (!hiddenColumns) return allColumns;
        return allColumns.filter(col => !hiddenColumns.has(col.key as string));
    }, [allColumns, hiddenColumns]);

    const renderCell = (item: TwentyPercentDF, column: ColumnConfig) => {
        switch (column.key) {
            case "particulars":
                return <TwentyPercentDFNameCell item={item} onPin={onPin} onClick={(e: React.MouseEvent) => onRowClick(item, e)} />;
            case "status":
                return <TwentyPercentDFStatusCell item={item} />;
            case "totalBudgetAllocated":
                return <TwentyPercentDFAmountCell value={item.totalBudgetAllocated} />;
            case "totalBudgetUtilized":
                return <TwentyPercentDFAmountCell value={item.totalBudgetUtilized} />;
            case "utilizationRate":
                return <TwentyPercentDFAmountCell value={item.utilizationRate} type="percentage" />;
            case "year":
                return <span className="font-semibold">{item.year}</span>;
            case "implementingOffice":
                return <span className="truncate block" title={item.implementingOffice}>{item.implementingOffice}</span>;
            case "remarks":
                return <FundRemarksCell remarks={item.remarks} />;
            default:
                return <span className="truncate block">{(item as any)[column.key] || "-"}</span>;
        }
    };

    const renderActions = (item: TwentyPercentDF) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRowClick(item, e as any); }}>
                    <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                    View Details
                </DropdownMenuItem>

                {onViewLog && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewLog(item); }}>
                        <MoreHorizontal className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        View History
                    </DropdownMenuItem>
                )}

                {onPin && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(item); }}>
                        <Pin className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        {item.isPinned ? "Unpin Project" : "Pin Project"}
                    </DropdownMenuItem>
                )}

                {onToggleAutoCalculate && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleAutoCalculate(item); }}>
                        <Calculator className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        {item.autoCalculateBudgetUtilized ? "Disable Auto-Calc" : "Enable Auto-Calc"}
                    </DropdownMenuItem>
                )}

                {onChangeCategory && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onChangeCategory(item); }}>
                        <FolderInput className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        Change Category
                    </DropdownMenuItem>
                )}

                {(onEdit || onDelete) && <DropdownMenuSeparator />}

                {onEdit && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
                        <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        Edit Project
                    </DropdownMenuItem>
                )}

                {onDelete && (
                    <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Move to Trash
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const isAllSelected = selectedIds && data.length > 0 && selectedIds.size === data.length;
    const isIndeterminate = selectedIds && selectedIds.size > 0 && data.length > 0 && selectedIds.size < data.length;

    const groups: [string, GroupedTwentyPercentDF][] = groupedData && groupedData.length > 0
        ? groupedData
        : [['default', { category: null, projects: data }]];

    return (
        <ResizableTableContainer>
            <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <ResizableTableHeader
                    columns={visibleColumns}
                    columnWidths={columnWidths}
                    canEditLayout={canEditLayout}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onStartResize={startResizeColumn}
                    isAllSelected={isAllSelected}
                    isIndeterminate={isIndeterminate}
                    onSelectAll={onSelectAll}
                />
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={visibleColumns.length + 3} className="px-4 py-8 text-center text-zinc-500">
                                No Twenty Percent Development Funds found
                            </td>
                        </tr>
                    ) : (
                        groups.map(([categoryId, group]) => {
                            const groupIds = group.projects.map(p => p.id);
                            const groupSelectedCount = groupIds.filter(id => selectedIds?.has(id)).length;
                            const isGroupAllSelected = groupIds.length > 0 && groupSelectedCount === groupIds.length;
                            const isGroupIndeterminate = groupSelectedCount > 0 && !isGroupAllSelected;
                            const headerStyle = getCategoryHeaderStyle(group.category);
                            const showHeader = groupedData && groupedData.length > 0;

                            return (
                                <React.Fragment key={categoryId}>
                                    {showHeader && (
                                        <tr className="bg-zinc-50 dark:bg-zinc-900 border-t-2 border-zinc-100 dark:border-zinc-800">
                                            {onSelectAll && (
                                                <td className="px-2 py-2 text-center border-r border-zinc-200 dark:border-zinc-700" style={headerStyle}>
                                                    <div className="flex justify-center items-center">
                                                        <Checkbox
                                                            checked={isGroupAllSelected}
                                                            onCheckedChange={(checked) => onSelectCategory?.(group.projects, checked as boolean)}
                                                            className={cn(
                                                                "border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black",
                                                                isGroupIndeterminate ? "opacity-70" : ""
                                                            )}
                                                        />
                                                    </div>
                                                </td>
                                            )}
                                            <td
                                                colSpan={visibleColumns.length + 2}
                                                className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-left border-l-0"
                                                style={headerStyle}
                                            >
                                                {group.category ? group.category.fullName : "Uncategorized"}
                                                <span className="opacity-80 ml-2 font-normal normal-case">
                                                    ({group.projects.length} {group.projects.length === 1 ? 'project' : 'projects'})
                                                </span>
                                            </td>
                                        </tr>
                                    )}
                                    {group.projects.map((item, index) => (
                                        <ResizableTableRow
                                            key={item.id}
                                            data={{ ...item, _id: item.id }}
                                            index={index}
                                            columns={visibleColumns}
                                            columnWidths={columnWidths}
                                            rowHeight={rowHeights[item.id] ?? DEFAULT_ROW_HEIGHT}
                                            canEditLayout={canEditLayout}
                                            renderCell={renderCell}
                                            renderActions={renderActions}
                                            onRowClick={(rowItem, e) => onRowClick(rowItem as TwentyPercentDF, e)}
                                            onContextMenu={onContextMenu ? (rowItem, e) => onContextMenu(rowItem as TwentyPercentDF, e) : undefined}
                                            onStartRowResize={startResizeRow}
                                            isSelected={selectedIds?.has(item.id)}
                                            onSelectRow={onSelectRow}
                                            isHighlighted={isHighlighted?.(item.id)}
                                        />
                                    ))}
                                </React.Fragment>
                            );
                        })
                    )}
                    <TwentyPercentDFResizableTotalsRow columns={visibleColumns} totals={totals} />
                </tbody>
            </table>
        </ResizableTableContainer>
    );
}