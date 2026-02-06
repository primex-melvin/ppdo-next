// app/dashboard/project/[year]/components/hooks/usePrintPreviewDraft.ts (NEW FILE)

import { useCallback } from 'react';
import { toast } from 'sonner';
import { printAllPages } from '@/lib/print';
import { PrintDraft, ColumnDefinition, BudgetTotals } from '@/lib/print-canvas/types';
import { BudgetItem } from '@/components/features/ppdo/odpp/table-pages/11_project_plan/types';
import { Page, HeaderFooter } from '@/app/(extra)/canvas/_components/editor/types';
import { CanvasTemplate } from '@/app/(extra)/canvas/_components/editor/types/template';

interface UsePrintPreviewDraftProps {
  documentTitle: string;
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
  documentTitle,
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

  const handleSaveDraft = useCallback(async () => {
    if (!onDraftSaved) return;

    setIsSaving(true);

    const draft: PrintDraft = {
      id: existingDraft?.id || `draft-${year}-${particular || 'all'}-${Date.now()}`,
      timestamp: existingDraft?.timestamp || Date.now(),
      lastModified: Date.now(),
      documentTitle: documentTitle || particular ? `Budget ${year} - ${particular}` : `Budget ${year}`,
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
      // Check if onDraftSaved returns a promise (async)
      const result = onDraftSaved(draft) as any;

      if (result && typeof result.then === 'function') {
        await result;
      }

      setLastSavedTime(Date.now());
      setIsDirty(false);

      toast.success('Draft Saved', {
        description: 'Your changes have been safely stored. You can resume editing anytime.',
        duration: 4000,
        position: 'top-center',
        className: 'border-green-500/20 bg-green-50/50 dark:bg-green-900/20',
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to Save', {
        description: 'There was an error saving your draft. Please try again.',
        duration: 5000,
        position: 'top-center',
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    documentTitle,
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