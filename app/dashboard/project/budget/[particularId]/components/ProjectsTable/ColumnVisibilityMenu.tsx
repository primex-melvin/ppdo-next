// app/dashboard/project/budget/[particularId]/components/ProjectsTable/ColumnVisibilityMenu.tsx

import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableColumn } from "../../types";
import { AVAILABLE_COLUMNS } from "../../constants";

interface ColumnVisibilityMenuProps {
  hiddenColumns: Set<string>;
  onToggleColumn: (columnId: string, isChecked: boolean) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

/**
 * Dropdown menu for controlling column visibility
 */
export function ColumnVisibilityMenu({
  hiddenColumns,
  onToggleColumn,
  onShowAll,
  onHideAll,
}: ColumnVisibilityMenuProps) {
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
          {AVAILABLE_COLUMNS.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={!hiddenColumns.has(column.id)}
              onCheckedChange={(checked) => onToggleColumn(column.id, checked)}
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
            className="w-full h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={hiddenColumns.size === AVAILABLE_COLUMNS.length}
          >
            Hide All
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}