"use client";

import React from "react";
import { Search, CheckCircle2, Trash2, X, Download, Printer, FileSpreadsheet } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ResponsiveMoreMenu } from "@/components/shared/table/ResponsiveMoreMenu";
import { motion, AnimatePresence } from "framer-motion";

interface TrustFundTableToolbarProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;

  // Selection
  selectedCount: number;
  onClearSelection: () => void;

  // Export/Print
  onExportCSV: () => void;
  onPrint: () => void;

  // Actions
  isAdmin: boolean;
  onOpenTrash: () => void;
  onBulkTrash: () => void;
  onAddNew?: () => void;

  // UI State
  accentColor: string;
}

export function TrustFundTableToolbar({
  searchQuery,
  onSearchChange,
  searchInputRef,
  selectedCount,
  onClearSelection,
  onExportCSV,
  onPrint,
  isAdmin,
  onOpenTrash,
  onBulkTrash,
  onAddNew,
  accentColor,
}: TrustFundTableToolbarProps) {
  // Search Focus State for Animation
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const isSearchExpanded = isSearchFocused || (searchQuery && searchQuery.length > 0);

  return (
    <div className="h-16 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 no-print overflow-hidden">

      {/* Left: Title or Selection Info */}
      <AnimatePresence mode="popLayout">
        {(!isSearchExpanded || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
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
                  className="text-zinc-500 text-xs h-7 hover:text-zinc-900"
                >
                  Clear
                </Button>
              </div>
            ) : (
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Trust Funds
              </h3>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right: Actions */}
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
            placeholder="Search trust funds..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
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

                {/* Export/Print Dropdown */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                              <Download className="w-4 h-4" />
                              <span className="hidden xl:inline">Export / Print</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={onPrint} className="cursor-pointer">
                              <Printer className="w-4 h-4 mr-2" /> Print PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer">
                              <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <div className="p-2">
                              <span className="text-[10px] text-zinc-500 leading-tight block">
                                Note: Exports and prints are based on the currently filtered data.
                              </span>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Export & Print</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* --- MOBILE/TABLET ACTIONS (Hidden on Desktop) --- */}
              <div className="flex lg:hidden items-center gap-1">
                <ResponsiveMoreMenu>
                  <DropdownMenuItem onClick={selectedCount > 0 ? onBulkTrash : onOpenTrash}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {selectedCount > 0 ? "Trash Selected" : "Recycle Bin"}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={onPrint}>
                    <Printer className="w-4 h-4 mr-2" /> Print PDF
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={onExportCSV}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
                  </DropdownMenuItem>
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
                        <span className="hidden md:inline">Add</span>
                        <span className="md:hidden">Add</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add New Item</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}