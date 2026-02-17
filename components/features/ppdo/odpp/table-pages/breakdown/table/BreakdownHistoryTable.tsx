// components/ppdo/breakdown/table/BreakdownHistoryTable.tsx

/**
 * Centralized Breakdown History Table Component
 *
 * A reusable table component for displaying breakdown records.
 * Used by both Project and Trust Fund breakdown pages.
 */

"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Trash2, Printer, Plus, LayoutGrid, Table2, FileSpreadsheet, Share2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { SortOption } from "@/types/sort";
import { toast } from "sonner";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BreakdownKanban } from "../kanban";
import { StatusVisibilityMenu } from "../../../utilities/shared/toolbar";
import { KanbanFieldVisibilityMenu } from "../../../utilities/shared/kanban/KanbanFieldVisibilityMenu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ResponsiveMoreMenu } from "@/components/shared/table/ResponsiveMoreMenu";

// Import types
import {
  Breakdown,
  BreakdownHistoryTableProps,
  NavigationParams,
  ColumnConfig,
} from "../types/breakdown.types";

// Import constants
import { TABLE_HEIGHT, DEFAULT_ROW_HEIGHT } from "../constants/table.constants";

// Import utilities
import {
  filterBreakdowns,
  calculateColumnTotals,
  generateGridTemplate,
  isInteractiveElement,
} from "../utils/helpers";

import {
  buildBreakdownDetailPath,
  logBreakdownNavigation
} from "../utils/navigation.utils";

import {
  buildInspectionUrl,
  logInspectionNavigation
} from "../utils/inspection-navigation.utils";

// Import hooks
import { useTableSettings } from "../hooks/useTableSettings";
import { useTableResize } from "../hooks/useTableResize";
import { useColumnDragDrop } from "../hooks/useColumnDragDrop";
import { useAutoScrollHighlight } from "@/lib/shared/hooks/useAutoScrollHighlight";

// Import shared table components
import {
  GenericTableToolbar,
  TableActionButton,
  SortDropdown,
} from "@/components/shared/table";
import { ColumnVisibilityMenu } from "@/components/shared/table/ColumnVisibilityMenu";

// Import table sub-components
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { TableTotalsRow } from "./TableTotalsRow";
import { EmptyState } from "./EmptyState";
import { GenericPrintPreviewModal } from "@/components/features/ppdo/odpp/utilities/print";
import { exportToCSV, createBreakdownExportConfig } from "@/services";

// Import print adapter
import { BreakdownPrintAdapter } from "../lib/print-adapters/BreakdownPrintAdapter";

// Import share modal
import { BreakdownShareModal } from "../components/BreakdownShareModal";

export function BreakdownHistoryTable({
  breakdowns,
  onPrint,
  onAdd,
  onEdit,
  onDelete,
  onOpenTrash,
  entityType = "project",
  navigationParams,
  onStatusChange,
  entityName,
  enableInspectionNavigation = false,
  onNavigateToInspections,
  sortOption,
  onSortChange,
}: BreakdownHistoryTableProps) {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { accentColorValue } = useAccentColor();

  // Search state
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const isSearchExpanded = isSearchFocused || search.length > 0;

  // Column visibility state
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  // Row selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Print preview state
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printAdapter, setPrintAdapter] = useState<BreakdownPrintAdapter | null>(null);

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);

  // View state
  const [viewMode, setViewMode] = useState<"table" | "kanban">(
    (searchParams.get("view") as "table" | "kanban") || "table"
  );
  const [showViewToggle, setShowViewToggle] = useState(false);

  // User permissions for share button
  const currentUser = useQuery(api.users.current, {});
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";
  const pendingRequestsCount = useQuery(api.accessRequests.getPendingCount);
  const breakdownPendingCount = useQuery(api.breakdownSharedAccess.getPendingCount);

  // Bulk trash mutations based on entity type
  const bulkMoveToTrashProject = useMutation(api.govtProjects.bulkMoveToTrash);
  const bulkMoveToTrashTrustFund = useMutation(api.trustFundBreakdowns.bulkMoveToTrash);
  const bulkMoveToTrashSEF = useMutation(api.specialEducationFundBreakdowns.bulkMoveToTrash);
  const bulkMoveToTrashSHF = useMutation(api.specialHealthFundBreakdowns.bulkMoveToTrash);
  const bulkMoveToTrash20DF = useMutation(api.twentyPercentDFBreakdowns.bulkMoveToTrash);

  // Determine entity ID for share modal
  const shareEntityId = useMemo(() => {
    if (entityType === "trustfund" || entityType === "specialeducationfund" ||
      entityType === "specialhealthfund" || entityType === "twentyPercentDF") {
      return navigationParams?.slug || (params as any).slug as string;
    }
    return navigationParams?.projectbreakdownId || (params as any).projectbreakdownId as string;
  }, [entityType, navigationParams, params]);

  // Keyboard shortcut to toggle view tabs visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        const newValue = !showViewToggle;
        setShowViewToggle(newValue);
        if (newValue) {
          toast.info("View toggle controls visible");
        } else {
          toast.info("View toggle controls hidden");
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showViewToggle]);

  const [visibleStatuses, setVisibleStatuses] = useState<Set<string>>(new Set(["ongoing", "delayed", "completed"]));
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set([
    "allocatedBudget",
    "balance",
    "utilizationRate",
  ]));

  const handleToggleField = (fieldId: string, isChecked: boolean) => {
    const newVisible = new Set(visibleFields);
    if (isChecked) {
      newVisible.add(fieldId);
    } else {
      newVisible.delete(fieldId);
    }
    setVisibleFields(newVisible);
  };

  // Determine table identifier based on entity type
  const tableIdentifier =
    entityType === "trustfund" ? "trustFundBreakdowns" :
      entityType === "specialeducationfund" ? "specialEducationFundBreakdowns" :
        entityType === "specialhealthfund" ? "specialHealthFundBreakdowns" :
          entityType === "twentyPercentDF" ? "twentyPercentDFBreakdowns" :
            "govtProjectBreakdowns";

  // Custom hooks
  const {
    columns,
    setColumns,
    rowHeights,
    setRowHeights,
    canEditLayout,
    saveLayout,
    saveLayoutWithCols,
    updateColumnWidth,
  } = useTableSettings({ tableIdentifier });

  const { startResizeColumn, startResizeRow } = useTableResize({
    columns,
    rowHeights,
    setRowHeights,
    canEditLayout,
    saveLayout,
    updateColumnWidth,
    setColumns, // Legacy fallback
  });

  const { onDragStart, onDrop, onDragOver } = useColumnDragDrop({
    columns,
    setColumns,
    rowHeights,
    canEditLayout,
    saveLayout: saveLayoutWithCols,
  });

  // Auto-scroll highlight hook
  // We need to pass the list of IDs currently in the table to the hook
  // so it knows when the target item has loaded.
  const { isHighlighted } = useAutoScrollHighlight(
    useMemo(() => breakdowns.map(b => b._id), [breakdowns]),
    { scrollDelay: 200 }
  );

  /* =======================
     COLUMN VISIBILITY HANDLERS
  ======================= */

  const handleToggleColumn = (columnId: string, isChecked: boolean) => {
    const newHidden = new Set(hiddenColumns);
    if (isChecked) {
      newHidden.delete(columnId);
    } else {
      newHidden.add(columnId);
    }
    setHiddenColumns(newHidden);
  };

  const handleShowAllColumns = () => {
    setHiddenColumns(new Set());
  };

  const handleHideAllColumns = () => {
    const allColIds = columns.map((c) => String(c.key));
    setHiddenColumns(new Set(allColIds));
  };

  const handleToggleStatus = (statusId: string, isChecked: boolean) => {
    const newVisible = new Set(visibleStatuses);
    if (isChecked) {
      newVisible.add(statusId);
    } else {
      newVisible.delete(statusId);
    }
    setVisibleStatuses(newVisible);
  };

  /* =======================
     ROW SELECTION HANDLERS
  ======================= */

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredRows.map(b => b._id));
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

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleStatusChange = (itemId: string, newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(itemId, newStatus);
      return;
    }

    // Find item
    const item = breakdowns.find(b => b._id === itemId);
    if (item && onEdit) {
      const status = newStatus as "completed" | "ongoing" | "delayed";
      onEdit({
        ...item,
        status
      });
    }
  };

  /* =======================
     PRINT HANDLER
  ======================= */

  const handlePrint = useCallback(() => {
    try {
      // Determine breakdown ID from params or navigation params
      let breakdownId: string | undefined;

      if (entityType === "trustfund") {
        breakdownId = navigationParams?.slug || (params as any).slug as string;
      } else if (entityType === "specialeducationfund") {
        breakdownId = navigationParams?.slug || (params as any).slug as string;
      } else if (entityType === "specialhealthfund") {
        breakdownId = navigationParams?.slug || (params as any).slug as string;
      } else if (entityType === "twentyPercentDF") {
        breakdownId = navigationParams?.slug || (params as any).slug as string;
      } else {
        breakdownId = navigationParams?.projectbreakdownId || (params as any).projectbreakdownId as string;
      }

      if (!breakdownId) {
        console.warn("No breakdown ID found for print adapter");
        return;
      }

      const adapter = new BreakdownPrintAdapter(
        breakdowns,
        breakdownId,
        columns as any[],
        entityName
      );
      setPrintAdapter(adapter);
      setIsPrintPreviewOpen(true);
    } catch (error) {
      console.error('Failed to open print preview:', error);
    }
  }, [breakdowns, params, navigationParams, columns, entityType]);

  /* =======================
     NAVIGATION HANDLER
  ======================= */

  const handleRowClick = useCallback((breakdown: Breakdown, event: React.MouseEvent) => {
    const target = event.target as HTMLElement;

    if (isInteractiveElement(target)) {
      return;
    }

    // Build navigation params from props or URL params
    const navParams: NavigationParams = navigationParams || {
      particularId: (params as any).particularId as string,
      projectbreakdownId: (params as any).projectbreakdownId as string,
      year: (params as any).year as string,
      slug: ((params as any).slug || (params as any).trustfundbreakdownId) as string, // Fallback for backward compat if needed, otherwise just slug
    };

    // If inspection navigation is enabled, navigate to inspections instead
    if (enableInspectionNavigation) {
      if (onNavigateToInspections) {
        onNavigateToInspections(breakdown);
      } else {
        const inspectionPath = buildInspectionUrl(breakdown, navParams, entityType);
        logInspectionNavigation(breakdown, inspectionPath);
        router.push(inspectionPath);
      }
      return;
    }

    // Default: navigate to breakdown details
    logBreakdownNavigation(breakdown);
    const path = buildBreakdownDetailPath(breakdown, navParams, entityType);
    router.push(path);
  }, [params, navigationParams, router, entityType, enableInspectionNavigation, onNavigateToInspections]);

  /* =======================
     COMPUTED VALUES
  ======================= */

  // Filter visible columns
  const visibleColumns = useMemo(() => {
    return columns.filter(col => !hiddenColumns.has(String(col.key)));
  }, [columns, hiddenColumns]);

  const gridTemplateColumns = useMemo(() => {
    return generateGridTemplate(visibleColumns as any[]);
  }, [visibleColumns]);

  const filteredRows = useMemo(() => {
    return filterBreakdowns(breakdowns, search);
  }, [breakdowns, search]);

  // Selection state
  const isAllSelected = filteredRows.length > 0 && selectedIds.size === filteredRows.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredRows.length;

  const totals = useMemo(() => {
    return calculateColumnTotals(filteredRows, visibleColumns as any[]);
  }, [filteredRows, visibleColumns]);

  /* =======================
     EXPORT CSV HANDLER (defined after filteredRows)
  ======================= */

  const handleExportCSV = useCallback(() => {
    try {
      const selectedItems = selectedIds.size > 0
        ? filteredRows.filter(b => selectedIds.has(b._id))
        : filteredRows;

      exportToCSV(
        selectedItems,
        createBreakdownExportConfig(columns as any[], hiddenColumns)
      );

      toast.success(selectedIds.size > 0
        ? `Exported ${selectedIds.size} selected rows`
        : `Exported ${filteredRows.length} rows`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export CSV");
    }
  }, [filteredRows, selectedIds, columns, hiddenColumns]);

  /* =======================
     BULK TRASH HANDLER
  ======================= */

  const handleBulkTrash = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const ids = Array.from(selectedIds) as Id<"govtProjectBreakdowns">[] |
      Id<"trustFundBreakdowns">[] | Id<"specialEducationFundBreakdowns">[] |
      Id<"specialHealthFundBreakdowns">[] | Id<"twentyPercentDFBreakdowns">[];

    try {
      let result;
      switch (entityType) {
        case "trustfund":
          result = await bulkMoveToTrashTrustFund({ ids: ids as Id<"trustFundBreakdowns">[] });
          break;
        case "specialeducationfund":
          result = await bulkMoveToTrashSEF({ ids: ids as Id<"specialEducationFundBreakdowns">[] });
          break;
        case "specialhealthfund":
          result = await bulkMoveToTrashSHF({ ids: ids as Id<"specialHealthFundBreakdowns">[] });
          break;
        case "twentyPercentDF":
          result = await bulkMoveToTrash20DF({ ids: ids as Id<"twentyPercentDFBreakdowns">[] });
          break;
        default:
          result = await bulkMoveToTrashProject({ ids: ids as Id<"govtProjectBreakdowns">[] });
      }

      if (result.success > 0) {
        toast.success(`Moved ${result.success} items to trash`);
      }
      if (result.failed > 0) {
        toast.error(`Failed to move ${result.failed} items`);
      }

      // Clear selection after operation
      setSelectedIds(new Set());
    } catch (error) {
      toast.error("Failed to move items to trash");
      console.error(error);
    }
  }, [selectedIds, entityType, bulkMoveToTrashProject, bulkMoveToTrashTrustFund,
    bulkMoveToTrashSEF, bulkMoveToTrashSHF, bulkMoveToTrash20DF]);

  /* =======================
     RENDER
  ======================= */

  return (
    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "kanban")} className="space-y-4">
      <div className="flex justify-end items-center mb-4 min-h-[40px]">
        {showViewToggle && (
          <TabsList className="bg-zinc-100 dark:bg-zinc-800 animate-in fade-in slide-in-from-right-4 duration-300">
            <TabsTrigger value="table" className="gap-2">
              <Table2 className="w-4 h-4" />
              Table
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </TabsTrigger>
          </TabsList>
        )}
      </div>

      <TabsContent value="table" className="mt-0">
        <div
          className="flex flex-col bg-white dark:bg-zinc-900 border rounded-lg overflow-hidden h-[calc(100vh-200px)] min-h-[500px]"
          style={{
            borderColor: 'rgb(228 228 231 / 1)',
          }}
        >
          {/* TOOLBAR */}
          <GenericTableToolbar
            actions={
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Selection Info */}
                {selectedIds.size > 0 && (
                  <div className="hidden sm:flex items-center gap-2 mr-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {selectedIds.size} selected
                    </span>
                    <button
                      onClick={handleClearSelection}
                      className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* Bulk Move to Trash Button */}
                {selectedIds.size > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkTrash}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Move to Trash ({selectedIds.size})
                  </Button>
                )}

                {/* Collapsible toolbar actions - hide when search expanded */}
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
                        columns={columns.map(col => ({ key: String(col.key), label: col.label }))}
                        hiddenColumns={hiddenColumns}
                        onToggleColumn={handleToggleColumn}
                        onShowAll={handleShowAllColumns}
                        onHideAll={handleHideAllColumns}
                        variant="table"
                      />

                      {/* Desktop secondary actions */}
                      <div className="hidden lg:flex items-center gap-2">
                        {onOpenTrash && (
                          <TableActionButton
                            icon={Trash2}
                            label="Recycle Bin"
                            onClick={onOpenTrash}
                            title="View Recycle Bin"
                          />
                        )}
                        <TableActionButton
                          icon={Printer}
                          label="Print"
                          onClick={handlePrint}
                          title="Print"
                        />
                        <TableActionButton
                          icon={FileSpreadsheet}
                          label="Export CSV"
                          onClick={handleExportCSV}
                          title="Export to CSV"
                        />
                        {isAdmin && (
                          <TableActionButton
                            icon={Share2}
                            label="Share"
                            onClick={() => setShowShareModal(true)}
                            title="Share & Manage Access"
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
                          <DropdownMenuItem onClick={handlePrint}>
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleExportCSV}>
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Export CSV
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem onClick={() => setShowShareModal(true)}>
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
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
                          accentColor={accentColorValue}
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
              {/* Sort Dropdown - always visible on left side */}
              {onSortChange && selectedIds.size === 0 && (
                <SortDropdown
                  value={sortOption || "lastModified"}
                  onChange={onSortChange}
                  tooltipText="Sort breakdowns"
                />
              )}
              {/* Animated Search Input */}
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
                  type="text"
                  placeholder="Search..."
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

          {/* TABLE WRAPPER - CRITICAL: Contains the border grid */}
          <div
            className="flex-1 overflow-auto border-t border-zinc-200 dark:border-zinc-800"
          >
            {/* TABLE CONTENT - Fixed width table with borders */}
            <table
              className="w-full"
              style={{
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                minWidth: '100%',
              }}
            >
              {/* HEADER */}
              <TableHeader
                columns={visibleColumns as any[]}
                gridTemplateColumns={gridTemplateColumns}
                canEditLayout={canEditLayout}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onStartResize={startResizeColumn}
                isAllSelected={isAllSelected}
                isIndeterminate={isIndeterminate}
                onSelectAll={handleSelectAll}
              />

              {/* BODY */}
              {filteredRows.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={visibleColumns.length + 3}>
                      <EmptyState asTableRow={false} />
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {/* ROWS */}
                  {filteredRows.map((breakdown, index) => {
                    const height = rowHeights[breakdown._id] ?? DEFAULT_ROW_HEIGHT;

                    return (
                      <TableRow
                        key={breakdown._id}
                        breakdown={breakdown}
                        index={index}
                        columns={visibleColumns as any[]}
                        gridTemplateColumns={gridTemplateColumns}
                        rowHeight={height}
                        canEditLayout={canEditLayout}
                        onRowClick={handleRowClick}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onStartRowResize={startResizeRow}
                        entityType={entityType}
                        isSelected={selectedIds.has(breakdown._id)}
                        onSelectRow={handleSelectRow}
                        isHighlighted={isHighlighted(breakdown._id)}
                      />
                    );
                  })}

                  {/* TOTALS ROW */}
                  <TableTotalsRow
                    columns={visibleColumns as any[]}
                    totals={totals}
                    gridTemplateColumns={gridTemplateColumns}
                  />
                </tbody>
              )}
            </table>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="kanban" className="mt-0">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* KANBAN TOOLBAR */}
          <GenericTableToolbar
            actions={
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Collapsible toolbar actions - hide when search expanded */}
                <AnimatePresence>
                  {!isSearchExpanded && (
                    <motion.div
                      initial={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, width: 0 }}
                      animate={{ opacity: 1, scale: 1, width: "auto" }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2 overflow-hidden"
                    >
                      <div className="hidden sm:flex items-center gap-2">
                        <KanbanFieldVisibilityMenu
                          visibleFields={visibleFields}
                          onToggleField={handleToggleField}
                          fields={[
                            { id: "allocatedBudget", label: "Allocated Budget" },
                            { id: "obligatedBudget", label: "Obligated Budget" },
                            { id: "budgetUtilized", label: "Budget Utilized" },
                            { id: "balance", label: "Balance" },
                            { id: "utilizationRate", label: "Utilization Rate" },
                            { id: "date", label: "Date" },
                            { id: "remarks", label: "Remarks" },
                          ]}
                        />
                        <StatusVisibilityMenu
                          visibleStatuses={visibleStatuses}
                          onToggleStatus={handleToggleStatus}
                          statusOptions={[
                            { id: "ongoing", label: "Ongoing" },
                            { id: "delayed", label: "Delayed" },
                            { id: "completed", label: "Completed" },
                          ]}
                        />
                      </div>

                      {/* Mobile/Tablet more menu for Kanban filters */}
                      <div className="sm:hidden">
                        <ResponsiveMoreMenu>
                          <div className="p-2 border-b">
                            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Visibility</p>
                            <KanbanFieldVisibilityMenu
                              visibleFields={visibleFields}
                              onToggleField={handleToggleField}
                            />
                            <StatusVisibilityMenu
                              visibleStatuses={visibleStatuses}
                              onToggleStatus={handleToggleStatus}
                            />
                          </div>
                        </ResponsiveMoreMenu>
                      </div>

                      <div className="hidden lg:flex items-center gap-2">
                        {onOpenTrash && (
                          <TableActionButton
                            icon={Trash2}
                            label="Recycle Bin"
                            onClick={onOpenTrash}
                            title="View Recycle Bin"
                          />
                        )}
                      </div>

                      <div className="lg:hidden">
                        <ResponsiveMoreMenu>
                          {onOpenTrash && (
                            <DropdownMenuItem onClick={onOpenTrash}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Recycle Bin
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
                          accentColor={accentColorValue}
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
              {/* Sort Dropdown - always visible on left side */}
              {onSortChange && selectedIds.size === 0 && (
                <SortDropdown
                  value={sortOption || "lastModified"}
                  onChange={onSortChange}
                  tooltipText="Sort breakdowns"
                />
              )}
              {/* Animated Search Input */}
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
                  type="text"
                  placeholder="Search items..."
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

          <div className="p-4 bg-zinc-50/50 dark:bg-zinc-950/50">
            <BreakdownKanban
              data={filteredRows}
              onView={(item) => handleRowClick(item, { target: {} } as any)}
              onEdit={onEdit}
              onDelete={onDelete}
              visibleStatuses={visibleStatuses}
              visibleFields={visibleFields}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>
      </TabsContent>

      {/* PRINT PREVIEW MODAL */}
      {printAdapter && (
        <GenericPrintPreviewModal
          isOpen={isPrintPreviewOpen}
          onClose={() => {
            setIsPrintPreviewOpen(false);
            setPrintAdapter(null);
          }}
          adapter={printAdapter}
          hiddenColumns={hiddenColumns}
          filterState={{
            searchQuery: search,
            statusFilter: [],
            yearFilter: [],
            sortField: null,
            sortDirection: null,
          }}
        />
      )}

      {/* SHARE MODAL */}
      {showShareModal && shareEntityId && (
        <BreakdownShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          entityId={shareEntityId}
          entityType={entityType}
          entityName={entityName || "Breakdown"}
        />
      )}
    </Tabs>
  );
}