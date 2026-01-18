// app/dashboard/project/budget/components/table/BudgetTableToolbar.tsx
// NEW FILE

"use client";

import React from "react";
import { Search, CheckCircle2, Trash2, Share2, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardToolbar from "@/components/ui/dashboard-toolbar";

interface BudgetTableToolbarProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  
  // Selection
  selectedCount: number;
  onClearSelection: () => void;
  
  // Actions
  isAdmin: boolean;
  pendingRequestsCount: number | undefined;
  onOpenShare: () => void;
  onOpenTrash: () => void;
  onBulkTrash: () => void;
  onAddNew?: () => void;
  onToggleSearch: () => void;
  onPrint: () => void;
  
  // UI State
  isSearchVisible: boolean;
  expandButton?: React.ReactNode;
  accentColor: string;
}

export function BudgetTableToolbar({
  searchQuery,
  onSearchChange,
  searchInputRef,
  selectedCount,
  onClearSelection,
  isAdmin,
  pendingRequestsCount,
  onOpenShare,
  onOpenTrash,
  onBulkTrash,
  onAddNew,
  onToggleSearch,
  onPrint,
  isSearchVisible,
  expandButton,
  accentColor,
}: BudgetTableToolbarProps) {
  return (
    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4 no-print">
      <div className="flex items-center justify-between gap-3">
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

        <div className="flex items-center gap-2 flex-1 justify-end">
          <DashboardToolbar
            title=""
            actions={
              <>
                <Button
                  onClick={onOpenTrash}
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800"
                  title="View Recycle Bin"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Recycle Bin</span>
                </Button>
                {isAdmin && (
                  <Button
                    onClick={onOpenShare}
                    variant="secondary"
                    size="sm"
                    className="relative gap-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                    title="Share & Manage Access"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                    {pendingRequestsCount !== undefined &&
                      pendingRequestsCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {pendingRequestsCount > 9
                            ? "9+"
                            : pendingRequestsCount}
                        </span>
                      )}
                  </Button>
                )}
                {expandButton}
                <Button
                  onClick={onToggleSearch}
                  variant="outline"
                  size="sm"
                  className={`${
                    isSearchVisible
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  } gap-2`}
                  title={isSearchVisible ? "Hide Search" : "Show Search"}
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
                <Button
                  onClick={onPrint}
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  title="Print"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Print</span>
                </Button>
                {selectedCount > 0 && (
                  <Button
                    onClick={onBulkTrash}
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    To Trash ({selectedCount})
                  </Button>
                )}
                {onAddNew && (
                  <Button
                    onClick={onAddNew}
                    size="sm"
                    className="flex-1 sm:flex-none text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    <span className="hidden sm:inline">Add New Item</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                )}
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}