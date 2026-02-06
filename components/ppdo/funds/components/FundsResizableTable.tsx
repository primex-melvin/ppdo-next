"use client";

import { useMemo } from "react";
import {
    ResizableTableContainer,
    ResizableTableHeader,
    ResizableTableRow,
    useResizableColumns,
    ColumnConfig,
} from "@/components/ppdo/shared/table";
import { FUNDS_TABLE_COLUMNS } from "../constants/fundsTableColumns";
import { BaseFund, FundStatistics } from "@/components/ppdo/funds/types";
import { FundsResizableTotalsRow } from "./FundsResizableTotalsRow";
import {
    FundTitleCell,
    FundStatusCell,
    FundAmountCell,
    FundDateCell,
    FundRemarksCell
} from "./cells";
import { Edit, Trash2, Pin, Eye, MoreHorizontal, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_ROW_HEIGHT } from "@/components/ppdo/shared/table/constants/table.constants";

interface FundsResizableTableProps<T extends BaseFund> {
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
}

export function FundsResizableTable<T extends BaseFund>({
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
}: FundsResizableTableProps<T>) {

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
        tableIdentifier: `${fundType}Table`, // Unique identifier for localStorage
        defaultColumns: FUNDS_TABLE_COLUMNS
    });

    // Filter columns based on hiddenColumns
    const visibleColumns = useMemo(() => {
        if (!hiddenColumns) return allColumns;
        return allColumns.filter(col => !hiddenColumns.has(col.key as string));
    }, [allColumns, hiddenColumns]);

    // Cell renderer
    const renderCell = (item: T, column: ColumnConfig) => {
        switch (column.key) {
            case "projectTitle":
                return <FundTitleCell item={item} onPin={onPin as (item: BaseFund) => void} onClick={(e) => onRowClick(item, e)} />;
            case "status":
                return <FundStatusCell item={item} onStatusChange={onStatusChange} />;
            case "received":
                return <FundAmountCell value={item.received} />;
            case "obligatedPR":
                return <FundAmountCell value={item.obligatedPR} />;
            case "utilized":
                return <FundAmountCell value={item.utilized} />;
            case "balance":
                return <FundAmountCell value={item.balance} />;
            case "utilizationRate":
                return <FundAmountCell value={item.utilizationRate} type="percentage" />;
            case "dateReceived":
                return <FundDateCell value={item.dateReceived} />;
            case "officeInCharge":
                return <span className="truncate block" title={item.officeInCharge}>{item.officeInCharge}</span>;
            case "remarks":
                return <FundRemarksCell remarks={item.remarks} />;
            default:
                // Generic fallback
                return <span className="truncate block">{(item as any)[column.key] || "-"}</span>;
        }
    };

    // Actions renderer
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
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRowClick(item, e); }}>
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
                                    data={{ ...item, _id: item.id }} // Adapter for _id vs id
                                    index={index}
                                    columns={visibleColumns}
                                    rowHeight={rowHeights[item.id] ?? DEFAULT_ROW_HEIGHT}
                                    canEditLayout={canEditLayout}
                                    renderCell={(itm, col) => renderCell(itm as T, col)}
                                    renderActions={(itm) => renderActions(itm as T)}
                                    onRowClick={(rowItem, e) => onRowClick(rowItem as T, e)}
                                    onStartRowResize={startResizeRow}
                                    isSelected={selectedIds?.has(item.id)}
                                    onSelectRow={onSelectRow}
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
