"use client";

import React from "react";
import { Search, CheckCircle2, Trash2, Share2, X, Download, Eye, FileSpreadsheet, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BudgetColumnVisibilityMenu } from "./BudgetColumnVisibilityMenu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ResponsiveMoreMenu } from "@/components/shared/table/ResponsiveMoreMenu";

interface BudgetTableToolbarProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;

  // Selection
  selectedCount: number;
  onClearSelection: () => void;

  // Column Visibility
  hiddenColumns: Set<string>;
  onToggleColumn: (columnId: string, isChecked: boolean) => void;
  onShowAllColumns: () => void;
  onHideAllColumns: () => void;

  // Export/Print
  onExportCSV: () => void;
  onOpenPrintPreview: () => void; // 🆕 NEW: Print Preview instead of direct print

  // Actions
  isAdmin: boolean;
  pendingRequestsCount: number | undefined;
  onOpenShare: () => void;
  onOpenTrash: () => void;
  onBulkTrash: () => void;
  onAddNew?: () => void;

  // Auto-Calculate Toggle
  onBulkToggleAutoCalculate?: () => void;

  // Draft indicator
  hasPrintDraft?: boolean; // 🆕 NEW: Show draft badge

  // UI State
  expandButton?: React.ReactNode;
  accentColor: string;
}

export function BudgetTableToolbar({
  searchQuery,
  onSearchChange,
  searchInputRef,
  selectedCount,
  onClearSelection,
  hiddenColumns,
  onToggleColumn,
  onShowAllColumns,
  onHideAllColumns,
  onExportCSV,
  onOpenPrintPreview,
  isAdmin,
  pendingRequestsCount,
  onOpenShare,
  onOpenTrash,
  onBulkTrash,
  onAddNew,
  onBulkToggleAutoCalculate,
  hasPrintDraft,
  expandButton,
  accentColor,
}: BudgetTableToolbarProps) {
  return (
    <div className="h-16 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 no-print">

      {/* Left: Title or Selection Info */}
      <div className="flex items-center gap-3 min-w-[200px]">
        {selectedCount > 0 ? (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 h-7"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              {selectedCount} Selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-zinc-500 text-xs h-7 hover:text-zinc-900"
            >
              Clear
            </Button>
          </div>
        ) : (
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Budget Items
          </h3>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-1 justify-end">

        {/* Search Input - Clean Inline Design */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search budget items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-9 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        {/* --- DESKTOP ACTIONS (hidden on mobile) --- */}
        <div className="hidden lg:flex items-center gap-2">

          {/* Column Visibility */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <BudgetColumnVisibilityMenu
                    hiddenColumns={hiddenColumns}
                    onToggleColumn={onToggleColumn}
                    onShowAll={onShowAllColumns}
                    onHideAll={onHideAllColumns}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Columns</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Bulk Auto-Calculate Toggle (only when items are selected) */}
          {selectedCount > 0 && onBulkToggleAutoCalculate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onBulkToggleAutoCalculate}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Calculator className="w-4 h-4" />
                    Toggle Auto-Calculate
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Auto-calculate selected</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Recycle Bin */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={selectedCount > 0 ? onBulkTrash : onOpenTrash}
                  variant={selectedCount > 0 ? "destructive" : "outline"}
                  size="sm"
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {selectedCount > 0 ? (
                    `To Trash (${selectedCount})`
                  ) : (
                    <span className="hidden xl:inline">Recycle Bin</span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{selectedCount > 0 ? "Trash selected" : "Recycle Bin"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Print Preview Button with Draft Indicator */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onOpenPrintPreview}
                  variant="outline"
                  size="sm"
                  className="gap-2 relative"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden xl:inline">Print Preview</span>
                  {hasPrintDraft && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open Print Preview</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Export CSV */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" />
                        <span className="hidden xl:inline">Export</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                      <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer">
                        <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <div className="p-2">
                        <span className="text-[10px] text-zinc-500 leading-tight block">
                          Note: Exports are based on the currently shown/hidden columns.
                        </span>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export Options</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Share Button (Admin Only) */}
          {isAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onOpenShare}
                    variant="secondary"
                    size="sm"
                    className="relative gap-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden xl:inline">Share</span>
                    {pendingRequestsCount !== undefined &&
                      pendingRequestsCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {pendingRequestsCount > 9
                            ? "9+"
                            : pendingRequestsCount}
                        </span>
                      )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Share & Manage Access</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Expand Button (if provided) */}
          {expandButton}
        </div>

        {/* --- MOBILE/TABLET ACTIONS (Hidden on Desktop) --- */}
        <div className="flex lg:hidden items-center gap-1">
          <BudgetColumnVisibilityMenu
            hiddenColumns={hiddenColumns}
            onToggleColumn={onToggleColumn}
            onShowAll={onShowAllColumns}
            onHideAll={onHideAllColumns}
          />

          <ResponsiveMoreMenu>
            {selectedCount > 0 && onBulkToggleAutoCalculate && (
              <DropdownMenuItem onClick={onBulkToggleAutoCalculate}>
                <Calculator className="w-4 h-4 mr-2" />
                Toggle Auto-Calculate
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={selectedCount > 0 ? onBulkTrash : onOpenTrash}>
              <Trash2 className="w-4 h-4 mr-2" />
              {selectedCount > 0 ? "Trash Selected" : "Recycle Bin"}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onOpenPrintPreview}>
              <Eye className="w-4 h-4 mr-2" />
              Print Preview
              {hasPrintDraft && (
                <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block" />
              )}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onExportCSV}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
            </DropdownMenuItem>

            {isAdmin && (
              <DropdownMenuItem onClick={onOpenShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
                {pendingRequestsCount !== undefined && pendingRequestsCount > 0 && (
                  <span className="ml-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 inline-flex items-center justify-center">
                    {pendingRequestsCount > 9 ? "9+" : pendingRequestsCount}
                  </span>
                )}
              </DropdownMenuItem>
            )}
          </ResponsiveMoreMenu>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

        {/* Add New Item Button */}
        {onAddNew && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onAddNew}
                  size="sm"
                  className="gap-2 text-white shadow-sm"
                  style={{ backgroundColor: accentColor }}
                >
                  <span className="text-lg leading-none mb-0.5">+</span>
                  <span className="hidden md:inline">Add New</span>
                  <span className="md:hidden">Add</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create new budget item</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}