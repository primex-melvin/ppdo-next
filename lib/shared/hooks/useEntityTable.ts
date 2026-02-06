/**
 * useEntityTable Hook
 * 
 * A comprehensive hook that combines all table functionality into a single,
 reusable solution for all entity tables (Budget, Projects, Funds, etc.).
 * 
 * This eliminates the need for separate hooks like:
 * - useBudgetTableState
 * - useBudgetTableFilters
 * - useBudgetTableSelection
 * - useProjectTableState
 * - useFundsTableState
 * etc.
 */

"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useTableState, TableState, TableStateActions } from "./useTableState";
import { useGenericTableSettings } from "@/components/features/ppdo/odpp/utilities/shared/hooks/useGenericTableSettings";
import { SortDirection } from "../types/table.types";

export interface UseEntityTableOptions<T, TSortField extends string> {
  // Data
  data: T[];
  
  // Identifiers
  tableId: string;
  entityName: string;
  
  // Configuration
  defaultSortField?: TSortField;
  defaultSortDirection?: SortDirection;
  defaultColumnWidths?: Record<string, number>;
  
  // Features
  enableSelection?: boolean;
  enableColumnResize?: boolean;
  persistSettings?: boolean;
  
  // Filter functions
  getItemId: (item: T) => string;
  getItemStatus: (item: T) => string | undefined;
  getItemYear: (item: T) => number | undefined;
  getItemOffice: (item: T) => string | undefined;
  searchFields: (keyof T)[];
}

export interface UseEntityTableReturn<T, TSortField extends string> {
  // State
  tableState: TableState<TSortField>;
  tableActions: TableStateActions<TSortField>;
  
  // Settings
  settings: ReturnType<typeof useGenericTableSettings>;
  
  // Modal states
  modals: {
    showAddModal: boolean;
    showEditModal: boolean;
    showDeleteModal: boolean;
    showShareModal: boolean;
    showPrintPreview: boolean;
    showTrashModal: boolean;
    showBulkToggleDialog: boolean;
  };
  modalActions: {
    openAddModal: () => void;
    closeAddModal: () => void;
    openEditModal: () => void;
    closeEditModal: () => void;
    openDeleteModal: () => void;
    closeDeleteModal: () => void;
    openShareModal: () => void;
    closeShareModal: () => void;
    openPrintPreview: () => void;
    closePrintPreview: () => void;
    openTrashModal: () => void;
    closeTrashModal: () => void;
    openBulkToggleDialog: () => void;
    closeBulkToggleDialog: () => void;
  };
  
  // Processed data
  filteredData: T[];
  sortedData: T[];
  selectedItems: T[];
  
  // Actions
  refresh: () => void;
  exportToCSV: (filename?: string) => void;
  print: (orientation?: 'portrait' | 'landscape') => void;
}

export function useEntityTable<T extends Record<string, any>, TSortField extends string>(
  options: UseEntityTableOptions<T, TSortField>
): UseEntityTableReturn<T, TSortField> {
  const {
    data,
    tableId,
    defaultColumnWidths = {},
    getItemId,
    getItemStatus,
    getItemYear,
    getItemOffice,
    searchFields,
  } = options;

  // Use the shared table state hook
  const [tableState, tableActions] = useTableState<TSortField>(data.length);
  
  // Use generic table settings for column/row resizing
  const settings = useGenericTableSettings({
    tableIdentifier: tableId,
    defaultColumnWidths,
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showBulkToggleDialog, setShowBulkToggleDialog] = useState(false);

  // ============================================================================
  // FILTERING
  // ============================================================================
  
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (tableState.searchQuery) {
      const query = tableState.searchQuery.toLowerCase();
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          }
          if (typeof value === 'number') {
            return value.toString().includes(query);
          }
          return false;
        })
      );
    }

    // Apply status filter
    if (tableState.statusFilter.length > 0) {
      result = result.filter(item => {
        const status = getItemStatus(item);
        return status && tableState.statusFilter.includes(status);
      });
    }

    // Apply year filter
    if (tableState.yearFilter.length > 0) {
      result = result.filter(item => {
        const year = getItemYear(item);
        return year && tableState.yearFilter.includes(year);
      });
    }

    // Apply office filter
    if (tableState.officeFilter.length > 0) {
      result = result.filter(item => {
        const office = getItemOffice(item);
        return office && tableState.officeFilter.includes(office);
      });
    }

    return result;
  }, [data, tableState, searchFields, getItemStatus, getItemYear, getItemOffice]);

  // ============================================================================
  // SORTING
  // ============================================================================
  
  const sortedData = useMemo(() => {
    if (!tableState.sortField || !tableState.sortDirection) {
      return filteredData;
    }

    const sorted = [...filteredData];
    const field = tableState.sortField as keyof T;
    const direction = tableState.sortDirection === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * direction;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * direction;
      }

      return 0;
    });

    return sorted;
  }, [filteredData, tableState.sortField, tableState.sortDirection]);

  // ============================================================================
  // SELECTION
  // ============================================================================
  
  const selectedItems = useMemo(() => {
    return sortedData.filter(item => tableState.selectedIds.has(getItemId(item)));
  }, [sortedData, tableState.selectedIds, getItemId]);

  // ============================================================================
  // ACTIONS
  // ============================================================================
  
  const refresh = useCallback(() => {
    // This is a placeholder - actual refresh would be handled by parent
    console.log('Refreshing table...');
  }, []);

  const exportToCSV = useCallback((filename?: string) => {
    const headers = Object.keys(sortedData[0] || {}).join(',');
    const rows = sortedData.map(item => 
      Object.values(item).map(val => {
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val}"`;
        }
        return val;
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${tableId}-export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [sortedData, tableId]);

  const print = useCallback((orientation: 'portrait' | 'landscape' = 'portrait') => {
    const style = document.createElement('style');
    style.textContent = `
      @page {
        size: ${orientation === 'portrait' ? 'A4 portrait' : 'A4 landscape'};
        margin: 0.5in;
      }
      @media print {
        .no-print { display: none !important; }
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================
  
  return {
    tableState,
    tableActions,
    settings,
    modals: {
      showAddModal,
      showEditModal,
      showDeleteModal,
      showShareModal,
      showPrintPreview,
      showTrashModal,
      showBulkToggleDialog,
    },
    modalActions: {
      openAddModal: () => setShowAddModal(true),
      closeAddModal: () => setShowAddModal(false),
      openEditModal: () => setShowEditModal(true),
      closeEditModal: () => setShowEditModal(false),
      openDeleteModal: () => setShowDeleteModal(true),
      closeDeleteModal: () => setShowDeleteModal(false),
      openShareModal: () => setShowShareModal(true),
      closeShareModal: () => setShowShareModal(false),
      openPrintPreview: () => setShowPrintPreview(true),
      closePrintPreview: () => setShowPrintPreview(false),
      openTrashModal: () => setShowTrashModal(true),
      closeTrashModal: () => setShowTrashModal(false),
      openBulkToggleDialog: () => setShowBulkToggleDialog(true),
      closeBulkToggleDialog: () => setShowBulkToggleDialog(false),
    },
    filteredData,
    sortedData,
    selectedItems,
    refresh,
    exportToCSV,
    print,
  };
}

export default useEntityTable;