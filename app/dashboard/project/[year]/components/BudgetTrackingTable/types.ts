// app/dashboard/project/budget/components/BudgetTrackingTable/types.ts

import { BudgetItem, BudgetContextMenuState } from "@/app/dashboard/project/[year]/types";

/**
 * Props for the main BudgetTrackingTable component
 */
export interface BudgetTrackingTableProps {
  budgetItems: BudgetItem[];
  onAdd?: (
    item: Omit<
      BudgetItem,
      | "id"
      | "utilizationRate"
      | "projectCompleted"
      | "projectDelayed"
      | "projectsOnTrack"
      | "status"
    >
  ) => void;
  onEdit?: (
    id: string,
    item: Omit<
      BudgetItem,
      | "id"
      | "utilizationRate"
      | "projectCompleted"
      | "projectDelayed"
      | "projectsOnTrack"
      | "status"
    >
  ) => void;
  onDelete?: (id: string) => void;
  expandButton?: React.ReactNode;
  onOpenTrash?: () => void;
}

/**
 * Modal states for the table
 */
export interface ModalStates {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  showShareModal: boolean;
  showHideAllWarning: boolean;
  showPrintPreview: boolean;
  showDraftConfirm: boolean;
  showBulkToggleDialog: boolean;
  showTrashModal: boolean;
}

/**
 * Filter states for the table
 */
export interface FilterStates {
  searchQuery: string;
  sortField: string | null;
  sortDirection: "asc" | "desc" | null;
  statusFilter: string[];
  yearFilter: number[];
  hiddenColumns: Set<string>;
}

/**
 * Selection states for the table
 */
export interface SelectionStates {
  selectedIds: Set<string>;
  selectedItem: BudgetItem | null;
  contextMenu: BudgetContextMenuState | null;
}

/**
 * Processing states for async operations
 */
export interface ProcessingStates {
  isTogglingAutoCalculate: boolean;
  isBulkToggling: boolean;
}

/**
 * Draft states for print preview
 */
export interface DraftStates {
  hasDraft: boolean;
  draftState: any | null;
}

/**
 * Return type for useBudgetTableState hook
 */
export interface UseBudgetTableStateReturn {
  modalStates: ModalStates;
  setShowAddModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDeleteModal: (show: boolean) => void;
  setShowShareModal: (show: boolean) => void;
  setShowHideAllWarning: (show: boolean) => void;
  setShowPrintPreview: (show: boolean) => void;
  setShowDraftConfirm: (show: boolean) => void;
  setShowBulkToggleDialog: (show: boolean) => void;
  setShowTrashModal: (show: boolean) => void;
  hasDraft: boolean;
  showHeaderSkeleton: boolean;
}

/**
 * Return type for useBudgetTableFilters hook
 */
export interface UseBudgetTableFiltersReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortField: string | null;
  sortDirection: "asc" | "desc" | null;
  statusFilter: string[];
  yearFilter: number[];
  hiddenColumns: Set<string>;
  searchInputRef: React.RefObject<HTMLInputElement>;
  handleSort: (field: string | null) => void;
  toggleStatusFilter: (status: string) => void;
  toggleYearFilter: (year: number) => void;
  clearAllFilters: () => void;
  handleToggleColumn: (columnId: string, isChecked: boolean) => void;
  handleShowAllColumns: () => void;
  handleHideAllColumns: () => void;
  hasActiveFilters: boolean;
  uniqueStatuses: string[];
  uniqueYears: number[];
}

/**
 * Return type for useBudgetTableSelection hook
 */
export interface UseBudgetTableSelectionReturn {
  selectedIds: Set<string>;
  selectedItem: BudgetItem | null;
  setSelectedItem: (item: BudgetItem | null) => void;
  setSelectedIds: (ids: Set<string>) => void;
  handleSelectAll: (checked: boolean) => void;
  handleSelectRow: (id: string, checked: boolean) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

/**
 * Return type for useBudgetTableActions hook
 */
export interface UseBudgetTableActionsReturn {
  contextMenu: BudgetContextMenuState | null;
  setContextMenu: (menu: BudgetContextMenuState | null) => void;
  isTogglingAutoCalculate: boolean;
  handleRowClick: (item: BudgetItem, e: React.MouseEvent) => void;
  handleContextMenu: (e: React.MouseEvent, item: BudgetItem) => void;
  handleEdit: (item: BudgetItem) => void;
  handleDelete: (item: BudgetItem) => void;
  handlePin: (item: BudgetItem) => Promise<void>;
  handleToggleAutoCalculate: (item: BudgetItem, newValue: boolean) => Promise<void>;
  handleBulkTrash: () => Promise<void>;
  handleOpenBulkToggleDialog: () => void;
  handleBulkToggleAutoCalculate: (autoCalculate: boolean, reason?: string) => Promise<void>;
  isBulkToggling: boolean;
}