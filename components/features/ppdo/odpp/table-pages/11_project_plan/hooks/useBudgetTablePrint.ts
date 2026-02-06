// app/dashboard/project/[year]/components/hooks/useBudgetTablePrint.ts

import { useCallback } from "react";
import { exportToCSV, createBudgetExportConfig } from "@/services";
import { BUDGET_TABLE_COLUMNS } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/constants";
import { BudgetItem } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/types";
import { toast } from "sonner";

/**
 * Manages print preview and export operations
 */
export function useBudgetTablePrint(
  filteredItems: BudgetItem[],
  hiddenColumns: Set<string>,
  setShowPrintPreview: (show: boolean) => void,
  setShowDraftConfirm: (show: boolean) => void,
  draftOps: {
    hasDraft: boolean;
    deleteDraft: () => boolean;
    year: number;
  }
) {
  const { hasDraft, deleteDraft, year } = draftOps;

  /**
   * Handle print preview open
   */
  const handleOpenPrintPreview = useCallback(() => {
    console.group('ðŸ“ STEP 1: Print Preview Button Clicked');
    console.log('ðŸ”¢ Total Items in Table:', filteredItems.length);
    console.table(filteredItems.slice(0, 3)); // Show first 3 items in table format
    console.log('ðŸ“Š First Item Details:', filteredItems[0]);
    console.log('ðŸ” Hidden Columns:', Array.from(hiddenColumns));
    console.log('ðŸ“… Year:', year);
    console.log('ðŸ’¾ Has Existing Draft:', hasDraft);
    console.groupEnd();

    if (hasDraft) {
      setShowDraftConfirm(true);
    } else {
      setShowPrintPreview(true);
    }
  }, [hasDraft, setShowDraftConfirm, setShowPrintPreview, filteredItems, hiddenColumns, year]);

  /**
   * Load existing draft
   */
  const handleLoadDraft = useCallback(() => {
    setShowPrintPreview(true);
    setShowDraftConfirm(false);
  }, [setShowPrintPreview, setShowDraftConfirm]);

  /**
   * Start fresh (delete draft)
   */
  const handleStartFresh = useCallback(() => {
    const success = deleteDraft();
    if (success) {
      setShowPrintPreview(true);
      setShowDraftConfirm(false);
    }
  }, [deleteDraft, setShowPrintPreview, setShowDraftConfirm]);

  /**
   * Handle CSV export
   */
  const handleExportCSV = useCallback(() => {
    try {
      const columns = BUDGET_TABLE_COLUMNS.map(col => ({
        id: col.key,
        label: col.label,
        align: col.align
      }));

      exportToCSV(
        filteredItems,
        createBudgetExportConfig(columns, hiddenColumns)
      );
      toast.success("CSV exported successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export CSV");
    }
  }, [filteredItems, hiddenColumns]);

  return {
    year,
    hasDraft,
    handleOpenPrintPreview,
    handleLoadDraft,
    handleStartFresh,
    handleExportCSV,
  };
}