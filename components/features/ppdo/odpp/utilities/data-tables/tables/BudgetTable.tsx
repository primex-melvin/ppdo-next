
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
import { BUDGET_TABLE_COLUMNS } from "../configs";
import {
    BudgetParticularCell,
    BudgetStatusCell,
    BudgetAmountCell,
    BudgetCountCell,
} from "../cells";
import { Edit, Trash2, Pin, Eye, MoreHorizontal, Calculator } from "lucide-react";
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
import type { BudgetItem } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/types/budget.types";

interface BudgetTableProps {
    budgetItems: BudgetItem[];
    hiddenColumns?: Set<string>;
    onRowClick: (item: BudgetItem, e: React.MouseEvent) => void;
    onEdit?: (id: string, item: any) => void;
    onDelete?: (id: string) => void;
    onPin?: (item: BudgetItem) => void;
    onToggleAutoCalculate?: (item: BudgetItem, newValue: boolean) => void;
    selectedIds?: Set<string>;
    onSelectRow?: (id: string, checked: boolean) => void;
    onSelectAll?: (checked: boolean) => void;
}

// Empty State Component
function BudgetTableEmptyState() {
    return (
        <tr>
            <td colSpan={100} className="px-4 py-8 text-center text-zinc-500">
                No budget items found
            </td>
        </tr>
    );
}

// Totals Row Component
interface BudgetResizableTotalsRowProps {
    columns: ColumnConfig[];
    budgetItems: BudgetItem[];
}

function BudgetResizableTotalsRow({ columns, budgetItems }: BudgetResizableTotalsRowProps) {
    const totals = budgetItems.reduce((acc, item) => {
        acc.totalBudgetAllocated = (acc.totalBudgetAllocated || 0) + (item.totalBudgetAllocated || 0);
        acc.obligatedBudget = (acc.obligatedBudget || 0) + (item.obligatedBudget || 0);
        acc.totalBudgetUtilized = (acc.totalBudgetUtilized || 0) + (item.totalBudgetUtilized || 0);
        acc.projectCompleted = (acc.projectCompleted || 0) + (item.projectCompleted || 0);
        acc.projectDelayed = (acc.projectDelayed || 0) + (item.projectDelayed || 0);
        acc.projectsOngoing = (acc.projectsOngoing || 0) + (item.projectsOngoing || 0);
        return acc;
    }, {
        totalBudgetAllocated: 0,
        obligatedBudget: 0,
        totalBudgetUtilized: 0,
        projectCompleted: 0,
        projectDelayed: 0,
        projectsOngoing: 0
    });

    const utilizationRate = totals.totalBudgetAllocated > 0
        ? (totals.totalBudgetUtilized / totals.totalBudgetAllocated) * 100
        : 0;

    return (
        <tr className="sticky bottom-0 bg-zinc-50 dark:bg-zinc-800 font-bold z-20 shadow-[0_-1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_-1px_0_0_rgba(255,255,255,0.1)]">
            <td className="text-center py-2" style={{ border: '1px solid rgb(228 228 231 / 1)' }} />
            <td className="text-center py-2 text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-200" style={{ border: '1px solid rgb(228 228 231 / 1)' }} />
            {columns.map(column => {
                let cellContent: React.ReactNode = "";
                if (column.key === "totalBudgetAllocated") {
                    cellContent = formatCurrency(totals.totalBudgetAllocated);
                } else if (column.key === "obligatedBudget") {
                    cellContent = formatCurrency(totals.obligatedBudget);
                } else if (column.key === "totalBudgetUtilized") {
                    cellContent = formatCurrency(totals.totalBudgetUtilized);
                } else if (column.key === "utilizationRate") {
                    cellContent = (
                        <span className={cn(utilizationRate >= 100 ? "text-green-600 dark:text-green-400" : "")}>
                            {formatPercentage(utilizationRate)}
                        </span>
                    );
                } else if (column.key === "projectCompleted") {
                    cellContent = totals.projectCompleted;
                } else if (column.key === "projectDelayed") {
                    cellContent = totals.projectDelayed;
                } else if (column.key === "projectsOngoing") {
                    cellContent = totals.projectsOngoing;
                } else if (column.key === "particular") {
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

export function BudgetTable({
    budgetItems,
    hiddenColumns,
    onRowClick,
    onEdit,
    onDelete,
    onPin,
    onToggleAutoCalculate,
    selectedIds,
    onSelectRow,
    onSelectAll,
}: BudgetTableProps) {
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
        tableIdentifier: "budgetItemsTable_v2",
        defaultColumns: BUDGET_TABLE_COLUMNS
    });

    const visibleColumns = useMemo(() => {
        if (!hiddenColumns) return allColumns;
        return allColumns.filter(col => !hiddenColumns.has(col.key as string));
    }, [allColumns, hiddenColumns]);

    const renderCell = (item: BudgetItem, column: ColumnConfig) => {
        switch (column.key) {
            case "particular":
                return <BudgetParticularCell item={item} />;
            case "status":
                return <BudgetStatusCell item={item} />;
            case "totalBudgetAllocated":
                return <BudgetAmountCell value={item.totalBudgetAllocated} />;
            case "obligatedBudget":
                return <BudgetAmountCell value={item.obligatedBudget} />;
            case "totalBudgetUtilized":
                return <BudgetAmountCell value={item.totalBudgetUtilized} />;
            case "utilizationRate":
                return <BudgetAmountCell value={item.utilizationRate} type="percentage" />;
            case "year":
                return <span className="font-semibold">{item.year}</span>;
            case "projectCompleted":
                return <BudgetCountCell value={item.projectCompleted} variant="success" />;
            case "projectDelayed":
                return <BudgetCountCell value={item.projectDelayed} variant="danger" />;
            case "projectsOngoing":
                return <BudgetCountCell value={item.projectsOngoing} variant="default" />;
            default:
                return <span className="truncate block">{(item as any)[column.key] || "-"}</span>;
        }
    };

    const renderActions = (item: BudgetItem) => (
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

                {onPin && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(item); }}>
                        <Pin className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        {item.isPinned ? "Unpin Item" : "Pin Item"}
                    </DropdownMenuItem>
                )}

                {onToggleAutoCalculate && (
                    <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onToggleAutoCalculate(item, !item.autoCalculateBudgetUtilized);
                    }}>
                        <Calculator className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        {item.autoCalculateBudgetUtilized ? "Disable Auto-Calc" : "Enable Auto-Calc"}
                    </DropdownMenuItem>
                )}

                {(onEdit || onDelete) && <DropdownMenuSeparator />}

                {onEdit && (
                    <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item.id, item);
                    }}>
                        <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        Edit Item
                    </DropdownMenuItem>
                )}

                {onDelete && (
                    <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Move to Trash
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const isAllSelected = selectedIds && budgetItems.length > 0 && selectedIds.size === budgetItems.length;
    const isIndeterminate = selectedIds && selectedIds.size > 0 && budgetItems.length > 0 && selectedIds.size < budgetItems.length;

    return (
        <ResizableTableContainer>
            <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: 'fit-content', minWidth: '100%' }}>
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
                    {budgetItems.length === 0 ? (
                        <BudgetTableEmptyState />
                    ) : (
                        <>
                            {budgetItems.map((item, index) => (
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
                                    onRowClick={(rowItem, e) => onRowClick(rowItem as unknown as BudgetItem, e)}
                                    onStartRowResize={startResizeRow}
                                    isSelected={selectedIds?.has(item.id)}
                                    onSelectRow={onSelectRow}
                                />
                            ))}
                            <BudgetResizableTotalsRow columns={visibleColumns} budgetItems={budgetItems} />
                        </>
                    )}
                </tbody>
            </table>
        </ResizableTableContainer>
    );
}