// app/dashboard/project/[year]/components/hooks/usePrintPreviewInitialization.ts (FIXED)

import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { convertTableToCanvas } from '@/lib/print-canvas/tableToCanvas';
import { applyTemplateToPages } from '@/lib/canvas-utils';
import { PrintDraft, ColumnDefinition, BudgetTotals, RowMarker } from '@/lib/print-canvas/types';
import { BudgetItem } from '@/components/features/ppdo/odpp/table-pages/11_project_plan/types';
import { CanvasTemplate } from '@/app/(extra)/canvas/_components/editor/types/template';
import { Page, HeaderFooter } from '@/app/(extra)/canvas/_components/editor/types';

interface UseInitializationProps {
  isOpen: boolean;
  existingDraft?: PrintDraft | null;
  hasInitialized: boolean;
  appliedTemplate: CanvasTemplate | null;
  budgetItems: BudgetItem[];
  totals: BudgetTotals;
  columns: ColumnDefinition[];
  hiddenColumns: Set<string>;
  year: number;
  particular?: string;
  rowMarkers?: RowMarker[];
  setPages: (pages: Page[]) => void;
  setHeader: (header: HeaderFooter) => void;
  setFooter: (footer: HeaderFooter) => void;
  setCurrentPageIndex: (index: number) => void;
  setLastSavedTime: (time: number | null) => void;
  setIsDirty: (dirty: boolean) => void;
  setHasInitialized: (initialized: boolean) => void;
  setShowTemplateSelector: (show: boolean) => void;
  setAppliedTemplate: (template: CanvasTemplate | null) => void;
}

export function usePrintPreviewInitialization({
  isOpen,
  existingDraft,
  hasInitialized,
  appliedTemplate,
  budgetItems,
  totals,
  columns,
  hiddenColumns,
  year,
  particular,
  rowMarkers,
  setPages,
  setHeader,
  setFooter,
  setCurrentPageIndex,
  setLastSavedTime,
  setIsDirty,
  setHasInitialized,
  setShowTemplateSelector,
  setAppliedTemplate,
}: UseInitializationProps) {
  
  const initializeFromTableData = useCallback(
    (template?: CanvasTemplate) => {
      console.group('ðŸŽ¨ INITIALIZING PRINT PREVIEW');
      console.log('Template:', template);
      console.log('Template Page Background:', template?.page?.backgroundColor);
      
      try {
        // Convert table to canvas pages using template's page settings
        const result = convertTableToCanvas({
          items: budgetItems,
          totals,
          columns,
          hiddenColumns,
          pageSize: template?.page.size || 'A4',
          orientation: template?.page.orientation || 'portrait',
          includeHeaders: true,
          includeTotals: true,
          title: `Budget Tracking ${year}`,
          subtitle: particular ? `Particular: ${particular}` : undefined,
          rowMarkers,
        });

        console.log('ðŸ“„ Generated pages:', result.pages.length);
        console.log('ðŸ“„ First page background BEFORE template:', result.pages[0]?.backgroundColor);

        // Apply template if selected
        let finalPages = result.pages;
        let finalHeader = result.header;
        let finalFooter = result.footer;

        if (template) {
          console.log('ðŸŽ¨ Applying template to pages...');
          
          // CRITICAL FIX: Apply template styling to all pages
          finalPages = applyTemplateToPages(result.pages, template);
          
          // CRITICAL FIX: Use template's header and footer
          finalHeader = {
            elements: template.header.elements,
            backgroundColor: template.header.backgroundColor || '#ffffff',
          };
          
          finalFooter = {
            elements: template.footer.elements,
            backgroundColor: template.footer.backgroundColor || '#ffffff',
          };
          
          console.log('âœ… Template applied');
          console.log('ðŸ“„ First page background AFTER template:', finalPages[0]?.backgroundColor);
          console.log('ðŸ“„ Header background:', finalHeader.backgroundColor);
          console.log('ðŸ“„ Footer background:', finalFooter.backgroundColor);
          
          setAppliedTemplate(template);
          
          toast.success(
            `Applied template "${template.name}" to ${finalPages.length} page(s)`
          );
        } else {
          console.log('ðŸ“„ No template - using default styling');
          toast.success(
            `Generated ${result.metadata.totalPages} page(s) from ${result.metadata.totalRows} row(s)`
          );
        }

        // Set final state
        console.log('ðŸ’¾ Setting final state...');
        setPages(finalPages);
        setHeader(finalHeader);
        setFooter(finalFooter);
        setCurrentPageIndex(0);
        setIsDirty(false);
        setHasInitialized(true);
        
        console.log('âœ… Initialization complete');
        console.groupEnd();
      } catch (error) {
        console.error('âŒ Failed to convert table to canvas:', error);
        console.groupEnd();
        toast.error('Failed to convert table to canvas');
      }
    },
    [
      budgetItems,
      totals,
      columns,
      hiddenColumns,
      year,
      particular,
      rowMarkers,
      setPages,
      setHeader,
      setFooter,
      setCurrentPageIndex,
      setIsDirty,
      setHasInitialized,
      setAppliedTemplate,
    ]
  );

  // Initialize canvas from table data or existing draft
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
      return;
    }

    console.log('ðŸ”„ Initialization useEffect triggered');
    console.log('  - isOpen:', isOpen);
    console.log('  - hasInitialized:', hasInitialized);
    console.log('  - existingDraft:', !!existingDraft);
    console.log('  - appliedTemplate:', appliedTemplate?.id);

    // Show template selector on first open (if no existing draft and not initialized)
    if (!existingDraft && !hasInitialized && appliedTemplate === null) {
      console.log('ðŸ“‹ Showing template selector...');
      setShowTemplateSelector(true);
      return;
    }

    // Initialize from existing draft
    if (existingDraft && !hasInitialized) {
      console.log('ðŸ“‚ Loading from existing draft...');
      setPages(existingDraft.canvasState.pages);
      setHeader(existingDraft.canvasState.header);
      setFooter(existingDraft.canvasState.footer);
      setCurrentPageIndex(existingDraft.canvasState.currentPageIndex);
      setLastSavedTime(existingDraft.timestamp);
      setIsDirty(false);
      setHasInitialized(true);
      return;
    }

    // Initialize from table data with template
    // This triggers when:
    // 1. Template is selected (appliedTemplate changes from null to template)
    // 2. User skips template selection (appliedTemplate becomes undefined)
    if (!hasInitialized && appliedTemplate !== null) {
      console.log('ðŸŽ¯ Initializing with template:', appliedTemplate?.name || 'none');
      initializeFromTableData(appliedTemplate || undefined);
    }
  }, [
    isOpen,
    existingDraft,
    appliedTemplate,
    hasInitialized,
    initializeFromTableData,
    setPages,
    setHeader,
    setFooter,
    setCurrentPageIndex,
    setLastSavedTime,
    setIsDirty,
    setHasInitialized,
    setShowTemplateSelector,
  ]);

  return { initializeFromTableData };
}