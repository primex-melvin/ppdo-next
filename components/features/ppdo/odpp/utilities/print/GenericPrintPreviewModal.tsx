// app/dashboard/components/print/GenericPrintPreviewModal.tsx
/**
 * Generic Print Preview Modal - Reusable across domains
 * Works with any PrintDataAdapter to convert domain-specific data to print format
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { PrintPreviewToolbar } from '@/components/features/ppdo/odpp/utilities/table/print-preview/PrintPreviewToolbar';
import { ConfirmationModal } from "@/components/features/ppdo/odpp/table-pages/11_project_plan";
import { convertTableToCanvas } from '@/lib/print-canvas/tableToCanvas';
import { printAllPages } from '@/lib/print';
import { PrintDraft, ColumnDefinition, BudgetTotals, RowMarker } from '@/lib/print-canvas/types';
import { Page, HeaderFooter, ImageElement, CanvasElement } from '@/app/(extra)/canvas/_components/editor/types';
import { PrintDataAdapter } from '@/lib/print/adapters/types';
import { usePrintClipboard } from '@/app/(extra)/canvas/_components/editor/hooks/usePrintClipboard';
import { getPageDimensions, RULER_WIDTH, RULER_HEIGHT } from '@/app/(extra)/canvas/_components/editor/constants';
import { TemplateSelector } from '@/components/features/ppdo/odpp/utilities/table/print-preview/TemplateSelector';
import { TemplateApplicationModal } from '@/components/features/ppdo/odpp/utilities/table/print-preview/TemplateApplicationModal';
import { ColumnVisibilityPanel } from '@/components/features/ppdo/odpp/utilities/table/print-preview/ColumnVisibilityPanel';
import { HorizontalRuler, VerticalRuler } from '@/app/(extra)/canvas/_components/editor/ruler';
import { useRulerState } from '@/app/(extra)/canvas/_components/editor/hooks/useRulerState';
import { CanvasTemplate } from '@/app/(extra)/canvas/_components/editor/types/template';
import { mergeTemplateWithCanvas } from '@/lib/canvas-utils/mergeTemplate';
import { useRef, useMemo } from 'react';

// âœ… Import the actual canvas components we need
import Toolbar from '@/app/(extra)/canvas/_components/editor/toolbar';
import Canvas from '@/app/(extra)/canvas/_components/editor/canvas';
import PagePanel from '@/app/(extra)/canvas/_components/editor/page-panel';
import BottomPageControls from '@/app/(extra)/canvas/_components/editor/bottom-page-controls';

interface GenericPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  adapter: PrintDataAdapter;
  existingDraft?: PrintDraft | null;
  onDraftSaved?: (draft: PrintDraft) => void;
  hiddenColumns?: Set<string>;
  filterState?: {
    searchQuery: string;
    statusFilter: string[];
    yearFilter: number[];
    sortField: string | null;
    sortDirection: string | null;
  };
}

type ActiveSection = 'header' | 'page' | 'footer';

export function GenericPrintPreviewModal({
  isOpen,
  onClose,
  adapter,
  existingDraft,
  onDraftSaved,
  hiddenColumns = new Set(),
  filterState = {
    searchQuery: '',
    statusFilter: [],
    yearFilter: [],
    sortField: null,
    sortDirection: null,
  },
}: GenericPrintPreviewModalProps) {

  // âœ… Canvas state - initialized in useEffect
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
  const [isEditorMode, setIsEditorMode] = useState(true);

  // Document metadata
  const [documentTitle, setDocumentTitle] = useState<string>('');

  // Setup states
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showTemplateApplicationModal, setShowTemplateApplicationModal] = useState(false);
  const [savedTemplate, setSavedTemplate] = useState<CanvasTemplate | null>(null);
  const [appliedTemplate, setAppliedTemplate] = useState<CanvasTemplate | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const initializationStartedRef = useRef(false);

  // Ruler state
  const {
    rulerState,
    toggleRulerVisibility,
    updateMargin,
    updateIndent,
    addTabStop,
    updateTabStop,
    removeTabStop,
    toggleMarginGuides,
    setUniformMargins,
  } = useRulerState();

  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [canvasOffsetLeft, setCanvasOffsetLeft] = useState(0);
  const canvasScrollRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // --- Column Visibility State ---
  const [hiddenCanvasColumns, setHiddenCanvasColumns] = useState<Set<string>>(new Set());
  const [hiddenColumnsVersion, setHiddenColumnsVersion] = useState(0);
  const [columnLabelOverrides, setColumnLabelOverrides] = useState<Map<string, string>>(new Map());
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('printPreview.panelCollapsed') === 'true';
    }
    return false;
  });

  // Calculate canvas offset for ruler positioning
  const updateCanvasOffset = useCallback(() => {
    if (canvasContainerRef.current && canvasScrollRef.current) {
      const scrollContainer = canvasScrollRef.current;
      const currentPage = pages[currentPageIndex];
      if (!currentPage) return;

      const pageDimensions = getPageDimensions(currentPage.size, currentPage.orientation);
      const containerWidth = scrollContainer.clientWidth;
      const canvasWidth = pageDimensions.width;

      const padding = 32; // px-8 padding
      const canvasStartOffset = Math.max(padding, (containerWidth - canvasWidth) / 2);

      setCanvasOffsetLeft(canvasStartOffset);
    }
  }, [pages, currentPageIndex]);

  useEffect(() => {
    updateCanvasOffset();
    const handleResize = () => updateCanvasOffset();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasOffset]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('printPreview.panelCollapsed', isPanelCollapsed.toString());
    }
    updateCanvasOffset();
  }, [isPanelCollapsed, updateCanvasOffset]);

  // Get data from adapter
  const adapterColumns = useMemo(() => adapter.getColumnDefinitions(), [adapter]);
  const printableData = useMemo(() => adapter.toPrintableData(), [adapter]);

  // Prepare table data for ColumnVisibilityPanel
  const tables = useMemo(() => [{
    tableId: 'main-table',
    tableName: printableData.metadata?.title || 'Data Table',
    columns: adapterColumns.map(col => ({
      key: col.key,
      label: columnLabelOverrides.get(col.key) || col.label,
      required: col.key === 'projectTitle' || col.key === 'particular'
    }))
  }], [adapterColumns, columnLabelOverrides, printableData]);

  // Filter and redistribute canvas elements based on hidden columns
  const visibleElements = useMemo(() => {
    const currentPage = pages[currentPageIndex];
    if (!currentPage) return [];

    if (hiddenCanvasColumns.size === 0) {
      return currentPage.elements;
    }

    const tableElements = currentPage.elements.filter(
      el => el.groupId && el.groupName?.toLowerCase().includes('table')
    );

    if (tableElements.length === 0) {
      return currentPage.elements;
    }

    const extractColumnKey = (id: string): string | null => {
      const patterns = [
        /cell-\w+-(\w+)-/,
        /header-(\w+)-/,
        /total-(\w+)-/,
        /cell-\w+-(\w+)$/,
        /header-(\w+)$/,
        /total-(\w+)$/,
      ];
      for (const pattern of patterns) {
        const match = id.match(pattern);
        if (match) return match[1];
      }
      return null;
    };

    const columnInfo = new Map<string, { key: string; originalX: number; originalWidth: number }>();
    tableElements.forEach(el => {
      const columnKey = extractColumnKey(el.id);
      if (columnKey && !columnInfo.has(columnKey)) {
        columnInfo.set(columnKey, {
          key: columnKey,
          originalX: el.x,
          originalWidth: el.width
        });
      }
    });

    const allColumns = Array.from(columnInfo.entries()).sort((a, b) => a[1].originalX - b[1].originalX);
    const visibleColumns = allColumns.filter(([key]) => !hiddenCanvasColumns.has(`main-table.${key}`));
    const hiddenColumnsSet = new Set(allColumns.filter(([key]) => hiddenCanvasColumns.has(`main-table.${key}`)).map(([key]) => key));

    if (visibleColumns.length === 0) {
      return currentPage.elements;
    }

    const pageSize = currentPage.size || 'A4';
    const orientation = currentPage.orientation || 'portrait';
    const MARGIN = 20;

    const PAGE_SIZES = {
      A4: { width: 595, height: 842 },
      Short: { width: 612, height: 792 },
      Long: { width: 612, height: 936 },
    };

    const baseSize = PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES] || PAGE_SIZES.A4;
    const size = orientation === 'landscape'
      ? { width: baseSize.height, height: baseSize.width }
      : baseSize;

    const totalAvailableWidth = size.width - (MARGIN * 2);
    const firstColumnX = allColumns[0][1].originalX;

    const totalVisibleOriginalWidth = visibleColumns.reduce((sum, [, info]) => sum + info.originalWidth, 0);
    const newColumnLayout = new Map<string, { x: number; width: number }>();
    let currentX = firstColumnX;

    visibleColumns.forEach(([key, info]) => {
      const widthRatio = info.originalWidth / totalVisibleOriginalWidth;
      const newWidth = totalAvailableWidth * widthRatio;
      newColumnLayout.set(key, { x: currentX, width: newWidth });
      currentX += newWidth;
    });

    return currentPage.elements.map(el => {
      if (!el.groupId || !el.groupName?.toLowerCase().includes('table')) return el;
      const columnKey = extractColumnKey(el.id);
      if (!columnKey) return el;
      if (hiddenColumnsSet.has(columnKey)) return { ...el, visible: false };
      const newLayout = newColumnLayout.get(columnKey);
      if (newLayout) return { ...el, x: newLayout.x, width: newLayout.width, visible: true };
      return el;
    });
  }, [pages, currentPageIndex, hiddenCanvasColumns]);

  const { columnWidths, tableDimensions } = useMemo(() => {
    const tableElements = visibleElements.filter(
      el => el.groupId && el.groupName?.toLowerCase().includes('table') && el.visible !== false
    );

    if (tableElements.length === 0) {
      return { columnWidths: new Map<string, number>(), tableDimensions: undefined };
    }

    const extractColumnKey = (id: string): string | null => {
      const patterns = [/cell-\w+-(\w+)-/, /header-(\w+)-/, /total-(\w+)-/, /cell-\w+-(\w+)$/, /header-(\w+)$/, /total-(\w+)$/];
      for (const pattern of patterns) {
        const match = id.match(pattern);
        if (match) return match[1];
      }
      return null;
    };

    const widthsMap = new Map<string, number>();
    tableElements.forEach(el => {
      const colKey = extractColumnKey(el.id);
      if (colKey && !widthsMap.has(colKey)) widthsMap.set(colKey, el.width);
    });

    const minX = Math.min(...tableElements.map(el => el.x));
    const minY = Math.min(...tableElements.map(el => el.y));
    const maxX = Math.max(...tableElements.map(el => el.x + el.width));
    const maxY = Math.max(...tableElements.map(el => el.y + el.height));

    return { columnWidths: widthsMap, tableDimensions: { width: maxX - minX, height: maxY - minY } };
  }, [visibleElements]);

  const handleToggleCanvasColumn = useCallback((tableId: string, columnKey: string) => {
    setHiddenCanvasColumns(prev => {
      const next = new Set(prev);
      const fullKey = `${tableId}.${columnKey}`;
      if (next.has(fullKey)) next.delete(fullKey); else next.add(fullKey);
      return next;
    });
    setHiddenColumnsVersion(v => v + 1);
    setIsDirty(true);
  }, []);

  const handleShowAllColumns = useCallback((tableId: string) => {
    setHiddenCanvasColumns(prev => {
      const next = new Set(prev);
      const table = tables.find(t => t.tableId === tableId);
      if (table) table.columns.forEach(col => { if (!col.required) next.delete(`${tableId}.${col.key}`); });
      return next;
    });
    setHiddenColumnsVersion(v => v + 1);
    setIsDirty(true);
  }, [tables]);

  const handleHideAllColumns = useCallback((tableId: string) => {
    setHiddenCanvasColumns(prev => {
      const next = new Set(prev);
      const table = tables.find(t => t.tableId === tableId);
      if (table) table.columns.forEach(col => { if (!col.required) next.add(`${tableId}.${col.key}`); });
      return next;
    });
    setHiddenColumnsVersion(v => v + 1);
    setIsDirty(true);
  }, [tables]);

  const handleRenameColumn = useCallback((tableId: string, columnKey: string, newLabel: string) => {
    setColumnLabelOverrides(prev => {
      const next = new Map(prev);
      next.set(columnKey, newLabel);
      return next;
    });
    setPages(prevPages =>
      prevPages.map(page => ({
        ...page,
        elements: page.elements.map(el => {
          if (el.type === 'text' && el.id.startsWith(`header-${columnKey}-`)) return { ...el, text: newLabel };
          return el;
        })
      }))
    );
    setIsDirty(true);
  }, []);

  // ðŸŽ¨ Initialize canvas from data with optional template and orientation
  const initializeFromTableData = useCallback(
    (template: CanvasTemplate | null = null, orientation: 'portrait' | 'landscape' = 'portrait') => {
      try {
        const printableData = adapter.toPrintableData();
        const columns = adapter.getColumnDefinitions();
        const rowMarkers = adapter.getRowMarkers?.();

        const convertedColumns: ColumnDefinition[] = columns.map(col => ({
          key: col.key,
          label: col.label,
          align: col.align,
          sortable: col.sortable,
          filterable: col.filterable,
        }));

        const result = convertTableToCanvas({
          items: printableData.items as any,
          totals: (printableData.totals || {}) as unknown as BudgetTotals,
          columns: convertedColumns,
          hiddenColumns,
          pageSize: template?.page.size || 'A4',
          orientation: orientation,
          includeHeaders: true,
          includeTotals: true,
          title: printableData.metadata?.title || 'Print Preview',
          subtitle: printableData.metadata?.subtitle,
          rowMarkers: (rowMarkers as RowMarker[] | undefined) || [],
        });

        let finalPages = result.pages;
        let finalHeader = result.header;
        let finalFooter = result.footer;

        if (template) {
          const merged = mergeTemplateWithCanvas(
            result.pages,
            result.header,
            result.footer,
            template
          );
          finalPages = merged.pages;
          finalHeader = merged.header;
          finalFooter = merged.footer;
          setAppliedTemplate(template);
          toast.success(`Applied template "${template.name}"`);
        } else {
          toast.success(`Generated ${result.metadata.totalPages} page(s) in ${orientation} orientation`);
        }

        setPages(finalPages);
        setHeader(finalHeader);
        setFooter(finalFooter);
        setCurrentPageIndex(0);
        setDocumentTitle(printableData.metadata?.title || 'Untitled Document');
        setIsDirty(false);
        setHasInitialized(true);
      } catch (error) {
        console.error('Failed to initialize canvas:', error);
        toast.error('Failed to generate print preview');
      }
    },
    [adapter, hiddenColumns]
  );

  const handleSetupComplete = useCallback((result: { template: CanvasTemplate | null, orientation: 'portrait' | 'landscape' }) => {
    setShowSetupModal(false);
    setTimeout(() => {
      initializeFromTableData(result.template, result.orientation);
    }, 100);
  }, [initializeFromTableData]);

  const handleApplySavedTemplate = useCallback(() => {
    if (!savedTemplate) return;
    setShowTemplateApplicationModal(false);
    setTimeout(() => {
      initializeFromTableData(savedTemplate, savedTemplate.page.orientation);
      if (existingDraft) setLastSavedTime(existingDraft.timestamp);
    }, 100);
  }, [savedTemplate, initializeFromTableData, existingDraft]);

  const handleSkipTemplate = useCallback(() => {
    if (!existingDraft) return;
    setShowTemplateApplicationModal(false);
    setPages(existingDraft.canvasState.pages);
    setHeader(existingDraft.canvasState.header);
    setFooter(existingDraft.canvasState.footer);
    setCurrentPageIndex(existingDraft.canvasState.currentPageIndex);
    setLastSavedTime(existingDraft.timestamp);
    if (existingDraft.appliedTemplate) setAppliedTemplate(existingDraft.appliedTemplate);
    setIsDirty(false);
    setHasInitialized(true);
  }, [existingDraft]);

  // ðŸ”§ Main initialization logic
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
      initializationStartedRef.current = false;
      setShowSetupModal(false);
      setShowTemplateApplicationModal(false);
      setSavedTemplate(null);
      setAppliedTemplate(null);
      return;
    }

    if (hasInitialized || initializationStartedRef.current) return;
    initializationStartedRef.current = true;

    if (existingDraft) {
      setDocumentTitle(existingDraft.documentTitle || 'Untitled Document');
      if (existingDraft.appliedTemplate) {
        setSavedTemplate(existingDraft.appliedTemplate);
        setShowTemplateApplicationModal(true);
      } else {
        setPages(existingDraft.canvasState.pages);
        setHeader(existingDraft.canvasState.header);
        setFooter(existingDraft.canvasState.footer);
        setCurrentPageIndex(existingDraft.canvasState.currentPageIndex);
        setLastSavedTime(existingDraft.timestamp);
        setIsDirty(false);
        setHasInitialized(true);
      }
    } else {
      setShowSetupModal(true);
    }
  }, [isOpen, existingDraft]);

  // Save draft handler
  const handleSaveDraft = useCallback(async () => {
    if (!onDraftSaved) return;

    setIsSaving(true);

    const dataIdentifier = adapter.getDataIdentifier?.() || 'print-draft';

    const draft: PrintDraft = {
      id: `draft-${dataIdentifier}-${Date.now()}`,
      timestamp: existingDraft?.timestamp || Date.now(),
      lastModified: Date.now(),
      documentTitle: documentTitle || 'Untitled Document',
      budgetYear: 0, // Generic - can be overridden by adapter if needed
      budgetParticular: undefined,
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
        items: adapter.toPrintableData().items as any,
        totals: (adapter.toPrintableData().totals || {}) as unknown as BudgetTotals,
        columns: adapter.getColumnDefinitions().map(col => ({
          key: col.key,
          label: col.label,
          align: col.align,
          sortable: col.sortable,
          filterable: col.filterable,
        })),
      },
    };

    try {
      const result = onDraftSaved(draft) as any;
      if (result && typeof result.then === 'function') {
        await result;
      }

      setLastSavedTime(Date.now());
      setIsDirty(false);

      toast.success('Draft Saved', {
        description: 'Your changes have been safely stored.',
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
  }, [adapter, pages, header, footer, currentPageIndex, hiddenColumns, filterState, onDraftSaved, existingDraft, documentTitle]);

  // ðŸ†• Handler to add pasted image to canvas
  const handleAddImage = useCallback((
    element: ImageElement,
    section: 'header' | 'page' | 'footer'
  ) => {
    setIsDirty(true);

    if (section === 'header') {
      setHeader(prev => ({
        ...prev,
        elements: [...prev.elements, element],
      }));
    } else if (section === 'footer') {
      setFooter(prev => ({
        ...prev,
        elements: [...prev.elements, element],
      }));
    } else {
      // Add to current page
      setPages(prev => prev.map((page, idx) =>
        idx === currentPageIndex
          ? { ...page, elements: [...page.elements, element] }
          : page
      ));
    }

    // Select the newly added image
    setSelectedElementId(element.id);
  }, [currentPageIndex]);

  // ðŸ†• Integrate clipboard hook for image paste support
  const currentPage = pages[currentPageIndex] || { id: 'empty', size: 'A4', elements: [] };
  const pageSize = getPageDimensions(currentPage.size, currentPage.orientation);

  usePrintClipboard({
    isOpen,
    currentPage,
    selectedElementId,
    isEditingElementId,
    onAddImage: handleAddImage,
    activeSection,
    pageSize,
  });

  // Print handler (used by canvas toolbar)
  const handlePrint = useCallback(() => {
    try {
      printAllPages(pages, header, footer);
    } catch (error) {
      console.error('Failed to print:', error);
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

  // Canvas handlers
  const updateElement = useCallback((id: string, updates: any) => {
    const isInHeader = header.elements.some(el => el.id === id);
    if (isInHeader) {
      setHeader(prev => ({
        ...prev,
        elements: prev.elements.map(el => el.id === id ? { ...el, ...updates } : el)
      }));
      setIsDirty(true);
      return;
    }

    const isInFooter = footer.elements.some(el => el.id === id);
    if (isInFooter) {
      setFooter(prev => ({
        ...prev,
        elements: prev.elements.map(el => el.id === id ? { ...el, ...updates } : el)
      }));
      setIsDirty(true);
      return;
    }

    setPages(prev => prev.map((page, idx) =>
      idx === currentPageIndex
        ? { ...page, elements: page.elements.map(el => el.id === id ? { ...el, ...updates } : el) }
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

  // Element operations
  const changePageSize = useCallback((size: 'A4' | 'Short' | 'Long') => {
    setPages(prev => prev.map(page => ({ ...page, size })));
    setIsDirty(true);
  }, []);

  const changeOrientation = useCallback((orientation: 'portrait' | 'landscape') => {
    setPages(prev => prev.map(page => ({ ...page, orientation })));
    setIsDirty(true);
  }, []);

  // Format last saved time
  const formattedLastSaved = lastSavedTime
    ? formatTimestamp(lastSavedTime)
    : '';

  // Handle document title change
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setDocumentTitle(newTitle);
      setIsDirty(true);
    },
    []
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 flex flex-col">
        {/* Toolbar */}
        <PrintPreviewToolbar
          documentTitle={documentTitle}
          onTitleChange={handleTitleChange}
          isDirty={isDirty}
          isSaving={isSaving}
          lastSavedTime={formattedLastSaved}
          onBack={handleClose}
          onClose={handleClose}
          onSaveDraft={handleSaveDraft}
          isEditorMode={isEditorMode}
          onEditorModeChange={setIsEditorMode}
          rulerVisible={rulerState.visible}
          onToggleRuler={toggleRulerVisibility}
          marginGuidesVisible={rulerState.showMarginGuides}
          onToggleMarginGuides={toggleMarginGuides}
          pageOrientation={currentPage.orientation}
          pageSize={currentPage.size}
          currentMargin={rulerState.margins.left}
          onMarginChange={setUniformMargins}
        />

        {/* Inner Editor Toolbar */}
        <div className="z-20 bg-stone-100 border-b border-stone-300 shadow-sm no-print">
          <Toolbar
            selectedElement={currentPage.elements.find(el => el.id === selectedElementId)}
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
            onHeaderBackgroundChange={(color) => setHeader(prev => ({ ...prev, backgroundColor: color }))}
            onFooterBackgroundChange={(color) => setFooter(prev => ({ ...prev, backgroundColor: color }))}
            onPageBackgroundChange={(color) => setPages(prev => prev.map((p, i) => i === currentPageIndex ? { ...p, backgroundColor: color } : p))}
            pages={pages}
            header={header}
            footer={footer}
            isEditorMode={isEditorMode}
            rulerVisible={rulerState.visible}
            onToggleRuler={toggleRulerVisibility}
            marginGuidesVisible={rulerState.showMarginGuides}
            onToggleMarginGuides={toggleMarginGuides}
            currentMargin={rulerState.margins.left}
            onMarginChange={setUniformMargins}
          />
        </div>

        {/* Rulers UI Block */}
        {rulerState.visible && (
          <div className="sticky top-0 z-30 bg-stone-200 border-b border-stone-300 flex no-print">
            {rulerState.showVertical && (
              <div className="flex-shrink-0 bg-stone-200 border-r border-stone-300" style={{ width: RULER_WIDTH, height: RULER_HEIGHT }} />
            )}
            <div className="flex-shrink-0 bg-stone-200 border-r border-stone-300 transition-all duration-300" style={{ width: isPanelCollapsed ? 48 : 280, height: RULER_HEIGHT }} />
            <div ref={canvasContainerRef} className="flex-1 overflow-hidden flex justify-start" style={{ height: RULER_HEIGHT }}>
              <div style={{ marginLeft: Math.max(0, canvasOffsetLeft), transform: `translateX(${-scrollLeft}px)` }}>
                <HorizontalRuler
                  width={getPageDimensions(currentPage.size, currentPage.orientation).width}
                  rulerState={rulerState}
                  onMarginChange={updateMargin}
                  onIndentChange={updateIndent}
                  onTabStopAdd={addTabStop}
                  onTabStopUpdate={updateTabStop}
                  onTabStopRemove={removeTabStop}
                  scrollLeft={0}
                />
              </div>
            </div>
            <div className="w-64 flex-shrink-0 bg-stone-200 border-l border-stone-300" style={{ height: RULER_HEIGHT }} />
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {rulerState.visible && rulerState.showVertical && (
            <div className="flex-shrink-0 bg-stone-100 border-r border-stone-300 overflow-hidden" style={{ width: RULER_WIDTH }}>
              <div style={{ transform: `translateY(${-scrollTop}px)`, marginTop: 0 }}>
                <VerticalRuler height={getPageDimensions(currentPage.size, currentPage.orientation).height} rulerState={rulerState} onMarginChange={updateMargin} scrollTop={0} showHeaderFooter={true} />
              </div>
            </div>
          )}

          {/* Column Visibility Panel */}
          <ColumnVisibilityPanel
            tables={tables}
            hiddenColumns={hiddenCanvasColumns}
            hiddenColumnsVersion={hiddenColumnsVersion}
            columnWidths={columnWidths}
            tableDimensions={tableDimensions}
            onToggleColumn={handleToggleCanvasColumn}
            onShowAll={handleShowAllColumns}
            onHideAll={handleHideAllColumns}
            onRenameColumn={handleRenameColumn}
            isCollapsed={isPanelCollapsed}
            onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
          />

          <div className="flex-1 flex flex-col overflow-hidden bg-stone-50 min-w-0">
            <div ref={canvasScrollRef} className="flex-1 overflow-y-auto overflow-x-auto flex items-start justify-center pt-4 pb-16 px-8" onScroll={(e) => { const target = e.target as HTMLDivElement; setScrollLeft(target.scrollLeft); setScrollTop(target.scrollTop); }}>
              <Canvas
                page={{ ...currentPage, elements: visibleElements }}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={updateElement}
                onDeleteElement={deleteElement}
                header={header}
                footer={footer}
                pageNumber={currentPageIndex + 1}
                totalPages={pages.length}
                activeSection={activeSection}
                onActiveSectionChange={setActiveSection}
                isEditorMode={isEditorMode}
                onSetDirty={setIsDirty}
                showMarginGuides={rulerState.showMarginGuides}
                margins={rulerState.margins}
              />
            </div>

            <div className="border-t border-stone-200 bg-white flex-shrink-0">
              <BottomPageControls
                currentPageIndex={currentPageIndex}
                totalPages={pages.length}
                onAddPage={() => { }}
                onDuplicatePage={() => { }}
                onDeletePage={() => { }}
                elements={[]} // Add relevant elements if needed
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateElement={updateElement}
                onReorderElements={() => { }}
                onPreviousPage={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                onNextPage={() => setCurrentPageIndex(prev => Math.min(pages.length - 1, prev + 1))}
                isEditorMode={isEditorMode}
              />
            </div>
          </div>

          {/* Page Panel (right side) */}
          <div className="w-64 border-l border-stone-200 bg-zinc-50 flex-shrink-0 overflow-y-auto">
            <PagePanel
              pages={pages}
              currentPageIndex={currentPageIndex}
              onPageSelect={setCurrentPageIndex}
              onAddPage={() => { }}
              onDuplicatePage={() => { }}
              onDeletePage={() => { }}
              onReorderPages={() => { }}
              header={header}
              footer={footer}
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
        onCancel={() => {
          setShowCloseConfirm(false);
          onClose();
        }}
        variant="default"
      />

      {showSetupModal && (
        <TemplateSelector
          isOpen={true}
          onClose={handleClose}
          onComplete={handleSetupComplete}
        />
      )}

      {showTemplateApplicationModal && (
        <TemplateApplicationModal
          isOpen={true}
          onClose={() => {
            setShowTemplateApplicationModal(false);
            handleSkipTemplate();
          }}
          onProceed={handleApplySavedTemplate}
          template={savedTemplate}
        />
      )}
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