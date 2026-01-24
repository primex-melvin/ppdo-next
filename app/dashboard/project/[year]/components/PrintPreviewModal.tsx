// app/dashboard/project/[year]/components/PrintPreviewModal.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { PrintPreviewToolbar } from './PrintPreviewToolbar';
import { ConfirmationModal } from './ConfirmationModal';
import { convertTableToCanvas } from '@/lib/print-canvas/tableToCanvas';
import { printAllPages } from '@/lib/print';
import { PrintDraft, ColumnDefinition, BudgetTotals, RowMarker } from '@/lib/print-canvas/types';
import { BudgetItem } from '@/app/dashboard/project/[year]/types';
import { Page, HeaderFooter, CanvasElement } from '@/app/(extra)/canvas/_components/editor/types';

// ✅ Import canvas components
import Toolbar from '@/app/(extra)/canvas/_components/editor/toolbar';
import Canvas from '@/app/(extra)/canvas/_components/editor/canvas';
import PagePanel from '@/app/(extra)/canvas/_components/editor/page-panel';
import BottomPageControls from '@/app/(extra)/canvas/_components/editor/bottom-page-controls';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  rowMarkers?: RowMarker[];
}

type ActiveSection = 'header' | 'page' | 'footer';

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
  rowMarkers,
}: PrintPreviewModalProps) {
  // Canvas state
  const [pages, setPages] = useState<Page[]>([]);
  const [header, setHeader] = useState<HeaderFooter>({ elements: [] });
  const [footer, setFooter] = useState<HeaderFooter>({ elements: [] });
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isEditingElementId, setIsEditingElementId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('page');

  // Draft state
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Initialize canvas from table data or existing draft
  useEffect(() => {
    if (!isOpen) return;

    if (existingDraft) {
      setPages(existingDraft.canvasState.pages);
      setHeader(existingDraft.canvasState.header);
      setFooter(existingDraft.canvasState.footer);
      setCurrentPageIndex(existingDraft.canvasState.currentPageIndex);
      setLastSavedTime(existingDraft.timestamp);
      setIsDirty(false);
    } else {
      try {
        const result = convertTableToCanvas({
          items: budgetItems,
          totals,
          columns,
          hiddenColumns,
          pageSize: 'A4',
          orientation: 'portrait',
          includeHeaders: true,
          includeTotals: true,
          title: `Budget Tracking ${year}`,
          subtitle: particular ? `Particular: ${particular}` : undefined,
          rowMarkers,
        });

        setPages(result.pages);
        setHeader(result.header);
        setFooter(result.footer);
        setCurrentPageIndex(0);
        setIsDirty(false);

        toast.success(`Generated ${result.metadata.totalPages} page(s) from ${result.metadata.totalRows} row(s)`);
      } catch (error) {
        toast.error('Failed to convert table to canvas');
      }
    }
  }, [isOpen, budgetItems, totals, columns, hiddenColumns, year, particular, existingDraft, rowMarkers]);

  // Save draft handler
  const handleSaveDraft = useCallback(() => {
    if (!onDraftSaved) return;

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
      onDraftSaved(draft);
      setLastSavedTime(Date.now());
      setIsDirty(false);
      toast.success('Draft saved successfully');
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  }, [pages, header, footer, currentPageIndex, budgetItems, totals, columns, hiddenColumns, filterState, year, particular, onDraftSaved]);

  // Print handler
  const handlePrint = useCallback(() => {
    try {
      printAllPages(pages, header, footer);
    } catch (error) {
      toast.error('Failed to print');
    }
  }, [pages, header, footer]);

  // Close handler
  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Canvas update handlers
  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    const isInHeader = header.elements.some(el => el.id === id);
    if (isInHeader) {
      setHeader(prev => ({
        ...prev,
        elements: prev.elements.map(el => el.id === id ? { ...el, ...updates } as any : el)
      }));
      setIsDirty(true);
      return;
    }

    const isInFooter = footer.elements.some(el => el.id === id);
    if (isInFooter) {
      setFooter(prev => ({
        ...prev,
        elements: prev.elements.map(el => el.id === id ? { ...el, ...updates } as any : el)
      }));
      setIsDirty(true);
      return;
    }

    setPages(prev => prev.map((page, idx) =>
      idx === currentPageIndex
        ? { ...page, elements: page.elements.map(el => el.id === id ? { ...el, ...updates } as any : el) }
        : page
    ));
    setIsDirty(true);
  }, [currentPageIndex, header, footer]);

  const deleteElement = useCallback((id: string) => {
    const isInHeader = header.elements.some(el => el.id === id);
    if (isInHeader) {
      setHeader(prev => ({
        ...prev,
        elements: prev.elements.filter(el => el.id !== id)
      }));
      setSelectedElementId(null);
      setIsDirty(true);
      return;
    }

    const isInFooter = footer.elements.some(el => el.id === id);
    if (isInFooter) {
      setFooter(prev => ({
        ...prev,
        elements: prev.elements.filter(el => el.id !== id)
      }));
      setSelectedElementId(null);
      setIsDirty(true);
      return;
    }

    setPages(prev => prev.map((page, idx) =>
      idx === currentPageIndex
        ? { ...page, elements: page.elements.filter(el => el.id !== id) }
        : page
    ));
    setSelectedElementId(null);
    setIsDirty(true);
  }, [currentPageIndex, header, footer]);

  const changePageSize = useCallback((size: 'A4' | 'Short' | 'Long') => {
    setPages(prev => prev.map(page => ({ ...page, size })));
    setIsDirty(true);
  }, []);

  const changeOrientation = useCallback((orientation: 'portrait' | 'landscape') => {
    setPages(prev => prev.map(page => ({ ...page, orientation })));
    setIsDirty(true);
  }, []);

  const reorderElements = useCallback((fromIndex: number, toIndex: number) => {
    setPages(prev => prev.map((page, idx) => {
      if (idx !== currentPageIndex) return page;
      const newElements = [...page.elements];
      const [movedElement] = newElements.splice(fromIndex, 1);
      newElements.splice(toIndex, 0, movedElement);
      return { ...page, elements: newElements };
    }));
    setIsDirty(true);
  }, [currentPageIndex]);

  const formattedLastSaved = lastSavedTime ? formatTimestamp(lastSavedTime) : '';

  if (!isOpen) return null;

  const currentPage = pages[currentPageIndex] || { id: 'empty', size: 'A4', orientation: 'portrait', elements: [], backgroundColor: '#ffffff' };
  const selectedElement = currentPage.elements.find(el => el.id === selectedElementId) ||
    header.elements.find(el => el.id === selectedElementId) ||
    footer.elements.find(el => el.id === selectedElementId);

  const allElements = [
    ...header.elements.map(el => ({ ...el, section: 'header' as const })),
    ...currentPage.elements.map(el => ({ ...el, section: 'page' as const })),
    ...footer.elements.map(el => ({ ...el, section: 'footer' as const })),
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 flex flex-col">
        {/* Custom Toolbar */}
        <PrintPreviewToolbar
          isDirty={isDirty}
          isSaving={isSaving}
          lastSavedTime={formattedLastSaved}
          onBack={handleClose}
          onClose={handleClose}
          onSaveDraft={handleSaveDraft}
        />

        {/* Main Layout - Canvas + Right Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-stone-50 min-w-0">
            {/* Canvas Toolbar */}
            <div className="sticky top-0 z-10 bg-stone-100 border-b border-stone-300 shadow-sm">
              <Toolbar
                selectedElement={selectedElement}
                onUpdateElement={selectedElementId ? (updates) => updateElement(selectedElementId, updates) : undefined}
                onAddText={() => { }}
                pageSize={currentPage.size}
                orientation={currentPage.orientation}
                onPageSizeChange={changePageSize}
                onOrientationChange={changeOrientation}
                onPrint={handlePrint}
                activeSection={activeSection}
                headerBackgroundColor={header.backgroundColor || '#ffffff'}
                footerBackgroundColor={footer.backgroundColor || '#ffffff'}
                pageBackgroundColor={currentPage.backgroundColor || '#ffffff'}
                onHeaderBackgroundChange={(color) => {
                  setHeader(prev => ({ ...prev, backgroundColor: color }));
                  setIsDirty(true);
                }}
                onFooterBackgroundChange={(color) => {
                  setFooter(prev => ({ ...prev, backgroundColor: color }));
                  setIsDirty(true);
                }}
                onPageBackgroundChange={(color) => {
                  setPages(prev => prev.map((p, i) => i === currentPageIndex ? { ...p, backgroundColor: color } : p));
                  setIsDirty(true);
                }}
                pages={pages}
                header={header}
                footer={footer}
              />
            </div>

            {/* Canvas Scroll Area */}
            <div className="flex-1 overflow-y-auto overflow-x-auto flex items-start justify-center pt-4 pb-16 px-8">
              <Canvas
                page={currentPage}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={updateElement}
                onDeleteElement={deleteElement}
                isEditingElementId={isEditingElementId}
                onEditingChange={setIsEditingElementId}
                header={header}
                footer={footer}
                pageNumber={currentPageIndex + 1}
                totalPages={pages.length}
                activeSection={activeSection}
                onActiveSectionChange={setActiveSection}
              />
            </div>

            {/* Bottom Controls */}
            <div className="border-t border-stone-200 bg-white flex-shrink-0">
              <BottomPageControls
                currentPageIndex={currentPageIndex}
                totalPages={pages.length}
                onAddPage={() => { }}
                onDuplicatePage={() => { }}
                onDeletePage={() => { }}
                elements={allElements}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={updateElement}
                onReorderElements={reorderElements}
                onPreviousPage={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                onNextPage={() => setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1))}
              />
            </div>
          </div>

          {/* Right Sidebar - Page Panel */}
          <div className="w-64 border-l border-stone-200 bg-zinc-50 flex-shrink-0 overflow-y-auto">
            <PagePanel
              pages={pages}
              currentPageIndex={currentPageIndex}
              onPageSelect={setCurrentPageIndex}
              onAddPage={() => { }}
              onReorderPages={(from, to) => { }}
            />
          </div>
        </div>
      </div>

      {/* Close Confirmation */}
      <ConfirmationModal
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={() => {
          handleSaveDraft();
          setTimeout(() => onClose(), 100);
        }}
        title="Save Print Preview as Draft?"
        message="You have unsaved changes. Save them for later?"
        confirmText="Save & Close"
        cancelText="Discard & Close"
        variant="default"
      />
    </>
  );
}

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