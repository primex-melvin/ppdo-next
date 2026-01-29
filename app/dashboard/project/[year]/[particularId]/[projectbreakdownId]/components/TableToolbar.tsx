"use client";

import { Search, Trash2, Printer, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ResponsiveMoreMenu } from "@/components/shared/table/ResponsiveMoreMenu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface TableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onPrint: () => void;
  onAdd?: () => void;
  onOpenTrash?: () => void;
  accentColor: string;
}

export function TableToolbar({
  search,
  onSearchChange,
  onPrint,
  onAdd,
  onOpenTrash,
  accentColor,
}: TableToolbarProps) {
  return (
    <div className="h-16 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 no-print">
      {/* Search Input */}
      <div className="relative max-w-xs w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          className="w-full h-9 pl-9 pr-3 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-all"
          placeholder="Search..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      {/* RIGHT Actions */}
      <div className="flex items-center gap-2">

        {/* --- DESKTOP --- */}
        <div className="hidden sm:flex items-center gap-2">
          {onOpenTrash && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onOpenTrash}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden md:inline">Recycle Bin</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Recycle Bin</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onPrint}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden md:inline">Print</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* --- MOBILE MORE MENU --- */}
        <div className="flex sm:hidden">
          <ResponsiveMoreMenu>
            {onOpenTrash && (
              <DropdownMenuItem onClick={onOpenTrash}>
                <Trash2 className="w-4 h-4 mr-2" />
                Recycle Bin
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onPrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </DropdownMenuItem>
          </ResponsiveMoreMenu>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        {onAdd && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onAdd}
                  size="sm"
                  className="gap-2 text-white shadow-sm"
                  style={{ backgroundColor: accentColor }}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Record</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add New Record</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}