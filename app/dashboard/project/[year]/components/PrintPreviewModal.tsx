// app/dashboard/project/budget/components/PrintPreviewModal.tsx

"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import Editor from '@/app/dashboard/canvas/_components/editor';
import { PrintPreviewToolbar } from './PrintPreviewToolbar';
import { ConfirmationModal } from './ConfirmationModal';
import { convertTableToCanvas } from '@/lib/print-canvas/tableToCanvas';
import { exportAsPDF } from '@/lib/export-pdf';
import { printAllPages } from '@/lib/print';
import { PrintDraft, ColumnDefinition, BudgetTotals } from '@/lib/print-canvas/types';
import { BudgetItem } from '@/app/dashboard/project/[year]/types';
import { Page, HeaderFooter } from '@/app/dashboard/canvas/_components/editor/types';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Source data
  budgetItems: BudgetItem[];
  totals: BudgetTotals;
  columns: ColumnDefinition[];
  hiddenColumns: Set<string>;
  
  // Filter state for draft association
  filterState: {
    searchQuery: string;
    statusFilter: string[];
    yearFilter: number[];
    sortField: string | null;
    sortDirection: string | null;
  };
  
  // Context
  year: number;
  particular?: string;
  
  // Draft management
  existingDraft?: PrintDraft | null;
  onDraftSaved?: (draft: PrintDraft) => void;
}

export function PrintPreviewModal({
  isOpen,
  onClose,
  budgetItems,
  totals,
  columns,
  hiddenColumns,
  filterState,
  year,
  particular,
  existingDraft,
  onDraftSaved,
}: PrintPreviewModalProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [header, setHeader] = useState<HeaderFooter>({ elements: [] });
  const [footer, setFooter] = useState<HeaderFooter>({ elements: [] });
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Initialize canvas from table data or existing draft
  useEffect(() => {
    if (!isOpen) return;

    if (existingDraft) {
      // Load from draft
      setPages(existingDraft.canvasState.pages);
      setHeader(existingDraft.canvasState.header);
      setFooter(existingDraft.canvasState.footer);
      setCurrentPageIndex(existingDraft.canvasState.currentPageIndex);
      setLastSavedTime(existingDraft.timestamp);
      setIsDirty(false);
    } else {
      // Convert table to canvas
      const result = convertTableToCanvas({
        items: budgetItems,
        totals,
        columns,
        hiddenColumns,
        pageSize: 'A4',
        includeHeaders: true,
        includeTotals: true,
        title: `Budget Tracking ${year}`,
        subtitle: particular ? `Particular: ${particular}` : undefined,
      });

      setPages(result.pages);
      setHeader(result.header);
      setFooter(result.footer);
      setCurrentPageIndex(0);
      setIsDirty(false);
      
      toast.success(`Generated ${result.metadata.totalPages} page(s) from ${result.metadata.totalRows} row(s)`);
    }
  }, [isOpen, budgetItems, totals, columns, hiddenColumns, year, particular, existingDraft]);

  // Auto-save draft every 30 seconds if dirty
  useEffect(() => {
    if (!isDirty || !isOpen) return;

    const timer = setTimeout(() => {
      handleSaveDraft();
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [isDirty, pages, header, footer, currentPageIndex, isOpen]);

  /**
   * Save draft to localStorage
   */
  const handleSaveDraft = useCallback(() => {
    setIsSaving(true);

    const draft: PrintDraft = {
      id: `draft-${year}-${particular || 'all'}-${Date.now()}`,
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
    };

    try {
      onDraftSaved?.(draft);
      setLastSavedTime(Date.now());
      setIsDirty(false);
      toast.success('Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  }, [pages, header, footer, currentPageIndex, budgetItems, totals, columns, hiddenColumns, filterState, year, particular, onDraftSaved]);

  /**
   * Handle export PDF
   */
  const handleExportPDF = useCallback(async () => {
    try {
      await exportAsPDF(pages, header, footer);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export PDF');
    }
  }, [pages, header, footer]);

  /**
   * Handle print
   */
  const handlePrint = useCallback(() => {
    try {
      printAllPages(pages, header, footer);
    } catch (error) {
      console.error('Print failed:', error);
      toast.error('Failed to print');
    }
  }, [pages, header, footer]);

  /**
   * Handle close with confirmation if dirty
   */
  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  /**
   * Handle save and close
   */
  const handleSaveAndClose = useCallback(() => {
    handleSaveDraft();
    setShowCloseConfirm(false);
    setTimeout(() => onClose(), 100);
  }, [handleSaveDraft, onClose]);

  /**
   * Handle discard and close
   */
  const handleDiscardAndClose = useCallback(() => {
    setShowCloseConfirm(false);
    onClose();
  }, [onClose]);

  /**
   * Format last saved time
   */
  const formattedLastSaved = lastSavedTime
    ? formatTimestamp(lastSavedTime)
    : '';

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 flex flex-col">
        {/* Toolbar */}
        <PrintPreviewToolbar
          isDirty={isDirty}
          isSaving={isSaving}
          lastSavedTime={formattedLastSaved}
          onBack={handleClose}
          onClose={handleClose}
          onExportPDF={handleExportPDF}
          onPrint={handlePrint}
          onSaveDraft={handleSaveDraft}
        />

        {/* Canvas Editor */}
        <div className="flex-1 overflow-hidden">
          {/* We need to pass the canvas state to the Editor component */}
          {/* Note: The Editor component manages its own state internally */}
          {/* We'll create a wrapper that syncs with our local state */}
          <CanvasEditorWrapper
            initialPages={pages}
            initialHeader={header}
            initialFooter={footer}
            initialPageIndex={currentPageIndex}
            onStateChange={(newPages, newHeader, newFooter, newIndex) => {
              setPages(newPages);
              setHeader(newHeader);
              setFooter(newFooter);
              setCurrentPageIndex(newIndex);
              setIsDirty(true);
            }}
          />
        </div>
      </div>

      {/* Close Confirmation Dialog */}
      <ConfirmationModal
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={handleSaveAndClose}
        title="Save Print Preview as Draft?"
        message="You have unsaved changes. Save them for later?"
        confirmText="Save & Close"
        cancelText="Discard & Close"
        variant="default"
      />
    </>
  );
}

/**
 * Wrapper component to sync Editor state with parent
 */
function CanvasEditorWrapper({
  initialPages,
  initialHeader,
  initialFooter,
  initialPageIndex,
  onStateChange,
}: {
  initialPages: Page[];
  initialHeader: HeaderFooter;
  initialFooter: HeaderFooter;
  initialPageIndex: number;
  onStateChange: (pages: Page[], header: HeaderFooter, footer: HeaderFooter, pageIndex: number) => void;
}) {
  // The Editor component manages its own state via localStorage
  // We need to override that and inject our state
  // This is a limitation of the current Editor design
  
  // For now, we'll use the Editor as-is and accept that state is managed internally
  // In a production refactor, we'd lift state management out of Editor
  
  return <Editor />;
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}