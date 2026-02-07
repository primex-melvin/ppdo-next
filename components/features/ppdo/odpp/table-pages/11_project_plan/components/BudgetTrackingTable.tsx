// app/dashboard/project/[year]/components/BudgetTrackingTable.tsx

"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Table as TableIcon } from "lucide-react";

// Components
import { Modal } from "./BudgetModal";
import { ConfirmationModal } from "./BudgetConfirmationModal";
import { BudgetItemForm } from "./BudgetItemForm";
import BudgetShareModal from "./BudgetShareModal";
import { BudgetTableToolbar } from "@/components/features/ppdo/odpp/utilities/table/toolbar";
import { BudgetContextMenu } from "../table/BudgetContextMenu";
import { BudgetBulkToggleDialog } from "./BudgetBulkToggleDialog";
import { PrintPreviewModal } from "@/components/features/ppdo/odpp/utilities/table/print-preview/PrintPreviewModal";
import { BudgetResizableTable } from "./BudgetResizableTable";
import { TrashBinModal, TrashConfirmationModal } from "@/components/shared/modals";
import { BudgetItemKanban } from "./BudgetItemKanban";
import { Id } from "@/convex/_generated/dataModel";
import { TOGGLEABLE_FIELDS } from "@/components/features/ppdo/odpp/utilities/shared/kanban/KanbanFieldVisibilityMenu";

// Hooks
import { useBudgetTableState } from "../hooks/useBudgetTableState";
import { useBudgetTableFilters } from "../hooks/useBudgetTableFilters";
import { useBudgetTableSelection } from "../hooks/useBudgetTableSelection";
import { useBudgetTableActions } from "../hooks/useBudgetTableActions";
import { useBudgetTablePrint } from "../hooks/useBudgetTablePrint";
import { usePrintDraft } from "../hooks/usePrintDraft";

// Utils
import { applyFilters, createBudgetFilterConfig } from "@/services";
import { calculateBudgetTotals, calculateTotalUtilizationRate } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/utils";
import { convertToPrintTotals, getVisibleColumns, formatTimestamp } from "../utils/budgetTableHelpers";

// Types

import { BUDGET_TABLE_COLUMNS, DEFAULT_COLUMN_WIDTHS } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/constants";
import { BudgetItem } from "@/types/types";
import { BudgetTrackingTableProps } from "../types";
// import { useGenericTableSettings } from "@/components/features/ppdo/shared/hooks"; // Removed

/**
 * Main BudgetTrackingTable component - Refactored with custom hooks
 * 
 * This component orchestrates all table functionality through custom hooks:
 * - useBudgetTableState: Modal and UI state
 * - useBudgetTableFilters: Search, sort, filter, column visibility
 * - useBudgetTableSelection: Row selection and bulk actions
 * - useBudgetTableActions: CRUD operations and context menu
 * - useBudgetTablePrint: Print preview and export
 */
export function BudgetTrackingTable({
  budgetItems,
  onAdd,
  onEdit,
  onDelete,
  expandButton,
  onOpenTrash,
}: BudgetTrackingTableProps) {
  const { accentColorValue } = useAccentColor();
  const accessCheck = useQuery(api.budgetAccess.canAccess);
  const pendingRequestsCount = useQuery(api.accessRequests.getPendingCount);

  const isAdmin =
    accessCheck?.user?.role === "admin" ||
    accessCheck?.user?.role === "super_admin";

  // ============================================================================
  // KANBAN VIEW STATE
  // ============================================================================

  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [showViewToggle, setShowViewToggle] = useState(false);
  const [visibleStatuses, setVisibleStatuses] = useState<Set<string>>(
    new Set(['delayed', 'ongoing', 'completed'])
  );
  const [visibleFields, setVisibleFields] = useState<Set<string>>(
    new Set(['totalBudgetAllocated', 'totalBudgetUtilized', 'balance', 'utilizationRate'])
  );

  // Mutation for Kanban drag-drop status changes
  const updateBudgetItemStatus = useMutation(api.budgetItems.updateStatus);

  // ============================================================================
  // COLUMN WIDTH MANAGEMENT (Convex persistence)
  // ============================================================================

  // Column settings managed by BudgetResizableTable

  // ============================================================================
  // TRASH CONFIRMATION STATE
  // ============================================================================

  const [showTrashConfirmModal, setShowTrashConfirmModal] = useState(false);
  const [trashTargetItems, setTrashTargetItems] = useState<BudgetItem[]>([]);
  const [isBulkTrash, setIsBulkTrash] = useState(false);
  const [trashPreviewData, setTrashPreviewData] = useState<any>(null);
  const [isTrashPreviewLoading, setIsTrashPreviewLoading] = useState(false);

  // ============================================================================
  // CUSTOM HOOKS - State Management
  // ============================================================================

  const {
    modalStates,
    setShowAddModal,
    setShowEditModal,
    setShowDeleteModal,
    setShowShareModal,
    setShowHideAllWarning,
    setShowPrintPreview,
    setShowDraftConfirm,
    setShowBulkToggleDialog,
    setShowTrashModal,
    showHeaderSkeleton,
  } = useBudgetTableState(new Date().getFullYear());

  const {
    searchQuery,
    setSearchQuery,
    sortField,
    sortDirection,
    statusFilter,
    yearFilter,
    hiddenColumns,
    searchInputRef,
    handleSort,
    toggleStatusFilter,
    toggleYearFilter,
    clearAllFilters,
    handleToggleColumn,
    handleShowAllColumns,
    handleHideAllColumns,
    hasActiveFilters,
    uniqueStatuses,
    uniqueYears,
  } = useBudgetTableFilters(budgetItems);

  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  const filteredAndSortedItems = useMemo(
    () =>
      applyFilters(
        budgetItems,
        createBudgetFilterConfig(
          searchQuery,
          statusFilter,
          yearFilter,
          sortField,
          sortDirection
        )
      ),
    [budgetItems, searchQuery, statusFilter, yearFilter, sortField, sortDirection]
  );

  const totals = useMemo(
    () => calculateBudgetTotals(filteredAndSortedItems),
    [filteredAndSortedItems]
  );

  const totalUtilizationRate = useMemo(
    () => calculateTotalUtilizationRate(totals),
    [totals]
  );

  const printTotals = useMemo(
    () => convertToPrintTotals(totals),
    [totals]
  );

  // ============================================================================
  // SELECTION HOOKS
  // ============================================================================

  const {
    selectedIds,
    selectedItem,
    setSelectedItem,
    setSelectedIds,
    handleSelectAll,
    handleSelectRow,
    isAllSelected,
    isIndeterminate,
  } = useBudgetTableSelection(filteredAndSortedItems);

  // ============================================================================
  // TRASH CONFIRMATION HANDLERS
  // ============================================================================

  /**
   * Show trash confirmation modal with selected items
   */
  const handleShowTrashConfirmation = useCallback((items: BudgetItem[], isBulk: boolean) => {
    setTrashTargetItems(items);
    setIsBulkTrash(isBulk);
    setShowTrashConfirmModal(true);

    // For single item, fetch preview data from API
    if (items.length === 1) {
      setIsTrashPreviewLoading(true);
      // Preview data will be loaded by the component using Convex query
      // For now, we'll set a flag and the useEffect below will handle it
    }
  }, []);

  /**
   * Handle confirmed trash (single or bulk)
   */
  const handleConfirmTrash = useCallback(async (reason?: string) => {
    if (isBulkTrash && trashTargetItems.length > 0) {
      // Bulk delete using the onDelete callback for each item
      for (const item of trashTargetItems) {
        if (onDelete) {
          await onDelete(item.id);
        }
      }
      setSelectedIds(new Set());
    } else if (trashTargetItems.length === 1) {
      // Single delete
      if (onDelete) {
        await onDelete(trashTargetItems[0].id);
      }
    }

    // Reset state
    setShowTrashConfirmModal(false);
    setTrashTargetItems([]);
    setIsBulkTrash(false);
    setTrashPreviewData(null);
    setSelectedItem(null);
  }, [isBulkTrash, trashTargetItems, onDelete, setSelectedIds, setSelectedItem]);

  /**
   * Handle cancel trash
   */
  const handleCancelTrash = useCallback(() => {
    setShowTrashConfirmModal(false);
    setTrashTargetItems([]);
    setIsBulkTrash(false);
    setTrashPreviewData(null);
    setSelectedItem(null);
  }, [setSelectedItem]);

  // ============================================================================
  // ACTION HOOKS
  // ============================================================================

  const {
    contextMenu,
    setContextMenu,
    isTogglingAutoCalculate,
    handleRowClick,
    handleContextMenu,
    handleEdit,
    handlePin,
    handleToggleAutoCalculate,
    handleBulkTrash,
    handleOpenBulkToggleDialog,
    handleBulkToggleAutoCalculate,
    isBulkToggling,
    executeDelete,
    executeBulkDelete,
  } = useBudgetTableActions(
    selectedIds,
    setSelectedIds,
    setSelectedItem,
    setShowEditModal,
    setShowBulkToggleDialog,
    filteredAndSortedItems,
    handleShowTrashConfirmation
  );

  // ============================================================================
  // PRINT & EXPORT HOOKS
  // ============================================================================

  const searchParams = useSearchParams();
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

  const { draftState, saveDraft, hasDraft, deleteDraft } = usePrintDraft(year);

  const {
    handleOpenPrintPreview,
    handleLoadDraft,
    handleStartFresh,
    handleExportCSV,
  } = useBudgetTablePrint(
    filteredAndSortedItems,
    hiddenColumns,
    setShowPrintPreview,
    setShowDraftConfirm,
    {
      hasDraft,
      deleteDraft,
      year,
    }
  );

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const handleSave = (
    formData: Omit<
      BudgetItem,
      | "id"
      | "utilizationRate"
      | "projectCompleted"
      | "projectDelayed"
      | "projectsOngoing"
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

  const confirmHideAll = () => {
    const allColIds = BUDGET_TABLE_COLUMNS.map((c) => c.key);
    const newHidden = new Set(allColIds);
    // Apply the hidden columns - this would need to be lifted to the filters hook
    // For now, we'll handle this in the component
    setShowHideAllWarning(false);
  };

  // ============================================================================
  // KANBAN VIEW HANDLERS
  // ============================================================================

  // Keyboard shortcut to toggle view toggle visibility (Ctrl+Shift+V)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "V") {
        e.preventDefault();
        setShowViewToggle((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle Kanban status change via drag-drop
  const handleKanbanStatusChange = useCallback(async (itemId: string, newStatus: string) => {
    const validStatuses = ["completed", "ongoing", "delayed"] as const;
    if (validStatuses.includes(newStatus as typeof validStatuses[number])) {
      try {
        await updateBudgetItemStatus({
          id: itemId as Id<"budgetItems">,
          status: newStatus as "completed" | "ongoing" | "delayed",
        });
      } catch (error) {
        console.error("Failed to update budget item status:", error);
      }
    }
  }, [updateBudgetItemStatus]);

  // Get the original BudgetItem from card data for Kanban actions
  const getOriginalItem = useCallback((itemId: string) => {
    return budgetItems.find(item => item.id === itemId);
  }, [budgetItems]);

  // Kanban view log handler
  const handleKanbanViewLog = useCallback((item: BudgetItem) => {
    // Navigate to the project's particular page for detailed view
    const slug = item.particular
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    window.location.href = `/dashboard/project/${year}/${slug}?view=kanban`;
  }, [year]);

  // Kanban edit handler
  const handleKanbanEdit = useCallback((item: BudgetItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
  }, [setSelectedItem, setShowEditModal]);

  // Kanban delete handler
  const handleKanbanDelete = useCallback((item: BudgetItem) => {
    handleShowTrashConfirmation([item], false);
  }, [handleShowTrashConfirmation]);

  // Kanban pin handler
  const handleKanbanPin = useCallback((item: BudgetItem) => {
    handlePin(item);
  }, [handlePin]);

  // Toggle status visibility
  const handleToggleStatus = useCallback((statusId: string, isChecked: boolean) => {
    setVisibleStatuses(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(statusId);
      } else {
        newSet.delete(statusId);
      }
      return newSet;
    });
  }, []);

  // Toggle field visibility
  const handleToggleField = useCallback((fieldId: string, isChecked: boolean) => {
    setVisibleFields(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(fieldId);
      } else {
        newSet.delete(fieldId);
      }
      return newSet;
    });
  }, []);

  const handleShowAllFields = useCallback(() => {
    setVisibleFields(new Set(TOGGLEABLE_FIELDS.map(f => f.id)));
  }, []);

  const handleHideAllFields = useCallback(() => {
    setVisibleFields(new Set());
  }, []);

  // ============================================================================
  // BUILD PREVIEW DATA FOR MODAL
  // ============================================================================

  // Query for single item preview
  const singlePreviewQuery = useQuery(
    api.trash.getTrashPreview,
    showTrashConfirmModal && trashTargetItems.length === 1
      ? {
        entityType: "budgetItem",
        entityId: trashTargetItems[0]?.id
      }
      : "skip"
  );

  // Update preview data when query resolves
  useMemo(() => {
    if (showTrashConfirmModal && trashTargetItems.length === 1) {
      if (singlePreviewQuery !== undefined) {
        setTrashPreviewData(singlePreviewQuery);
        setIsTrashPreviewLoading(false);
      } else {
        setIsTrashPreviewLoading(true);
      }
    } else if (showTrashConfirmModal && trashTargetItems.length > 1) {
      // For bulk, construct aggregated preview data
      setTrashPreviewData({
        targetItem: {
          id: "bulk",
          name: `${trashTargetItems.length} Budget Items`,
          type: "budgetItem",
        },
        cascadeCounts: {
          projects: trashTargetItems.reduce((sum, item) => sum + (item.projectsOngoing || 0), 0),
          breakdowns: 0, // Would need to calculate from API
          inspections: 0, // Would need to calculate from API
          totalFinancialImpact: {
            allocated: trashTargetItems.reduce((sum, item) => sum + (item.totalBudgetAllocated || 0), 0),
            utilized: trashTargetItems.reduce((sum, item) => sum + (item.totalBudgetUtilized || 0), 0),
            obligated: trashTargetItems.reduce((sum, item) => sum + (item.obligatedBudget || 0), 0),
          },
        },
        affectedItems: {
          projects: [],
          breakdowns: [],
        },
        warnings: [`This will move ${trashTargetItems.length} budget items to trash.`],
        canDelete: true,
      });
      setIsTrashPreviewLoading(false);
    }
  }, [showTrashConfirmModal, trashTargetItems, singlePreviewQuery]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Main Table Container with Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "kanban")} className="w-full">
        <div className="print-area inline-block max-w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">

          {/* Toolbar */}
          <BudgetTableToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchInputRef={searchInputRef}
            selectedCount={selectedIds.size}
            onClearSelection={() => setSelectedIds(new Set())}

            // Unified Column/Field Visibility
            columnTriggerLabel={viewMode === 'kanban' ? "Fields" : "Columns"}
            columns={viewMode === 'table'
              ? undefined // Use default from BudgetTableToolbar
              : TOGGLEABLE_FIELDS.map(f => ({ key: f.id, label: f.label }))
            }
            hiddenColumns={viewMode === 'table'
              ? hiddenColumns
              : new Set(TOGGLEABLE_FIELDS.filter(f => !visibleFields.has(f.id)).map(f => f.id))
            }
            onToggleColumn={viewMode === 'table'
              ? handleToggleColumn
              : (id, checked) => handleToggleField(id, !checked) // Invert checked because menu logic assumes "hidden columns" but we track "visible fields"
            }
            onShowAllColumns={viewMode === 'table' ? handleShowAllColumns : handleShowAllFields}
            onHideAllColumns={viewMode === 'table'
              ? () => setShowHideAllWarning(true)
              : handleHideAllFields
            }

            onExportCSV={handleExportCSV}
            onOpenPrintPreview={handleOpenPrintPreview}
            hasPrintDraft={hasDraft}
            isAdmin={isAdmin}
            pendingRequestsCount={pendingRequestsCount}
            onOpenShare={() => setShowShareModal(true)}
            onOpenTrash={onOpenTrash || (() => setShowTrashModal(true))}
            onBulkTrash={handleBulkTrash}
            onBulkToggleAutoCalculate={handleOpenBulkToggleDialog}
            onAddNew={onAdd ? () => setShowAddModal(true) : undefined}
            expandButton={expandButton}
            accentColor={accentColorValue}
            // Kanban View Support
            visibleStatuses={viewMode === 'kanban' ? visibleStatuses : undefined}
            onToggleStatus={viewMode === 'kanban' ? handleToggleStatus : undefined}
            visibleFields={undefined} // Hide the separate Fields toolbar
            onToggleField={undefined}
            showColumnVisibility={true} // Always show the unified menu
            showExport={viewMode === "table"}
          />

          {/* View Toggle (Ctrl+Shift+V to show/hide) */}
          {showViewToggle && (
            <div className="flex items-center justify-center py-2 border-b border-zinc-200 dark:border-zinc-800">
              <TabsList className="bg-zinc-100 dark:bg-zinc-800">
                <TabsTrigger value="table" className="gap-2">
                  <TableIcon className="w-4 h-4" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="kanban" className="gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Kanban
                </TabsTrigger>
              </TabsList>
            </div>
          )}

          {/* Print Header (hidden on screen, visible in print) */}
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

          {/* Table View */}
          <TabsContent value="table" className="mt-0">
            <div className="overflow-auto">
              <BudgetResizableTable
                budgetItems={filteredAndSortedItems}
                hiddenColumns={hiddenColumns}
                onRowClick={handleRowClick}
                onEdit={(id, item) => {
                  setSelectedItem(item);
                  setShowEditModal(true);
                }}
                onDelete={(id) => {
                  const item = budgetItems.find(i => i.id === id);
                  if (item) handleShowTrashConfirmation([item], false);
                }}
                onPin={handlePin}
                onToggleAutoCalculate={handleToggleAutoCalculate}
                selectedIds={selectedIds}
                onSelectRow={handleSelectRow}
                onSelectAll={handleSelectAll}
              />
            </div>
          </TabsContent>

          {/* Kanban View */}
          <TabsContent value="kanban" className="mt-0">
            <BudgetItemKanban
              data={filteredAndSortedItems}
              isAdmin={isAdmin}
              onViewLog={handleKanbanViewLog}
              onEdit={onEdit ? handleKanbanEdit : undefined}
              onDelete={onDelete ? handleKanbanDelete : undefined}
              onPin={handleKanbanPin}
              visibleStatuses={visibleStatuses}
              visibleFields={visibleFields}
              year={year}
              onStatusChange={handleKanbanStatusChange}
            />
          </TabsContent>
        </div>
      </Tabs>

      {/* Context Menu */}
      {contextMenu && (
        <BudgetContextMenu
          position={{ x: contextMenu.x, y: contextMenu.y }}
          item={contextMenu.entity}
          canEdit={!!onEdit}
          canDelete={!!onDelete}
          onPin={handlePin}
          onEdit={handleEdit}
          onDelete={(item) => handleShowTrashConfirmation([item], false)}
          onToggleAutoCalculate={handleToggleAutoCalculate}
          isTogglingAutoCalculate={isTogglingAutoCalculate}
        />
      )}

      {/* Modals */}
      {modalStates.showAddModal && (
        <Modal
          isOpen={modalStates.showAddModal}
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

      {modalStates.showEditModal && selectedItem && (
        <Modal
          isOpen={modalStates.showEditModal}
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

      {/* Old delete modal - kept for backwards compatibility */}
      {modalStates.showDeleteModal && selectedItem && (
        <ConfirmationModal
          isOpen={modalStates.showDeleteModal}
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

      {/* New Trash Confirmation Modal */}
      <TrashConfirmationModal
        open={showTrashConfirmModal}
        onOpenChange={setShowTrashConfirmModal}
        onConfirm={handleConfirmTrash}
        onCancel={handleCancelTrash}
        previewData={trashPreviewData}
        isLoading={isTrashPreviewLoading}
      />

      {modalStates.showShareModal && (
        <BudgetShareModal
          isOpen={modalStates.showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {modalStates.showHideAllWarning && (
        <ConfirmationModal
          isOpen={modalStates.showHideAllWarning}
          onClose={() => setShowHideAllWarning(false)}
          onConfirm={confirmHideAll}
          title="Hide All Columns?"
          message="Are you sure you want to hide all columns? The table will display no data."
          confirmText="Hide All"
          variant="default"
        />
      )}

      {modalStates.showBulkToggleDialog && (
        <BudgetBulkToggleDialog
          isOpen={modalStates.showBulkToggleDialog}
          onClose={() => setShowBulkToggleDialog(false)}
          onConfirm={handleBulkToggleAutoCalculate}
          selectedCount={selectedIds.size}
          isLoading={isBulkToggling}
        />
      )}



      <PrintPreviewModal
        isOpen={modalStates.showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        budgetItems={filteredAndSortedItems}
        totals={printTotals}
        columns={getVisibleColumns(hiddenColumns)}
        hiddenColumns={hiddenColumns}
        filterState={{
          searchQuery,
          statusFilter,
          yearFilter,
          sortField,
          sortDirection,
        }}
        year={year}
        existingDraft={draftState}
        onDraftSaved={saveDraft}
      />

      {modalStates.showDraftConfirm && (
        <ConfirmationModal
          isOpen={modalStates.showDraftConfirm}
          onClose={() => setShowDraftConfirm(false)}
          onConfirm={handleLoadDraft}
          onCancel={handleStartFresh}
          title="Load Existing Draft?"
          message={`You have a print preview draft from ${draftState ? formatTimestamp(draftState.timestamp) : 'recently'}. Load it or start fresh?`}
          confirmText="Load Draft"
          cancelText="Start Fresh"
          variant="default"
        />
      )}

      {modalStates.showTrashModal && (
        <TrashBinModal
          isOpen={modalStates.showTrashModal}
          onClose={() => setShowTrashModal(false)}
          type="budget"
        />
      )}
    </>
  );
}