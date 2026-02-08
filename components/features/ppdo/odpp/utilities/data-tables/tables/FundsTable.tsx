
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
import { FUNDS_TABLE_COLUMNS } from "../configs";
import {
    FundTitleCell,
    FundStatusCell,
    FundAmountCell,
    FundDateCell,
    FundRemarksCell,
} from "../cells";
import { Edit, Trash2, Pin, Eye, MoreHorizontal, FlaskConical } from "lucide-react";
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
import type { BaseFund } from "@/components/features/ppdo/odpp/table-pages/funds/types";

interface FundsTableProps<T extends BaseFund> {
    data: T[];
    totals: {
        received: number;
        obligatedPR: number;
        utilized: number;
        balance: number;
        utilizationRate: number;
    };
    fundType: string;
    hiddenColumns?: Set<string>;
    onRowClick: (item: T, e: React.MouseEvent) => void;
    onEdit?: (item: T) => void;
    onDelete?: (item: T) => void;
    onPin?: (item: T) => void;
    onStatusChange: (itemId: string, newStatus: string) => Promise<void>;
    onToggleAutoCalculate?: (id: string) => void;
    onViewLog?: (item: T) => void;
    selectedIds?: Set<string>;
    onSelectRow?: (id: string, checked: boolean) => void;
    onSelectAll?: (checked: boolean) => void;
    /** Callback to check if a row is highlighted (from useAutoScrollHighlight) */
    isHighlighted?: (id: string) => boolean;
}

// Totals Row Component
interface FundsResizableTotalsRowProps {
    columns: ColumnConfig[];
    totals: {
        received: number;
        obligatedPR: number;
        utilized: number;
        balance: number;
        utilizationRate: number;
    };
}

function FundsResizableTotalsRow({ columns, totals }: FundsResizableTotalsRowProps) {
    return (
        <tr className="sticky bottom-0 bg-zinc-50 dark:bg-zinc-800 font-bold z-20 shadow-[0_-1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_-1px_0_0_rgba(255,255,255,0.1)]">
            <td className="text-center py-2" style={{ border: '1px solid rgb(228 228 231 / 1)' }} />
            <td className="text-center py-2 text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-200" style={{ border: '1px solid rgb(228 228 231 / 1)' }} />
            {columns.map(column => {
                let cellContent: React.ReactNode = "";
                if (column.key === "received") {
                    cellContent = formatCurrency(totals.received);
                } else if (column.key === "utilized") {
                    cellContent = formatCurrency(totals.utilized);
                } else if (column.key === "balance") {
                    cellContent = formatCurrency(totals.balance);
                } else if (column.key === "utilizationRate") {
                    const rate = totals.utilizationRate || 0;
                    cellContent = (
                        <span className={cn(rate >= 100 ? "text-green-600 dark:text-green-400" : "")}>
                            {formatPercentage(rate)}
                        </span>
                    );
                } else if (column.key === "projectTitle") {
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

export function FundsTable<T extends BaseFund>({
    data,
    totals,
    fundType,
    hiddenColumns,
    onRowClick,
    onEdit,
    onDelete,
    onPin,
    onStatusChange,
    onToggleAutoCalculate,
    onViewLog,
    selectedIds,
    onSelectRow,
    onSelectAll,
    isHighlighted,
}: FundsTableProps<T>) {
    // Map fundType to the correct table identifier used in backend defaults
    const tableIdentifier = fundType === 'trust' 
        ? 'trustFundsTable' 
        : fundType === 'specialEducation' 
            ? 'sefTable' 
            : fundType === 'specialHealth' 
                ? 'shfTable' 
                : `${fundType}Table`;

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
        tableIdentifier,
        defaultColumns: FUNDS_TABLE_COLUMNS
    });

    const visibleColumns = useMemo(() => {
        if (!hiddenColumns) return allColumns;
        return allColumns.filter(col => !hiddenColumns.has(col.key as string));
    }, [allColumns, hiddenColumns]);

    const renderCell = (item: T, column: ColumnConfig) => {
        const fundItem = item as unknown as BaseFund;
        switch (column.key) {
            case "projectTitle":
                return <FundTitleCell item={fundItem} onPin={onPin as (item: BaseFund) => void} onClick={(e) => onRowClick(item, e)} />;
            case "status":
                return <FundStatusCell item={fundItem} onStatusChange={onStatusChange} />;
            case "received":
                return <FundAmountCell value={fundItem.received} />;
            case "obligatedPR":
                return <FundAmountCell value={fundItem.obligatedPR} />;
            case "utilized":
                return <FundAmountCell value={fundItem.utilized} />;
            case "balance":
                return <FundAmountCell value={fundItem.balance} />;
            case "utilizationRate":
                return <FundAmountCell value={fundItem.utilizationRate} type="percentage" />;
            case "dateReceived":
                return <FundDateCell value={fundItem.dateReceived} />;
            case "officeInCharge":
                return <span className="truncate block" title={fundItem.officeInCharge}>{fundItem.officeInCharge}</span>;
            case "remarks":
                return <FundRemarksCell remarks={fundItem.remarks} />;
            default:
                return <span className="truncate block">{(fundItem as any)[column.key] || "-"}</span>;
        }
    };

    const renderActions = (item: T) => (
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
                        {item.isPinned ? "Unpin Fund" : "Pin Fund"}
                    </DropdownMenuItem>
                )}

                {onToggleAutoCalculate && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleAutoCalculate(item.id); }}>
                        <FlaskConical className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        {item.autoCalculateFinancials ? "Disable Auto-Calc" : "Enable Auto-Calc"}
                    </DropdownMenuItem>
                )}

                {(onEdit || onDelete) && <DropdownMenuSeparator />}

                {onEdit && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
                        <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        Edit Fund
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
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={visibleColumns.length + 3} className="px-4 py-8 text-center text-zinc-500">
                                No funds found
                            </td>
                        </tr>
                    ) : (
                        <>
                            {data.map((item, index) => (
                                <ResizableTableRow
                                    key={item.id}
                                    data={{ ...item, _id: item.id }}
                                    index={index}
                                    columns={visibleColumns}
                                    columnWidths={columnWidths}
                                    rowHeight={rowHeights[item.id] ?? DEFAULT_ROW_HEIGHT}
                                    canEditLayout={canEditLayout}
                                    renderCell={(itm, col) => renderCell(itm as T, col)}
                                    renderActions={(itm) => renderActions(itm as T)}
                                    onRowClick={(rowItem, e) => onRowClick(rowItem as T, e)}
                                    onStartRowResize={startResizeRow}
                                    isSelected={selectedIds?.has(item.id)}
                                    onSelectRow={onSelectRow}
                                    isHighlighted={isHighlighted?.(item.id)}
                                />
                            ))}
                            <FundsResizableTotalsRow columns={visibleColumns} totals={totals} />
                        </>
                    )}
                </tbody>
            </table>
        </ResizableTableContainer>
    );
}