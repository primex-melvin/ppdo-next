"use client";

import { useMemo } from "react";
import {
    ResizableTableContainer,
    ResizableTableHeader,
    ResizableTableRow,
    useResizableColumns,
    ColumnConfig,
} from "@/components/ppdo/shared/table";
import { BUDGET_TABLE_COLUMNS } from "../constants/budgetTableColumns";
import { BudgetItem } from "../types/budget.types";
import { BudgetResizableTotalsRow } from "./BudgetResizableTotalsRow";
import {
    BudgetParticularCell,
    BudgetStatusCell,
    BudgetAmountCell,
    BudgetCountCell
} from "./cells";
import { Edit, Trash2, Pin, Eye, MoreHorizontal, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_ROW_HEIGHT } from "@/components/ppdo/shared/table/constants/table.constants";
import { BudgetTableEmptyState } from "../table/BudgetTableEmptyState";

interface BudgetResizableTableProps {
    budgetItems: BudgetItem[];
    hiddenColumns?: Set<string>;
    onRowClick: (item: BudgetItem, e: React.MouseEvent) => void;
    onEdit?: (id: string, item: any) => void; // BudgetTrackingTable uses (id, formData) or similar, but here we just need to trigger modal with item
    onDelete?: (id: string) => void;
    onPin?: (item: BudgetItem) => void;
    onToggleAutoCalculate?: (item: BudgetItem, newValue: boolean) => void;
    selectedIds?: Set<string>;
    onSelectRow?: (id: string, checked: boolean) => void;
    onSelectAll?: (checked: boolean) => void;
}

export function BudgetResizableTable({
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
}: BudgetResizableTableProps) {

    // Use shared resizable columns hook
    const {
        columns: allColumns,
        rowHeights,
        canEditLayout,
        startResizeColumn,
        startResizeRow,
        onDragStart,
        onDrop,
        onDragOver
    } = useResizableColumns({
        tableIdentifier: "budgetItemsTable_v2", // Unique identifier for localStorage
        defaultColumns: BUDGET_TABLE_COLUMNS
    });

    // Filter columns based on hiddenColumns
    const visibleColumns = useMemo(() => {
        if (!hiddenColumns) return allColumns;
        return allColumns.filter(col => !hiddenColumns.has(col.key as string));
    }, [allColumns, hiddenColumns]);

    // Cell renderer
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
                // Generic fallback
                return <span className="truncate block">{(item as any)[column.key] || "-"}</span>;
        }
    };

    // Actions renderer
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
                        // Note: BudgetItem needs to have autoCalculateBudgetUtilized property in type
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
                        // The onEdit prop in BudgetTrackingTable expects (id, formData) but here we typically just want to open the modal
                        // We will adjust the parent to handle this or pass the item directly
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
            <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <ResizableTableHeader
                    columns={visibleColumns}
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
                                    data={{ ...item, _id: item.id }} // Adapter for _id vs id
                                    index={index}
                                    columns={visibleColumns}
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
