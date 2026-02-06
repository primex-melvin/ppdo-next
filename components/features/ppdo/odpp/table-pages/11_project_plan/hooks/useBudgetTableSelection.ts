/**
 * @deprecated Use useTableSelection from @/components/features/ppdo/odpp/data-tables/core/hooks instead
 * This hook is kept for backward compatibility with budget-specific selectedItem state
 */
"use client";

import { useState } from "react";
import { useTableSelection } from "@/components/features/ppdo/odpp/utilities/data-tables/core/hooks/useTableSelection";
import { BudgetItem } from "../types";
import { UseBudgetTableSelectionReturn } from "../types";

/**
 * Manages row selection state and operations for budget table
 * Handles select all, select individual rows, and single item selection for modals
 * 
 * This is a wrapper around the generic useTableSelection hook that adds
 * budget-specific selectedItem state for edit/delete modal handling.
 */
export function useBudgetTableSelection(
  filteredItems: BudgetItem[]
): UseBudgetTableSelectionReturn {
  // Use the generic table selection hook for ID-based selection
  const selection = useTableSelection({
    data: filteredItems,
    getItemId: (item) => item.id,
  });

  // Budget-specific state for single item selection (used by edit/delete modals)
  const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);

  return {
    // From generic hook
    selectedIds: selection.selectedIds,
    setSelectedIds: selection.setSelectedIds,
    handleSelectAll: selection.handleSelectAll,
    handleSelectRow: selection.handleSelectRow,
    isAllSelected: selection.isAllSelected,
    isIndeterminate: selection.isIndeterminate,
    // Budget-specific
    selectedItem,
    setSelectedItem,
  };
}