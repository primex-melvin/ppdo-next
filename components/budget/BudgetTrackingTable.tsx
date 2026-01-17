// app/dashboard/project/budget/components/BudgetTrackingTable.tsx
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { Modal } from "./Modal";
import { ConfirmationModal } from "./ConfirmationModal";
import { BudgetItemForm } from "./BudgetItemForm";
import BudgetShareModal from "./BudgetShareModal";
import { BudgetTableHeader } from "./components/table/BudgetTableHeader";
import { BudgetTableRow } from "./components/table/BudgetTableRow";
import { BudgetTableTotalsRow } from "./components/table/BudgetTableTotalsRow";
import { BudgetTableEmptyState } from "./components/table/BudgetTableEmptyState";
import { BudgetContextMenu } from "./components/table/BudgetContextMenu";
import { BudgetSearchFilters } from "./components/filters/BudgetSearchFilters";
import { Share2, Search, CheckCircle2, Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DashboardToolbar from "@/components/ui/dashboard-toolbar";
import { 
  BudgetItem, 
  ContextMenuState, 
  SortField, 
  SortDirection 
} from "@/app/dashboard/project/budget/types";
import {
  filterBySearchQuery,
  filterByStatus,
  filterByYear,
  sortBudgetItems,
  sortWithPinnedFirst,
  calculateBudgetTotals,
  calculateTotalUtilizationRate,
  extractUniqueStatuses,
  extractUniqueYears,
} from "@/app/dashboard/project/budget/utils";
import { STORAGE_KEYS, TIMEOUTS } from "@/app/dashboard/project/budget/constants";

interface BudgetTrackingTableProps {
  budgetItems: BudgetItem[];
  onAdd?: (item: Omit<BudgetItem, "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOnTrack" | "status">) => void;
  onEdit?: (id: string, item: Omit<BudgetItem, "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOnTrack" | "status">) => void;
  onDelete?: (id: string) => void;
  expandButton?: React.ReactNode;
  onOpenTrash?: () => void;
}

export function BudgetTrackingTable({
  budgetItems,
  onAdd,
  onEdit,
  onDelete,
  expandButton,
  onOpenTrash,
}: BudgetTrackingTableProps) {
  const { accentColorValue } = useAccentColor();
  const router = useRouter();
  const accessCheck = useQuery(api.budgetAccess.canAccess);
  const pendingRequestsCount = useQuery(api.accessRequests.getPendingCount);
  const togglePinBudgetItem = useMutation(api.budgetItems.togglePin);
  const bulkMoveToTrash = useMutation(api.budgetItems.bulkMoveToTrash);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  // Filter & Sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [yearFilter, setYearFilter] = useState<number[]>([]);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [showHeaderSkeleton, setShowHeaderSkeleton] = useState(true);

  const contextMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin =
    accessCheck?.user?.role === "admin" ||
    accessCheck?.user?.role === "super_admin";

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    const checkDraft = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.FORM_DRAFT);
        setHasDraft(!!saved);
      } catch (error) {
        setHasDraft(false);
      }
    };

    checkDraft();
    const interval = setInterval(checkDraft, 1000);
    return () => clearInterval(interval);
  }, [showAddModal]);

  useEffect(() => {
    // Priority 1: Read from URL query params
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const yearParam = urlParams.get("year");

      if (yearParam) {
        const year = parseInt(yearParam);
        if (!isNaN(year)) {
          setYearFilter([year]);
          return;
        }
      }

      // Priority 2: Fallback to sessionStorage
      const sessionYear = sessionStorage.getItem(STORAGE_KEYS.YEAR_PREFERENCE);
      if (sessionYear) {
        const year = parseInt(sessionYear);
        if (!isNaN(year)) {
          setYearFilter([year]);
        }
      }
    }
  }, []);

  // Sync yearFilter to URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (yearFilter.length > 0) {
        const params = new URLSearchParams();
        yearFilter.forEach((year) => params.append("year", String(year)));

        const currentParams = new URLSearchParams(window.location.search);
        currentParams.forEach((value, key) => {
          if (key !== "year") {
            params.append(key, value);
          }
        });

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, "", newUrl);
      } else {
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.delete("year");

        if (currentParams.toString()) {
          const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
          window.history.replaceState(null, "", newUrl);
        } else {
          const newUrl = window.location.pathname;
          window.history.replaceState(null, "", newUrl);
        }
      }
    }
  }, [yearFilter]);

  useEffect(() => {
    try {
      const shouldOpenAdd =
        typeof window !== "undefined"
          ? localStorage.getItem(STORAGE_KEYS.OPEN_ADD)
          : null;
      if (shouldOpenAdd === "true") {
        setShowAddModal(true);
        localStorage.removeItem(STORAGE_KEYS.OPEN_ADD);
      }
    } catch (_) {
      // storage unavailable
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target as Node)
      ) {
        setContextMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setContextMenu(null);
    };

    document.addEventListener("scroll", handleScroll, true);
    return () => document.removeEventListener("scroll", handleScroll, true);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowHeaderSkeleton(false), TIMEOUTS.HEADER_SKELETON);
    return () => clearTimeout(t);
  }, []);

  // ============================================================================
  // MEMOIZED VALUES
  // ============================================================================

  const uniqueStatuses = useMemo(
    () => extractUniqueStatuses(budgetItems),
    [budgetItems]
  );

  const uniqueYears = useMemo(
    () => extractUniqueYears(budgetItems),
    [budgetItems]
  );

  const filteredAndSortedItems = useMemo(() => {
    let filtered = filterBySearchQuery(budgetItems, searchQuery);
    filtered = filterByStatus(filtered, statusFilter);
    filtered = filterByYear(filtered, yearFilter);
    filtered = sortBudgetItems(filtered, sortField, sortDirection);
    filtered = sortWithPinnedFirst(filtered);
    return filtered;
  }, [budgetItems, searchQuery, statusFilter, yearFilter, sortField, sortDirection]);

  const totals = useMemo(
    () => calculateBudgetTotals(filteredAndSortedItems),
    [filteredAndSortedItems]
  );

  const totalUtilizationRate = useMemo(
    () => calculateTotalUtilizationRate(totals),
    [totals]
  );

  const isAllSelected =
    filteredAndSortedItems.length > 0 &&
    selectedIds.size === filteredAndSortedItems.length;
  const isIndeterminate =
    selectedIds.size > 0 && selectedIds.size < filteredAndSortedItems.length;

  const hasActiveFilters = Boolean(
    searchQuery || statusFilter.length > 0 || yearFilter.length > 0 || sortField
  );

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleRowClick = (item: BudgetItem, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    router.push(
      `/dashboard/project/budget/${encodeURIComponent(item.particular)}`
    );
  };

  const handleContextMenu = (e: React.MouseEvent, item: BudgetItem) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
  };

  const handleEdit = (item: BudgetItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
    setContextMenu(null);
  };

  const handleDelete = (item: BudgetItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
    setContextMenu(null);
  };

  const handlePin = async (item: BudgetItem) => {
    try {
      await togglePinBudgetItem({ id: item.id as Id<"budgetItems"> });
      toast.success(
        item.isPinned ? "Budget item unpinned" : "Budget item pinned to top"
      );
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Failed to pin/unpin item");
    }
    setContextMenu(null);
  };

  const handleSave = (
    formData: Omit<
      BudgetItem,
      | "id"
      | "utilizationRate"
      | "projectCompleted"
      | "projectDelayed"
      | "projectsOnTrack"
      | "status"
    >
  ) => {
    if (selectedItem && onEdit) {
      onEdit(selectedItem.id, formData);
    } else if (onAdd) {
      onAdd(formData);
    }
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedItem(null);
  };

  const handleConfirmDelete = () => {
    if (selectedItem && onDelete) {
      onDelete(selectedItem.id);
    }
    setSelectedItem(null);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const toggleYearFilter = (year: number) => {
    setYearFilter((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setYearFilter([]);
    setSortField(null);
    setSortDirection(null);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredAndSortedItems.map((item) => item.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkTrash = async () => {
    if (selectedIds.size === 0) {
      toast.error("No items selected");
      return;
    }

    try {
      const response: any = await bulkMoveToTrash({
        ids: Array.from(selectedIds) as Id<"budgetItems">[],
      });

      if (response.success) {
        toast.success(
          response.message || `Moved ${selectedIds.size} item(s) to trash`
        );
        setSelectedIds(new Set());
      } else {
        toast.error(
          response.error?.message || "Failed to move items to trash"
        );
      }
    } catch (error) {
      console.error("Error in bulk trash:", error);
      toast.error("An error occurred while moving items to trash");
    }
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      clearAllFilters();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <div className="print-area bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4 no-print">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-[200px]">
              {selectedIds.size > 0 ? (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 h-7"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    {selectedIds.size} Selected
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
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
                        onClick={() => setShowShareModal(true)}
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
                      onClick={toggleSearch}
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
                      onClick={handlePrint}
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
                    {selectedIds.size > 0 && (
                      <Button
                        onClick={handleBulkTrash}
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        To Trash ({selectedIds.size})
                      </Button>
                    )}
                    {onAdd && (
                      <Button
                        onClick={() => setShowAddModal(true)}
                        size="sm"
                        className="flex-1 sm:flex-none text-white"
                        style={{ backgroundColor: accentColorValue }}
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

          {/* Search Filters */}
          {isSearchVisible && (
            <BudgetSearchFilters
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              yearFilter={yearFilter}
              accentColorValue={accentColorValue}
              hasActiveFilters={hasActiveFilters}
              onSearchChange={setSearchQuery}
              onClearFilters={clearAllFilters}
              onToggleStatusFilter={toggleStatusFilter}
              onToggleYearFilter={toggleYearFilter}
            />
          )}
        </div>

        {/* Print Header */}
        <div className="hidden print-only p-4 border-b border-zinc-900">
          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            Budget Tracking
          </h2>
          <p className="text-sm text-zinc-700">
            Generated on:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
          <table className="w-full">
            <BudgetTableHeader
              isAdmin={isAdmin}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
              sortField={sortField}
              sortDirection={sortDirection}
              yearFilter={yearFilter}
              statusFilter={statusFilter}
              uniqueYears={uniqueYears}
              uniqueStatuses={uniqueStatuses}
              showHeaderSkeleton={showHeaderSkeleton}
              onSelectAll={handleSelectAll}
              onSort={handleSort}
              onToggleYearFilter={toggleYearFilter}
              onToggleStatusFilter={toggleStatusFilter}
            />
            <tbody>
              {filteredAndSortedItems.length === 0 ? (
                <BudgetTableEmptyState />
              ) : (
                <>
                  {filteredAndSortedItems.map((item: BudgetItem) => (
                    <BudgetTableRow
                      key={item.id}
                      item={item}
                      isAdmin={isAdmin}
                      isSelected={selectedIds.has(item.id)}
                      onContextMenu={handleContextMenu}
                      onClick={handleRowClick}
                      onSelectRow={handleSelectRow}
                    />
                  ))}
                  <BudgetTableTotalsRow
                    totals={totals}
                    totalUtilizationRate={totalUtilizationRate}
                  />
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <BudgetContextMenu
          ref={contextMenuRef}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          item={contextMenu.item}
          canEdit={!!onEdit}
          canDelete={!!onDelete}
          onPin={handlePin}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Modals */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedItem(null);
          }}
          title="Add Budget Item"
          size="xl"
        >
          <BudgetItemForm
            onSave={handleSave}
            onCancel={() => {
              setShowAddModal(false);
              setSelectedItem(null);
            }}
          />
        </Modal>
      )}

      {showEditModal && selectedItem && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          title="Edit Budget Item"
          size="xl"
        >
          <BudgetItemForm
            item={selectedItem}
            onSave={handleSave}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedItem(null);
            }}
          />
        </Modal>
      )}

      {showDeleteModal && selectedItem && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedItem(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Move to Trash"
          message={`Are you sure you want to move "${selectedItem.particular}" to trash? Associated projects will also be moved to trash.`}
          confirmText="Move to Trash"
          cancelText="Cancel"
          variant="danger"
        />
      )}

      {showShareModal && (
        <BudgetShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
}