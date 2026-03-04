// components/ppdo/breakdown/table/BreakdownHistoryTable.tsx

/**
 * Centralized Breakdown History Table Component
 *
 * A reusable table component for displaying breakdown records.
 * Used by both Project and Trust Fund breakdown pages.
 */

"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { LayoutGrid, Table2 } from "lucide-react";
import { toast } from "sonner";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BreakdownKanban } from "../kanban";

// Import types
import {
  Breakdown,
  BreakdownHistoryTableProps,
  NavigationParams,
  ColumnConfig,
} from "../types/breakdown.types";

// Import constants
import { DEFAULT_ROW_HEIGHT } from "../constants/table.constants";

// Import utilities
import {
  filterBreakdowns,
  calculateColumnTotals,
  generateGridTemplate,
  isInteractiveElement,
} from "../utils/helpers";
import { createBreakdownPrintPreviewData } from "../utils/printPreview";

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

// Import shared toolbar
import { TableToolbar } from "@/components/features/ppdo/odpp/utilities/table/toolbar";
import { PrintPreviewModal } from "@/components/features/ppdo/odpp/utilities/table/print-preview/PrintPreviewModal";
import { useTablePrintDraft } from "@/components/features/ppdo/odpp/utilities/table/print-preview/useTablePrintDraft";
import { ConfirmationModal } from "@/components/features/ppdo/odpp/table-pages/11_project_plan";

// Import table sub-components
import { TableHeader } from "./TableHeader";
import { TableRow } from "./TableRow";
import { TableTotalsRow } from "./TableTotalsRow";
import { EmptyState } from "./EmptyState";
import { exportToCSV, createBreakdownExportConfig } from "@/services";

// Import share modal
import { BreakdownShareModal } from "../components/BreakdownShareModal";

const KANBAN_FIELD_CONFIG = [
  { id: "allocatedBudget", label: "Allocated Budget" },
  { id: "obligatedBudget", label: "Obligated Budget" },
  { id: "budgetUtilized", label: "Budget Utilized" },
  { id: "balance", label: "Balance" },
  { id: "utilizationRate", label: "Utilization Rate" },
  { id: "date", label: "Date" },
  { id: "remarks", label: "Remarks" },
] as const;

export function BreakdownHistoryTable({
  breakdowns,
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Search state
  const [search, setSearch] = useState("");

  // Column visibility state
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  // Row selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Print preview state
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);

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

  const breakdownYear = useMemo(() => {
    const rawYear = navigationParams?.year || (params as { year?: string | string[] }).year;
    const normalizedYear = Array.isArray(rawYear) ? rawYear[0] : rawYear;
    const parsedYear = Number(normalizedYear);

    return Number.isFinite(parsedYear) ? parsedYear : new Date().getFullYear();
  }, [navigationParams?.year, params]);

  const breakdownDraftKey = useMemo(() => {
    if (!shareEntityId) return null;
    return `breakdown_print_draft:${entityType}:${breakdownYear}:${shareEntityId}`;
  }, [breakdownYear, entityType, shareEntityId]);

  const {
    draftState,
    saveDraft,
    hasDraft,
    deleteDraft,
    formattedLastSaved,
  } = useTablePrintDraft({
    storageKey: breakdownDraftKey,
    metadata: {
      year: breakdownYear,
      label: `${entityName || "Breakdown"} (${entityType}, ${breakdownYear})`,
      documentTitleFallback: `${entityName || "Breakdown"} - ${breakdownYear}`,
    },
  });

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

  const handleToggleField = useCallback((fieldId: string, isChecked: boolean) => {
    setVisibleFields((prev) => {
      const next = new Set(prev);
      if (isChecked) {
        next.add(fieldId);
      } else {
        next.delete(fieldId);
      }
      return next;
    });
  }, []);

  const handleShowAllFields = useCallback(() => {
    setVisibleFields(new Set(KANBAN_FIELD_CONFIG.map((field) => field.id)));
  }, []);

  const handleHideAllFields = useCallback(() => {
    setVisibleFields(new Set());
  }, []);

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

  const handleOpenPrintPreview = useCallback(() => {
    if (hasDraft) {
      setShowDraftConfirm(true);
      return;
    }

    setShowPrintPreview(true);
  }, [hasDraft]);

  const handleLoadDraft = useCallback(() => {
    setShowDraftConfirm(false);
    setShowPrintPreview(true);
  }, []);

  const handleStartFresh = useCallback(() => {
    if (!hasDraft || deleteDraft()) {
      setShowDraftConfirm(false);
      setShowPrintPreview(true);
    }
  }, [deleteDraft, hasDraft]);

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

  const rowsForPrintPreview = useMemo(() => {
    if (selectedIds.size === 0) {
      return filteredRows;
    }

    return filteredRows.filter((breakdown) => selectedIds.has(breakdown._id));
  }, [filteredRows, selectedIds]);

  // Selection state
  const isAllSelected = filteredRows.length > 0 && selectedIds.size === filteredRows.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredRows.length;

  const totals = useMemo(() => {
    return calculateColumnTotals(filteredRows, visibleColumns as any[]);
  }, [filteredRows, visibleColumns]);

  const tableColumnsForToolbar = useMemo(() => (
    columns.map((col) => ({ key: String(col.key), label: col.label }))
  ), [columns]);

  const hiddenKanbanFields = useMemo(() => (
    new Set(
      KANBAN_FIELD_CONFIG
        .filter((field) => !visibleFields.has(field.id))
        .map((field) => field.id)
    )
  ), [visibleFields]);

  const breakdownPrintPreviewData = useMemo(() => (
    createBreakdownPrintPreviewData({
      rows: rowsForPrintPreview,
      columns: visibleColumns as ColumnConfig[],
      year: breakdownYear,
      entityName,
    })
  ), [rowsForPrintPreview, visibleColumns, breakdownYear, entityName]);

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
            borderColor: "var(--border)",
          }}
        >
          <TableToolbar
            searchQuery={search}
            onSearchChange={setSearch}
            searchInputRef={searchInputRef}
            selectedCount={selectedIds.size}
            onClearSelection={handleClearSelection}
            hiddenColumns={hiddenColumns}
            onToggleColumn={handleToggleColumn}
            onShowAllColumns={handleShowAllColumns}
            onHideAllColumns={handleHideAllColumns}
            columns={tableColumnsForToolbar}
            onBulkTrash={handleBulkTrash}
            onOpenTrash={onOpenTrash}
            onExportCSV={handleExportCSV}
            onOpenPrintPreview={handleOpenPrintPreview}
            isAdmin={isAdmin}
            pendingRequestsCount={breakdownPendingCount ?? pendingRequestsCount}
            onOpenShare={() => setShowShareModal(true)}
            onAddNew={onAdd}
            accentColor={accentColorValue}
            sortOption={sortOption}
            onSortChange={onSortChange}
            showSort={!!onSortChange}
            hasPrintDraft={hasDraft}
            showDirectPrint={false}
          />

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
          <TableToolbar
            searchQuery={search}
            onSearchChange={setSearch}
            searchInputRef={searchInputRef}
            selectedCount={selectedIds.size}
            onClearSelection={handleClearSelection}
            hiddenColumns={hiddenKanbanFields}
            onToggleColumn={handleToggleField}
            onShowAllColumns={handleShowAllFields}
            onHideAllColumns={handleHideAllFields}
            columns={KANBAN_FIELD_CONFIG.map((field) => ({ key: field.id, label: field.label }))}
            onBulkTrash={handleBulkTrash}
            onOpenTrash={onOpenTrash}
            isAdmin={isAdmin}
            pendingRequestsCount={breakdownPendingCount ?? pendingRequestsCount}
            onOpenShare={() => setShowShareModal(true)}
            onAddNew={onAdd}
            accentColor={accentColorValue}
            visibleStatuses={visibleStatuses}
            onToggleStatus={handleToggleStatus}
            showExport={false}
            showDirectPrint={false}
            columnTriggerLabel="Fields"
            sortOption={sortOption}
            onSortChange={onSortChange}
            showSort={!!onSortChange}
          />

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

      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        budgetItems={breakdownPrintPreviewData.budgetItems}
        totals={breakdownPrintPreviewData.totals}
        columns={breakdownPrintPreviewData.columns}
        setupColumnSelection={{
          sourceColumns: breakdownPrintPreviewData.columns,
          maxColumns: 12,
        }}
        hiddenColumns={hiddenColumns}
        filterState={{
          searchQuery: search,
          statusFilter: [],
          yearFilter: [breakdownYear],
          sortField: null,
          sortDirection: null,
        }}
        year={breakdownPrintPreviewData.year}
        particular={entityName}
        coverTitle={breakdownPrintPreviewData.coverTitle}
        coverSubtitle={breakdownPrintPreviewData.coverSubtitle}
        defaultDocumentTitle={breakdownPrintPreviewData.defaultDocumentTitle}
        existingDraft={draftState}
        onDraftSaved={saveDraft}
      />

      <ConfirmationModal
        isOpen={showDraftConfirm}
        onClose={() => setShowDraftConfirm(false)}
        onConfirm={handleLoadDraft}
        title="Load Existing Draft?"
        message={`You have a print preview draft from ${formattedLastSaved || "recently"}. Load it or start fresh?`}
        confirmText="Load Draft"
        cancelText="Start Fresh"
        onCancel={handleStartFresh}
        variant="default"
      />

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
