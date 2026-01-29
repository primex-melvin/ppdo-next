"use client";

import React from "react";
import {
  Search,
  CheckCircle2,
  Trash2,
  Share2,
  X,
  Download,
  Eye,
  FileSpreadsheet,
  Printer,
  Calculator,
} from "lucide-react";
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
import { TableToolbarProps } from "./types";
import { TableToolbarColumnVisibility } from "./TableToolbarColumnVisibility";
import { TableToolbarBulkActions } from "./TableToolbarBulkActions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ResponsiveMoreMenu } from "@/components/shared/table/ResponsiveMoreMenu";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Unified Table Toolbar Component
 *
 * A flexible, feature-rich toolbar for data tables that supports:
 * - Search filtering
 * - Column visibility toggling
 * - Selection management
 * - Bulk actions (pluggable)
 * - Export/Print capabilities
 * - Admin sharing features
 *
 * Used across Budget, Projects, Funds, and other table views.
 *
 * @example
 * ```tsx
 * <TableToolbar
 *   title="Budget Items"
 *   searchQuery={search}
 *   onSearchChange={setSearch}
 *   selectedCount={selectedIds.size}
 *   onClearSelection={clearSelection}
 *   hiddenColumns={hidden}
 *   onToggleColumn={toggleColumn}
 *   onShowAllColumns={showAll}
 *   onHideAllColumns={hideAll}
 *   onBulkTrash={trashSelected}
 *   accentColor="#3b82f6"
 *   isAdmin={isAdmin}
 *   onOpenShare={openShare}
 *   onExportCSV={exportCsv}
 *   onPrint={printTable}
 *   bulkActions={[
 *     {
 *       id: 'auto-calc',
 *       label: 'Toggle Auto-Calculate',
 *       icon: <Calculator />,
 *       onClick: toggleAutoCalc,
 *     }
 *   ]}
 * />
 * ```
 */
export function TableToolbar({
  // Search
  searchQuery,
  onSearchChange,
  searchInputRef,
  onSearchFocus,

  // Selection
  selectedCount,
  onClearSelection,

  // Column Visibility
  hiddenColumns,
  onToggleColumn,
  onShowAllColumns,
  onHideAllColumns,
  columnVisibilityComponent,

  // Bulk Actions
  bulkActions,
  onBulkToggleAutoCalculate, // Legacy support
  onBulkCategoryChange, // Legacy support
  canManageBulkActions, // Legacy support

  // Trash
  onBulkTrash,
  onOpenTrash,

  // Export/Print
  onExportCSV,
  onPrint,
  onOpenPrintPreview,
  hasPrintDraft,

  // Share (Admin)
  isAdmin,
  pendingRequestsCount,
  onOpenShare,

  // UI Customization
  title = "Items",
  searchPlaceholder = "Search...",
  addButtonLabel = "Add",
  accentColor,

  // Advanced
  onAddNew,
  expandButton,
  columns,
}: TableToolbarProps) {
  // Render the column visibility menu component
  const ColumnVisibilityMenuComponent =
    columnVisibilityComponent || TableToolbarColumnVisibility;

  // Determine if we have any export/print options
  const hasExportOptions = onExportCSV || onPrint || onOpenPrintPreview;

  // Search Focus State for Animation
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const isSearchExpanded = isSearchFocused || (searchQuery && searchQuery.length > 0);

  return (
    <div className="h-16 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 no-print overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* LEFT: Title or Selection Info */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="popLayout">
        {(!isSearchExpanded || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 min-w-[200px] whitespace-nowrap"
          >
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
                  className="text-zinc-500 text-xs h-7 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Clear
                </Button>
              </div>
            ) : (
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {title}
              </h3>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* RIGHT: Actions */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        {/* Search Input - Expanding */}
        <motion.div
          className="relative"
          initial={false}
          animate={{
            width: isSearchExpanded ? "100%" : "20rem",
            flexGrow: isSearchExpanded ? 1 : 0
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={(e) => {
              setIsSearchFocused(true);
              onSearchFocus?.(e);
            }}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full h-9 pl-9 pr-9 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange("");
                // Optionally keep focus or let it blur depending on UX preference
                // For now, standard clear behavior
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>

        <AnimatePresence>
          {!isSearchExpanded && (
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: "auto" }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />

              {/* --- DESKTOP ACTIONS (hidden on mobile) --- */}
              <div className="hidden lg:flex items-center gap-2">

                {/* Column Visibility Menu */}
                <ColumnVisibilityMenuComponent
                  columns={columns}
                  hiddenColumns={hiddenColumns}
                  onToggleColumn={onToggleColumn}
                  onShowAll={onShowAllColumns}
                  onHideAll={onHideAllColumns}
                />

                {/* Pluggable Bulk Actions */}
                {selectedCount > 0 && bulkActions && (
                  <>
                    <TableToolbarBulkActions actions={bulkActions} />
                    <Separator orientation="vertical" className="h-6 mx-1" />
                  </>
                )}

                {/* Legacy Support: Auto-Calculate Toggle */}
                {selectedCount > 0 && onBulkToggleAutoCalculate && (
                  <>
                    <Button
                      onClick={onBulkToggleAutoCalculate}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <Calculator className="w-4 h-4" />
                      Toggle Auto-Calculate
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                  </>
                )}

                {/* Legacy Support: Bulk Category Change */}
                {selectedCount > 0 && canManageBulkActions && onBulkCategoryChange && (
                  <>
                    {/* This would need ProjectBulkActions component - kept for backward compat */}
                    <Separator orientation="vertical" className="h-6 mx-1" />
                  </>
                )}

                {/* Trash Button */}
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

                {/* Export/Print Dropdown */}
                {hasExportOptions && (
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

                        {onOpenPrintPreview && (
                          <>
                            <DropdownMenuItem onClick={onOpenPrintPreview} className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" />
                              Print Preview
                              {hasPrintDraft && (
                                <span className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </DropdownMenuItem>
                          </>
                        )}

                        {onPrint && (
                          <DropdownMenuItem onClick={onPrint} className="cursor-pointer">
                            <Printer className="w-4 h-4 mr-2" /> Print PDF
                          </DropdownMenuItem>
                        )}

                        {onExportCSV && (
                          <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer">
                            <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />
                        <div className="p-2">
                          <span className="text-[10px] text-zinc-500 leading-tight block">
                            Note: Exports are based on currently shown/hidden columns.
                          </span>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                {/* Share Button (Admin Only) */}
                {isAdmin && onOpenShare && (
                  <Button
                    onClick={onOpenShare}
                    variant="secondary"
                    size="sm"
                    className="relative gap-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden xl:inline">Share</span>
                    {pendingRequestsCount !== undefined && pendingRequestsCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {pendingRequestsCount > 9 ? "9+" : pendingRequestsCount}
                      </span>
                    )}
                  </Button>
                )}

                {/* Expand Button Slot */}
                {expandButton}
              </div>

              {/* --- MOBILE/TABLET ACTIONS (Hidden on Desktop) --- */}
              <div className="flex lg:hidden items-center gap-1">
                <ColumnVisibilityMenuComponent
                  columns={columns}
                  hiddenColumns={hiddenColumns}
                  onToggleColumn={onToggleColumn}
                  onShowAll={onShowAllColumns}
                  onHideAll={onHideAllColumns}
                />

                <ResponsiveMoreMenu>
                  {/* Pluggable Bulk Actions - might need custom logic to extract actions, 
                             or just show generic msg if complex */}

                  {/* Auto Calc */}
                  {selectedCount > 0 && onBulkToggleAutoCalculate && (
                    <DropdownMenuItem onClick={onBulkToggleAutoCalculate}>
                      <Calculator className="w-4 h-4 mr-2" />
                      Toggle Auto-Calculate
                    </DropdownMenuItem>
                  )}

                  {/* Trash */}
                  <DropdownMenuItem onClick={selectedCount > 0 ? onBulkTrash : onOpenTrash}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {selectedCount > 0 ? "Trash Selected" : "Recycle Bin"}
                  </DropdownMenuItem>

                  {/* Export / Print */}
                  {hasExportOptions && (
                    <>
                      {onOpenPrintPreview && (
                        <DropdownMenuItem onClick={onOpenPrintPreview}>
                          <Eye className="w-4 h-4 mr-2" />
                          Print Preview
                          {hasPrintDraft && (
                            <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block" />
                          )}
                        </DropdownMenuItem>
                      )}

                      {onPrint && (
                        <DropdownMenuItem onClick={onPrint}>
                          <Printer className="w-4 h-4 mr-2" /> Print PDF
                        </DropdownMenuItem>
                      )}

                      {onExportCSV && (
                        <DropdownMenuItem onClick={onExportCSV}>
                          <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
                        </DropdownMenuItem>
                      )}
                    </>
                  )}

                  {/* Share */}
                  {isAdmin && onOpenShare && (
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
                <Button
                  onClick={onAddNew}
                  size="sm"
                  className="gap-2 text-white shadow-sm"
                  style={{ backgroundColor: accentColor }}
                >
                  <span className="text-lg leading-none mb-0.5">+</span>
                  <span className="hidden md:inline">{addButtonLabel}</span>
                  <span className="md:hidden">Add</span>
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
