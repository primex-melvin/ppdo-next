// app/dashboard/project/[year]/components/hooks/usePrintPreviewDraft.ts (NEW FILE)

import { useCallback } from 'react';
import { toast } from 'sonner';
import { printAllPages } from '@/lib/print';
import { PrintDraft, ColumnDefinition, BudgetTotals } from '@/lib/print-canvas/types';
import { BudgetItem } from '@/app/dashboard/project/[year]/types';
import { Page, HeaderFooter } from '@/app/(extra)/canvas/_components/editor/types';
import { CanvasTemplate } from '@/app/(extra)/canvas/_components/editor/types/template';

interface UsePrintPreviewDraftProps {
  pages: Page[];
  header: HeaderFooter;
  footer: HeaderFooter;
  currentPageIndex: number;
  budgetItems: BudgetItem[];
  totals: BudgetTotals;
  columns: ColumnDefinition[];
  hiddenColumns: Set<string>;
  filterState: {
    searchQuery: string;
    statusFilter: string[];
    yearFilter: number[];
    sortField: string | null;
    sortDirection: string | null;
  };
  year: number;
  particular?: string;
  existingDraft?: PrintDraft | null;
  onDraftSaved?: (draft: PrintDraft) => void;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setLastSavedTime: (time: number) => void;
  setShowCloseConfirm: (show: boolean) => void;
  onClose: () => void;
  appliedTemplate?: CanvasTemplate | null;
}

export function usePrintPreviewDraft({
  pages,
  header,
  footer,
  currentPageIndex,
  budgetItems,
  totals,
  columns,
  hiddenColumns,
  filterState,
  year,
  particular,
  existingDraft,
  onDraftSaved,
  isDirty,
  setIsDirty,
  setIsSaving,
  setLastSavedTime,
  setShowCloseConfirm,
  onClose,
  appliedTemplate,
}: UsePrintPreviewDraftProps) {
  
  const handleSaveDraft = useCallback(() => {
    if (!onDraftSaved) return;

    setIsSaving(true);

    const draft: PrintDraft = {
      id: existingDraft?.id || `draft-${year}-${particular || 'all'}-${Date.now()}`,
      timestamp: Date.now(),
      budgetYear: year,
      budgetParticular: particular,
      filterState: {
        ...filterState,
        hiddenColumns: Array.from(hiddenColumns),
      },
      canvasState: {
        pages,
        currentPageIndex,
        header,
        footer,
      },
      tableSnapshot: {
        items: budgetItems,
        totals,
        columns,
      },
      appliedTemplate: appliedTemplate || undefined,
    };

    try {
      onDraftSaved(draft);
      setLastSavedTime(Date.now());
      setIsDirty(false);
      toast.success('Draft saved successfully');
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  }, [
    pages,
    header,
    footer,
    currentPageIndex,
    budgetItems,
    totals,
    columns,
    hiddenColumns,
    filterState,
    year,
    particular,
    onDraftSaved,
    existingDraft,
    setLastSavedTime,
    setIsDirty,
    setIsSaving,
    appliedTemplate,
  ]);

  const handlePrint = useCallback(() => {
    try {
      printAllPages(pages, header, footer);
    } catch (error) {
      toast.error('Failed to print');
    }
  }, [pages, header, footer]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose, setShowCloseConfirm]);

  return {
    handleSaveDraft,
    handlePrint,
    handleClose,
  };
}