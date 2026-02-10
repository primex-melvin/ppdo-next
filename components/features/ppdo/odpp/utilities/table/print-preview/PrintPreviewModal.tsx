// components/ppdo/table/print-preview/PrintPreviewModal.tsx

'use client';

import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { PrintPreviewToolbar } from './PrintPreviewToolbar';
import { ConfirmationModal } from "@/components/features/ppdo/odpp/table-pages/11_project_plan";
import { TemplateSelector } from './TemplateSelector';
import { TemplateApplicationModal } from './TemplateApplicationModal';
import { ColumnVisibilityPanel } from './ColumnVisibilityPanel';
import { TextAlign } from './JustifyDropdown';
import { PrintDraft, ColumnDefinition, BudgetTotals, RowMarker } from '@/lib/print-canvas/types';
import { BudgetItem } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/types";
import { CanvasTemplate } from '@/app/(extra)/canvas/_components/editor/types/template';

// Canvas components
import Toolbar from '@/app/(extra)/canvas/_components/editor/toolbar';
import Canvas from '@/app/(extra)/canvas/_components/editor/canvas';
import PagePanel from '@/app/(extra)/canvas/_components/editor/page-panel';
import BottomPageControls from '@/app/(extra)/canvas/_components/editor/bottom-page-controls';
import { HorizontalRuler, VerticalRuler } from '@/app/(extra)/canvas/_components/editor/ruler';
import { useRulerState } from '@/app/(extra)/canvas/_components/editor/hooks/useRulerState';
import { getPageDimensions, RULER_WIDTH, RULER_HEIGHT, POINTS_PER_INCH } from '@/app/(extra)/canvas/_components/editor/constants';
// Custom hooks
import { usePrintPreviewState } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/hooks";
import { usePrintPreviewActions } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/hooks";
import { usePrintPreviewDraft } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/hooks";
import { convertTableToCanvas } from '@/lib/print-canvas/tableToCanvas';
import { mergeTemplateWithCanvas } from '@/lib/canvas-utils/mergeTemplate';
import { toast } from 'sonner';

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
  // State management
  const state = usePrintPreviewState();
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
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [showTemplateApplicationModal, setShowTemplateApplicationModal] = useState(false);
  const [savedTemplate, setSavedTemplate] = useState<CanvasTemplate | null>(null);

  // --- Setup State ---
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showLiveTemplateSelector, setShowLiveTemplateSelector] = useState(false);

  // --- Column Visibility State ---
  const [hiddenCanvasColumns, setHiddenCanvasColumns] = useState<Set<string>>(new Set());
  // Version counter to force React re-renders when Set changes (React doesn't detect Set mutations)
  const [hiddenColumnsVersion, setHiddenColumnsVersion] = useState(0);

  // --- Text Alignment State ---
  const [textAlign, setTextAlign] = useState<TextAlign>('left');

  // --- Column Label Overrides (for inline renaming) ---
  const [columnLabelOverrides, setColumnLabelOverrides] = useState<Map<string, string>>(new Map());
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('printPreview.panelCollapsed') === 'true';
    }
    return false;
  });

  // Track initialization to prevent re-triggering
  const initializationStartedRef = useRef(false);

  // Calculate canvas offset for ruler positioning using ResizeObserver
  // This automatically handles: window resize, sidebar collapse/expand transitions, page size changes
  useEffect(() => {
    const scrollEl = canvasScrollRef.current;
    if (!scrollEl) return;

    const recalcOffset = () => {
      const pageDimensions = getPageDimensions(state.currentPage.size, state.currentPage.orientation);
      const containerWidth = scrollEl.clientWidth;
      const canvasWidth = pageDimensions.width;
      const padding = 32; // px-8 padding
      setCanvasOffsetLeft(Math.max(padding, (containerWidth - canvasWidth) / 2));
    };

    // Initial calculation
    recalcOffset();

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(recalcOffset);
    });
    observer.observe(scrollEl);

    return () => observer.disconnect();
  }, [state.currentPage.size, state.currentPage.orientation]);

  // Persist panel state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('printPreview.panelCollapsed', isPanelCollapsed.toString());
    }
  }, [isPanelCollapsed]);

  // Prepare table data for ColumnVisibilityPanel (with label overrides)
  const tables = useMemo(() => [{
    tableId: 'main-table',
    tableName: 'Budget Table',
    columns: columns.map(col => ({
      key: col.key,
      label: columnLabelOverrides.get(col.key) || col.label,
      required: col.key === 'particular'
    }))
  }], [columns, columnLabelOverrides]);

  // Helper: Extract column key from any table element ID
  const extractColumnKey = useCallback((id: string): string | null => {
    if (id.startsWith('category-')) return null;
    const patterns = [
      /cell-\w+-(\w+)-/, /header-(\w+)-/, /total-(\w+)-/,
      /cell-\w+-(\w+)$/, /header-(\w+)$/, /total-(\w+)$/,
    ];
    for (const pattern of patterns) {
      const match = id.match(pattern);
      if (match) return match[1];
    }
    return null;
  }, []);

  // Helper: Transform a page's elements with column hiding, margin repositioning, textAlign
  const transformPageElements = useCallback((elements: import('@/app/(extra)/canvas/_components/editor/types').CanvasElement[], pageSizeStr: string, orientation: string) => {
    const tableElements = elements.filter(
      el => el.groupId && el.groupName?.toLowerCase().includes('table')
    );
    if (tableElements.length === 0) return elements;

    const columnInfo = new Map<string, { key: string; originalX: number; originalWidth: number }>();
    tableElements.forEach(el => {
      const columnKey = extractColumnKey(el.id);
      if (columnKey && !columnInfo.has(columnKey)) {
        columnInfo.set(columnKey, { key: columnKey, originalX: el.x, originalWidth: el.width });
      }
    });

    const allColumns = Array.from(columnInfo.entries()).sort((a, b) => a[1].originalX - b[1].originalX);
    const visibleColumns = allColumns.filter(([key]) => !hiddenCanvasColumns.has(`main-table.${key}`));
    const hiddenColumnsSet = new Set(allColumns.filter(([key]) => hiddenCanvasColumns.has(`main-table.${key}`)).map(([key]) => key));

    if (visibleColumns.length === 0) return elements;

    const marginLeft = rulerState.margins.left;
    const marginRight = rulerState.margins.right;
    const PAGE_SIZES = { A4: { width: 595, height: 842 }, Short: { width: 612, height: 792 }, Long: { width: 612, height: 936 } };
    const baseSize = PAGE_SIZES[pageSizeStr as keyof typeof PAGE_SIZES] || PAGE_SIZES.A4;
    const size = orientation === 'landscape' ? { width: baseSize.height, height: baseSize.width } : baseSize;
    const totalAvailableWidth = size.width - marginLeft - marginRight;
    const firstColumnX = marginLeft;
    const oldLeftEdge = allColumns[0][1].originalX;
    const totalVisibleOriginalWidth = visibleColumns.reduce((sum, [, info]) => sum + info.originalWidth, 0);
    const scaleX = totalVisibleOriginalWidth > 0 ? totalAvailableWidth / totalVisibleOriginalWidth : 1;
    const newColumnLayout = new Map<string, { x: number; width: number }>();
    let currentX = firstColumnX;
    visibleColumns.forEach(([key, info]) => {
      const widthRatio = info.originalWidth / totalVisibleOriginalWidth;
      newColumnLayout.set(key, { x: currentX, width: totalAvailableWidth * widthRatio });
      currentX += totalAvailableWidth * widthRatio;
    });

    return elements.map(el => {
      if (!el.groupId || !el.groupName?.toLowerCase().includes('table')) return el;
      const columnKey = extractColumnKey(el.id);
      if (!columnKey) {
        return { ...el, x: marginLeft + (el.x - oldLeftEdge) * scaleX, width: el.width * scaleX };
      }
      if (hiddenColumnsSet.has(columnKey)) return { ...el, visible: false };
      const newLayout = newColumnLayout.get(columnKey);
      if (newLayout) {
        return {
          ...el, x: newLayout.x, width: newLayout.width, visible: true,
          ...(textAlign !== 'left' && el.type === 'text' ? { textAlign } : {}),
        };
      }
      return el.type === 'text' && textAlign !== 'left' ? { ...el, textAlign } : el;
    });
  }, [extractColumnKey, hiddenCanvasColumns, rulerState.margins, textAlign]);

  // Filter and redistribute canvas elements based on hidden columns and margins (current page only - for preview)
  const visibleElements = useMemo(() => {
    return transformPageElements(state.currentPage.elements, state.currentPage.size || 'A4', state.currentPage.orientation || 'portrait');
  }, [state.currentPage.elements, state.currentPage.size, state.currentPage.orientation, transformPageElements]);

  // Processed pages: apply the same transformations to ALL pages (for PDF export WYSIWYG)
  const processedPages = useMemo(() => {
    return state.pages.map(page => ({
      ...page,
      elements: transformPageElements(page.elements, page.size || 'A4', page.orientation || 'portrait'),
    }));
  }, [state.pages, transformPageElements]);

  // Calculate column widths and table dimensions from visible elements
  const { columnWidths, tableDimensions } = useMemo(() => {
    const tableElements = visibleElements.filter(
      el => el.groupId && el.groupName?.toLowerCase().includes('table') && el.visible !== false
    );

    if (tableElements.length === 0) {
      return { columnWidths: new Map<string, number>(), tableDimensions: undefined };
    }

    // Extract column key from element ID
    const extractColumnKey = (id: string): string | null => {
      // Category headers span the full table width — they are NOT column-specific
      if (id.startsWith('category-')) return null;

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

    // Build column widths map
    const widthsMap = new Map<string, number>();
    tableElements.forEach(el => {
      const colKey = extractColumnKey(el.id);
      if (colKey && !widthsMap.has(colKey)) {
        widthsMap.set(colKey, el.width);
      }
    });

    // Calculate table bounds
    const minX = Math.min(...tableElements.map(el => el.x));
    const minY = Math.min(...tableElements.map(el => el.y));
    const maxX = Math.max(...tableElements.map(el => el.x + el.width));
    const maxY = Math.max(...tableElements.map(el => el.y + el.height));

    return {
      columnWidths: widthsMap,
      tableDimensions: {
        width: maxX - minX,
        height: maxY - minY
      }
    };
  }, [visibleElements]);

  // Column visibility handlers
  const handleToggleCanvasColumn = useCallback((tableId: string, columnKey: string) => {
    setHiddenCanvasColumns(prev => {
      const next = new Set(prev);
      const fullKey = `${tableId}.${columnKey}`;

      if (next.has(fullKey)) {
        next.delete(fullKey);
      } else {
        next.add(fullKey);
      }

      return next;
    });
    setHiddenColumnsVersion(v => v + 1); // Force re-render for counter update
    state.setIsDirty(true);
  }, [state]);

  const handleShowAllColumns = useCallback((tableId: string) => {
    setHiddenCanvasColumns(prev => {
      const next = new Set(prev);
      const table = tables.find(t => t.tableId === tableId);

      if (table) {
        table.columns.forEach(col => {
          if (!col.required) {
            next.delete(`${tableId}.${col.key}`);
          }
        });
      }

      return next;
    });
    setHiddenColumnsVersion(v => v + 1); // Force re-render for counter update
    state.setIsDirty(true);
  }, [tables, state]);

  const handleHideAllColumns = useCallback((tableId: string) => {
    setHiddenCanvasColumns(prev => {
      const next = new Set(prev);
      const table = tables.find(t => t.tableId === tableId);

      if (table) {
        table.columns.forEach(col => {
          if (!col.required) {
            next.add(`${tableId}.${col.key}`);
          }
        });
      }

      return next;
    });
    setHiddenColumnsVersion(v => v + 1); // Force re-render for counter update
    state.setIsDirty(true);
  }, [tables, state]);

  // Handle column rename (inline editing)
  const handleRenameColumn = useCallback((tableId: string, columnKey: string, newLabel: string) => {
    // Update the label overrides map
    setColumnLabelOverrides(prev => {
      const next = new Map(prev);
      next.set(columnKey, newLabel);
      return next;
    });

    // Update canvas elements - find header elements that match this column and update their text
    state.setPages(prevPages =>
      prevPages.map(page => ({
        ...page,
        elements: page.elements.map(el => {
          // Check if this is a header element for this column
          // Pattern: header-{columnKey}-xxx
          if (el.type === 'text' && el.id.startsWith(`header-${columnKey}-`)) {
            return { ...el, text: newLabel };
          }
          return el;
        })
      }))
    );

    state.setIsDirty(true);
  }, [state]);

  // Initialize from table data with template and orientation
  const initializeFromTableData = useCallback(
    (template?: CanvasTemplate | null, orientation: 'portrait' | 'landscape' = 'portrait', includeCoverPage: boolean = true) => {
      console.group('ðŸŽ¨ INITIALIZING PRINT PREVIEW');
      console.log('Template:', template?.name || 'none');
      console.log('Orientation:', orientation);
      console.log('Include Cover Page:', includeCoverPage);

      try {
        const result = convertTableToCanvas({
          items: budgetItems,
          totals,
          columns,
          hiddenColumns,
          pageSize: template?.page.size || 'A4',
          orientation: orientation,
          includeHeaders: true,
          includeTotals: true,
          title: includeCoverPage ? `Budget Tracking ${year}` : undefined,
          subtitle: includeCoverPage && particular ? `Particular: ${particular}` : undefined,
          rowMarkers,
          margin: rulerState.margins.left,
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

          state.setAppliedTemplate(template);
          toast.success(`Applied template "${template.name}" to ${finalPages.length} page(s)`);
        } else {
          toast.success(`Generated ${result.metadata.totalPages} page(s) in ${orientation} orientation`);
        }

        state.setPages(finalPages);
        state.setHeader(finalHeader);
        state.setFooter(finalFooter);
        state.setCurrentPageIndex(0);
        state.setIsDirty(false);
        state.setHasInitialized(true);

        console.log('âœ… Initialization complete');
        console.groupEnd();
      } catch (error) {
        console.error('âŒ Failed to convert table to canvas:', error);
        console.groupEnd();
        toast.error('Failed to convert table to canvas');
      }
    },
    [budgetItems, totals, columns, hiddenColumns, year, particular, rowMarkers, state]
  );

  // âœ… Handler: Called when user finishes the Setup Wizard
  const handleSetupComplete = useCallback((result: { template: CanvasTemplate | null, orientation: 'portrait' | 'landscape', includeCoverPage: boolean }) => {
    console.log('ðŸŽ¯ Setup complete, closing modal and initializing...');
    setShowSetupModal(false);

    // Defer slightly to allow modal unmount animation to start cleanly
    setTimeout(() => {
      initializeFromTableData(result.template, result.orientation, result.includeCoverPage);
    }, 100);
  }, [initializeFromTableData]);

  const handleApplySavedTemplate = useCallback(() => {
    if (!savedTemplate) return;
    console.log('ðŸ“‹ Applying saved template from existing draft...');
    setIsLoadingTemplate(true);
    setShowTemplateApplicationModal(false);

    setTimeout(() => {
      initializeFromTableData(savedTemplate, savedTemplate.page.orientation);
      if (existingDraft) state.setLastSavedTime(existingDraft.timestamp);
      setIsLoadingTemplate(false);
      setSavedTemplate(null);
    }, 500);
  }, [savedTemplate, initializeFromTableData, existingDraft, state]);

  const handleSkipTemplate = useCallback(() => {
    if (!existingDraft) return;
    console.log('â­ï¸ Skipping template application, loading existing draft as-is...');
    setShowTemplateApplicationModal(false);

    state.setPages(existingDraft.canvasState.pages);
    state.setHeader(existingDraft.canvasState.header);
    state.setFooter(existingDraft.canvasState.footer);
    state.setCurrentPageIndex(existingDraft.canvasState.currentPageIndex);
    state.setLastSavedTime(existingDraft.timestamp);
    if (existingDraft.appliedTemplate) state.setAppliedTemplate(existingDraft.appliedTemplate);
    state.setIsDirty(false);
    state.setHasInitialized(true);
    setSavedTemplate(null);
  }, [existingDraft, state]);

  // Handle applying template to live canvas (from toolbar button)
  const handleApplyLiveTemplate = useCallback(
    (result: { template: CanvasTemplate | null }) => {
      const template = result.template;
      if (!template) return;

      const merged = mergeTemplateWithCanvas(
        state.pages,
        state.header,
        state.footer,
        template
      );

      state.setPages(merged.pages);
      state.setHeader(merged.header);
      state.setFooter(merged.footer);
      state.setAppliedTemplate(template);
      state.setIsDirty(true);
      toast.success(`Applied template "${template.name}" to canvas`);
      setShowLiveTemplateSelector(false);
    },
    [state]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        toggleRulerVisibility();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, toggleRulerVisibility]);

  // Main Initialization Logic
  useEffect(() => {
    // NOTE: Temporarily disabled to reduce console noise during search debug
    // console.log('ðŸ”„ Main initialization effect triggered', {
    //   isOpen,
    //   hasInitialized: state.hasInitialized,
    //   initializationStarted: initializationStartedRef.current,
    //   existingDraft: !!existingDraft,
    // });

    // Reset when modal closes
    if (!isOpen) {
      // NOTE: Temporarily disabled to reduce console noise during search debug
      // console.log('ðŸšª Modal closed, resetting all state...');
      state.setHasInitialized(false);
      state.setDocumentTitle('');
      setSavedTemplate(null);
      setShowTemplateApplicationModal(false);
      setShowLiveTemplateSelector(false);
      setShowSetupModal(false);
      initializationStartedRef.current = false;
      setHiddenCanvasColumns(new Set());
      setHiddenColumnsVersion(0);
      setColumnLabelOverrides(new Map());
      return;
    }

    // Prevent re-initialization if already started or completed
    if (state.hasInitialized || initializationStartedRef.current) {
      // NOTE: Temporarily disabled to reduce console noise during search debug
      // console.log('â¸ï¸ Initialization already started or completed, skipping...');
      return;
    }

    // Mark initialization as started
    initializationStartedRef.current = true;

    // Case 1: Existing draft with template
    if (existingDraft) {
      // NOTE: Temporarily disabled to reduce console noise during search debug
      // console.log('ðŸ“¦ Existing draft detected');
      const draftTitle = existingDraft.documentTitle || (particular ? `Budget ${year} - ${particular}` : `Budget ${year}`);
      state.setDocumentTitle(draftTitle);

      if (existingDraft.appliedTemplate) {
        // NOTE: Temporarily disabled to reduce console noise during search debug
        // console.log('ðŸŽ¨ Existing draft has template, showing template application modal...');
        setSavedTemplate(existingDraft.appliedTemplate);
        setShowTemplateApplicationModal(true);
        // Don't set hasInitialized yet - wait for user choice
        return;
      }

      // No template in draft, load as-is
      // NOTE: Temporarily disabled to reduce console noise during search debug
      // console.log('ðŸ“„ Loading existing draft without template...');
      state.setPages(existingDraft.canvasState.pages);
      state.setHeader(existingDraft.canvasState.header);
      state.setFooter(existingDraft.canvasState.footer);
      state.setCurrentPageIndex(existingDraft.canvasState.currentPageIndex);
      state.setLastSavedTime(existingDraft.timestamp);
      state.setIsDirty(false);
      state.setHasInitialized(true);
      return;
    }

    // Case 2: No existing draft - show setup wizard
    // NOTE: Temporarily disabled to reduce console noise during search debug
    // console.log('ðŸ†• New draft, showing setup wizard...');
    const defaultTitle = particular ? `Budget ${year} - ${particular}` : `Budget ${year}`;
    state.setDocumentTitle(defaultTitle);
    setShowSetupModal(true);
    // Don't set hasInitialized yet - wait for wizard completion
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, existingDraft, particular, year]);

  const actions = usePrintPreviewActions({
    currentPageIndex: state.currentPageIndex,
    setCurrentPageIndex: state.setCurrentPageIndex,
    header: state.header,
    footer: state.footer,
    setPages: state.setPages,
    setHeader: state.setHeader,
    setFooter: state.setFooter,
    setSelectedElementId: state.setSelectedElementId,
    setIsDirty: state.setIsDirty,
  });

  const { handleSaveDraft, handlePrint, handleClose } = usePrintPreviewDraft({
    documentTitle: state.documentTitle,
    pages: state.pages,
    header: state.header,
    footer: state.footer,
    currentPageIndex: state.currentPageIndex,
    budgetItems,
    totals,
    columns,
    hiddenColumns,
    filterState,
    year,
    particular,
    existingDraft,
    onDraftSaved,
    isDirty: state.isDirty,
    setIsDirty: state.setIsDirty,
    setIsSaving: state.setIsSaving,
    setLastSavedTime: state.setLastSavedTime,
    setShowCloseConfirm: state.setShowCloseConfirm,
    onClose,
    appliedTemplate: state.appliedTemplate,
  });

  const formattedLastSaved = state.lastSavedTime ? formatTimestamp(state.lastSavedTime) : '';
  const handleTitleChange = useCallback((newTitle: string) => { state.setDocumentTitle(newTitle); state.setIsDirty(true); }, [state]);

  // Margin conversion: internal state is pixels, dropdown operates in inches
  const currentMarginInches = rulerState.margins.left / POINTS_PER_INCH;
  const handleMarginChangeInches = useCallback((inches: number) => {
    setUniformMargins(inches * POINTS_PER_INCH);
  }, [setUniformMargins]);

  if (!isOpen) return null;

  if (isLoadingTemplate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-zinc-900">
        <div className="text-center">
          <p className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">Applying Template...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 flex flex-col">
        <PrintPreviewToolbar
          documentTitle={state.documentTitle}
          onTitleChange={handleTitleChange}
          isDirty={state.isDirty}
          isSaving={state.isSaving}
          lastSavedTime={formattedLastSaved}
          onBack={handleClose}
          onClose={handleClose}
          onSaveDraft={handleSaveDraft}
          onApplyTemplate={() => setShowLiveTemplateSelector(true)}
          isEditorMode={isEditorMode}
          onEditorModeChange={setIsEditorMode}
          rulerVisible={rulerState.visible}
          onToggleRuler={toggleRulerVisibility}
          marginGuidesVisible={rulerState.showMarginGuides}
          onToggleMarginGuides={toggleMarginGuides}
          pageOrientation={state.currentPage.orientation}
          pageSize={state.currentPage.size}
          currentMargin={currentMarginInches}
          onMarginChange={handleMarginChangeInches}
          textAlign={textAlign}
          onTextAlignChange={setTextAlign}
        />

        {/* Inner Editor Toolbar (moved up for alignment) */}
        <div className="z-20 bg-stone-100 dark:bg-zinc-800 border-b border-stone-300 dark:border-zinc-700 shadow-sm no-print">
          <Toolbar
            selectedElement={state.selectedElement}
            onUpdateElement={state.selectedElementId ? (updates) => actions.updateElement(state.selectedElementId!, updates) : undefined}
            onAddText={() => { }}
            pageSize={state.currentPage.size}
            orientation={state.currentPage.orientation}
            onPageSizeChange={actions.changePageSize}
            onOrientationChange={actions.changeOrientation}
            onPrint={handlePrint}
            activeSection={state.activeSection}
            headerBackgroundColor={state.header.backgroundColor || '#ffffff'}
            footerBackgroundColor={state.footer.backgroundColor || '#ffffff'}
            pageBackgroundColor={state.currentPage.backgroundColor || '#ffffff'}
            onHeaderBackgroundChange={actions.updateHeaderBackground}
            onFooterBackgroundChange={actions.updateFooterBackground}
            onPageBackgroundChange={actions.updatePageBackground}
            pages={processedPages}
            header={state.header}
            footer={state.footer}
            documentTitle={state.documentTitle}
            isEditorMode={isEditorMode}
            rulerVisible={rulerState.visible}
            onToggleRuler={toggleRulerVisibility}
            marginGuidesVisible={rulerState.showMarginGuides}
            onToggleMarginGuides={toggleMarginGuides}
            currentMargin={currentMarginInches}
            onMarginChange={handleMarginChangeInches}
          />
        </div>

        {/* Rulers UI Block */}
        {rulerState.visible && (
          <div className="sticky top-0 z-30 bg-stone-200 dark:bg-zinc-900 border-b border-stone-300 dark:border-zinc-700 flex no-print">
            {/* Space for Vertical Ruler */}
            {rulerState.showVertical && (
              <div
                className="flex-shrink-0 bg-stone-200 dark:bg-zinc-900 border-r border-stone-300 dark:border-zinc-700"
                style={{ width: RULER_WIDTH, height: RULER_HEIGHT }}
              />
            )}

            {/* Space for Left Sidebar (ColumnVisibilityPanel) */}
            <div
              className="flex-shrink-0 bg-stone-200 dark:bg-zinc-900 border-r border-stone-300 dark:border-zinc-700 transition-all duration-300"
              style={{ width: isPanelCollapsed ? 48 : 280, height: RULER_HEIGHT }}
            />

            {/* Horizontal Ruler - centered with canvas */}
            <div
              ref={canvasContainerRef}
              className="flex-1 overflow-hidden flex justify-start"
              style={{ height: RULER_HEIGHT }}
            >
              <div
                style={{
                  marginLeft: Math.max(0, canvasOffsetLeft),
                  transform: `translateX(${-scrollLeft}px)`,
                }}
              >
                <HorizontalRuler
                  width={getPageDimensions(state.currentPage.size, state.currentPage.orientation).width}
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

            {/* Space for Right Sidebar (PagePanel) */}
            <div className="w-64 flex-shrink-0 bg-stone-200 dark:bg-zinc-900 border-l border-stone-300 dark:border-zinc-700" style={{ height: RULER_HEIGHT }} />
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {rulerState.visible && rulerState.showVertical && (
            <div className="flex-shrink-0 bg-stone-100 dark:bg-zinc-800 border-r border-stone-300 dark:border-zinc-700 overflow-hidden" style={{ width: RULER_WIDTH }}>
              <div style={{ transform: `translateY(${-scrollTop}px)`, marginTop: 0 }}>
                <VerticalRuler height={getPageDimensions(state.currentPage.size, state.currentPage.orientation).height} rulerState={rulerState} onMarginChange={updateMargin} scrollTop={0} showHeaderFooter={true} />
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

          <div className="flex-1 flex flex-col overflow-hidden bg-stone-50 dark:bg-zinc-950 min-w-0">
            {/* Canvas Area */}

            <div ref={canvasScrollRef} className="flex-1 overflow-y-auto overflow-x-auto flex items-start justify-center pt-4 pb-16 px-8" onScroll={(e) => { const target = e.target as HTMLDivElement; setScrollLeft(target.scrollLeft); setScrollTop(target.scrollTop); }}>
              <Canvas
                page={{ ...state.currentPage, elements: visibleElements }}
                selectedElementId={state.selectedElementId}
                onSelectElement={state.setSelectedElementId}
                onUpdateElement={(id, updates) => actions.updateElement(id, updates)}
                onDeleteElement={actions.deleteElement}
                header={state.header}
                footer={state.footer}
                pageNumber={state.currentPageIndex + 1}
                totalPages={state.pages.length}
                activeSection={state.activeSection}
                onActiveSectionChange={state.setActiveSection}
                isEditorMode={isEditorMode}
                onSetDirty={state.setIsDirty}
                showMarginGuides={rulerState.showMarginGuides}
                margins={rulerState.margins}
              />
            </div>

            <div className="border-t border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex-shrink-0">
              <BottomPageControls
                currentPageIndex={state.currentPageIndex}
                totalPages={state.pages.length}
                onAddPage={actions.addPage}
                onDuplicatePage={() => actions.duplicatePage(state.currentPageIndex)}
                onDeletePage={() => actions.deletePage(state.currentPageIndex)}
                elements={state.allElements}
                selectedElementId={state.selectedElementId}
                onSelectElement={state.setSelectedElementId}
                onUpdateElement={actions.updateElement}
                onReorderElements={actions.reorderElements}
                onPreviousPage={() => state.setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                onNextPage={() => state.setCurrentPageIndex((prev) => Math.min(state.pages.length - 1, prev + 1))}
                isEditorMode={isEditorMode}
                selectedGroupId={state.selectedGroupId}
                onSelectGroup={state.setSelectedGroupId}
              />
            </div>
          </div>

          <div className="w-64 border-l border-stone-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex-shrink-0 overflow-y-auto">
            <PagePanel
              pages={state.pages}
              currentPageIndex={state.currentPageIndex}
              onPageSelect={state.setCurrentPageIndex}
              onAddPage={actions.addPage}
              onDuplicatePage={actions.duplicatePage}
              onDeletePage={actions.deletePage}
              onReorderPages={actions.reorderPages}
              header={state.header}
              footer={state.footer}
            />
          </div>
        </div>
      </div >

      {/* âœ… SETUP WIZARD: Handles both Template + Orientation */}
      {
        showSetupModal && (
          <TemplateSelector
            isOpen={true}
            onClose={handleClose}
            onComplete={handleSetupComplete}
          />
        )
      }

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={state.showCloseConfirm}
        onClose={() => state.setShowCloseConfirm(false)}
        onConfirm={() => { handleSaveDraft(); setTimeout(() => onClose(), 100); }}
        title="Save Print Preview as Draft?"
        message="You have unsaved changes. Save them for later?"
        confirmText="Save & Close"
        cancelText="Discard & Close"
        onCancel={() => {
          state.setShowCloseConfirm(false);
          onClose();
        }}
        variant="default"
      />
      <TemplateApplicationModal isOpen={showTemplateApplicationModal} onClose={() => { setShowTemplateApplicationModal(false); handleSkipTemplate(); }} onProceed={handleApplySavedTemplate} template={savedTemplate} />

      {/* Live Template Selector (Standalone for Toolbar) */}
      {
        showLiveTemplateSelector && (
          <TemplateSelector
            isOpen={true}
            onClose={() => setShowLiveTemplateSelector(false)}
            onComplete={(res) => handleApplyLiveTemplate({ template: res.template })}
          />
        )
      }
    </>
  );
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}