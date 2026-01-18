// app/dashboard/project/budget/components/table/BudgetColumnVisibilityMenu.tsx

import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BUDGET_TABLE_COLUMNS } from "../../constants";

interface BudgetColumnVisibilityMenuProps {
  hiddenColumns: Set<string>;
  onToggleColumn: (columnId: string, isChecked: boolean) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

/**
 * Dropdown menu for controlling budget table column visibility
 */
export function BudgetColumnVisibilityMenu({
  hiddenColumns,
  onToggleColumn,
  onShowAll,
  onHideAll,
}: BudgetColumnVisibilityMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LayoutTemplate className="w-4 h-4" />
          Columns
          {hiddenColumns.size > 0 && (
            <span className="ml-0.5 text-xs text-zinc-500">
              ({hiddenColumns.size} hidden)
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="max-h-[300px] overflow-y-auto">
          {BUDGET_TABLE_COLUMNS.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.key}
              checked={!hiddenColumns.has(column.key)}
              onCheckedChange={(checked) => onToggleColumn(column.key, checked)}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
        
        <DropdownMenuSeparator />
        
        <div className="p-2 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowAll}
            className="w-full h-7 text-xs"
            disabled={hiddenColumns.size === 0}
          >
            Show All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onHideAll}
            className="w-full h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            disabled={hiddenColumns.size === BUDGET_TABLE_COLUMNS.length}
          >
            Hide All
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}