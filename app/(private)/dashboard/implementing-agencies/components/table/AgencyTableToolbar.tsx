// app/(private)/dashboard/implementing-agencies/components/table/AgencyTableToolbar.tsx

"use client";

import { useState } from "react";
import {
  Trash2,
  FileSpreadsheet,
  Share2,
  Plus,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  Maximize2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GenericTableToolbar, TableActionButton } from "@/components/shared/table";
import { ColumnVisibilityMenu } from "@/components/shared/table/ColumnVisibilityMenu";
import { ResponsiveMoreMenu } from "@/components/shared/table/ResponsiveMoreMenu";
import { AgencyColumnConfig, AgencySortOption } from "../../types/agency-table.types";
import { AGENCY_SORT_OPTIONS } from "../../constants/agency-table.constants";

interface AgencyTableToolbarProps {
  // Search
  search: string;
  setSearch: (value: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;
  isSearchExpanded: boolean;
  // Sort
  sortOption: AgencySortOption;
  setSortOption: (option: AgencySortOption) => void;
  // Column visibility
  columns: AgencyColumnConfig[];
  hiddenColumns: Set<string>;
  onToggleColumn: (columnId: string, isChecked: boolean) => void;
  onShowAllColumns: () => void;
  onHideAllColumns: () => void;
  // Selection
  selectedCount: number;
  onClearSelection: () => void;
  // Actions
  onAdd?: () => void;
  onOpenTrash?: () => void;
  onExportCSV: () => void;
  onShare?: () => void;
  onFullscreen?: () => void;
  // Permissions
  isAdmin: boolean;
  accentColor: string;
}

function AgencySortDropdown({
  value,
  onChange,
}: {
  value: AgencySortOption;
  onChange: (v: AgencySortOption) => void;
}) {
  const currentOption = AGENCY_SORT_OPTIONS.find((opt) => opt.value === value);
  const displayLabel = currentOption?.label || "Sort By";

  const getDirection = (optionValue: string): "asc" | "desc" => {
    if (optionValue.endsWith("Asc")) return "asc";
    if (optionValue.endsWith("Desc")) return "desc";
    return "desc";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="hidden sm:inline truncate max-w-[150px]">
                    {displayLabel}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {AGENCY_SORT_OPTIONS.map((option) => {
                  const direction = getDirection(option.value);
                  const isActive = value === option.value;
                  return (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => onChange(option.value)}
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        {direction === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-zinc-400" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        {option.label}
                      </span>
                      {isActive && <Check className="w-4 h-4 text-blue-500" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Sort agencies</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AgencyTableToolbar({
  search,
  setSearch,
  isSearchFocused,
  setIsSearchFocused,
  isSearchExpanded,
  sortOption,
  setSortOption,
  columns,
  hiddenColumns,
  onToggleColumn,
  onShowAllColumns,
  onHideAllColumns,
  selectedCount,
  onClearSelection,
  onAdd,
  onOpenTrash,
  onExportCSV,
  onShare,
  onFullscreen,
  isAdmin,
  accentColor,
}: AgencyTableToolbarProps) {
  return (
    <GenericTableToolbar
      actions={
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Selection Info */}
          {selectedCount > 0 && (
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {selectedCount} selected
              </span>
              <button
                onClick={onClearSelection}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
              >
                Clear
              </button>
            </div>
          )}

          {/* Collapsible toolbar actions */}
          <AnimatePresence>
            {!isSearchExpanded && (
              <motion.div
                initial={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: "auto" }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 overflow-hidden"
              >
                <ColumnVisibilityMenu
                  columns={columns.map((col) => ({
                    key: String(col.key),
                    label: col.label,
                  }))}
                  hiddenColumns={hiddenColumns}
                  onToggleColumn={onToggleColumn}
                  onShowAll={onShowAllColumns}
                  onHideAll={onHideAllColumns}
                  variant="table"
                />

                {/* Desktop secondary actions */}
                <div className="hidden lg:flex items-center gap-2">
                  {onOpenTrash && (
                    <TableActionButton
                      icon={Trash2}
                      label="Recycle Bin"
                      onClick={onOpenTrash}
                      title="View Deleted Agencies"
                    />
                  )}
                  <TableActionButton
                    icon={FileSpreadsheet}
                    label="Export CSV"
                    onClick={onExportCSV}
                    title="Export to CSV"
                  />
                  {isAdmin && onShare && (
                    <TableActionButton
                      icon={Share2}
                      label="Share"
                      onClick={onShare}
                      title="Share & Manage Access"
                    />
                  )}
                  {onFullscreen && (
                    <TableActionButton
                      icon={Maximize2}
                      label="Fullscreen"
                      onClick={onFullscreen}
                      title="Toggle Fullscreen"
                    />
                  )}
                </div>

                {/* Mobile/Tablet more menu */}
                <div className="lg:hidden">
                  <ResponsiveMoreMenu>
                    {onOpenTrash && (
                      <DropdownMenuItem onClick={onOpenTrash}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Recycle Bin
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={onExportCSV}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Export CSV
                    </DropdownMenuItem>
                    {isAdmin && onShare && (
                      <DropdownMenuItem onClick={onShare}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                    )}
                    {onFullscreen && (
                      <DropdownMenuItem onClick={onFullscreen}>
                        <Maximize2 className="w-4 h-4 mr-2" />
                        Fullscreen
                      </DropdownMenuItem>
                    )}
                  </ResponsiveMoreMenu>
                </div>

                {onAdd && (
                  <TableActionButton
                    icon={Plus}
                    label="Add"
                    onClick={onAdd}
                    variant="primary"
                    accentColor={accentColor}
                    hideLabelOnMobile={true}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      }
    >
      <div className="flex items-center gap-2 flex-1">
        {/* Sort Dropdown */}
        {selectedCount === 0 && (
          <AgencySortDropdown value={sortOption} onChange={setSortOption} />
        )}

        {/* Animated Search Input */}
        <motion.div
          className="relative"
          initial={false}
          animate={{
            width: isSearchExpanded ? "100%" : "20rem",
            flexGrow: isSearchExpanded ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search agencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full h-9 pl-9 pr-9 text-sm border border-zinc-200 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      </div>
    </GenericTableToolbar>
  );
}
