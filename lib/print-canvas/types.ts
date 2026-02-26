// lib/print-canvas/types.ts

import { Page, HeaderFooter, MarginSettings } from '@/app/(extra)/canvas/_components/editor/types';
import { CanvasTemplate } from '@/app/(extra)/canvas/_components/editor/types/template';
import { BudgetItem } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/types";

/**
 * Column definition for table-to-canvas conversion
 */
export interface ColumnDefinition {
  key: string;
  label: string;
  align: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
}

/**
 * Row marker for category or section headers
 * Indicates where to insert a visual section/category header in the canvas
 */
export interface RowMarker {
  index: number; // Position in items array where header should be inserted visually
  type: 'category' | 'group';
  label: string;
  categoryId?: string;
}

/**
 * Configuration for table-to-canvas conversion
 */
export interface ConversionConfig {
  items: BudgetItem[];
  totals: BudgetTotals;
  columns: ColumnDefinition[];
  hiddenColumns: Set<string>;
  pageSize: 'A4' | 'Short' | 'Long';
  orientation: 'portrait' | 'landscape';
  includeHeaders: boolean;
  includeTotals: boolean;
  title?: string;
  subtitle?: string;
  rowMarkers?: RowMarker[]; // Optional markers for category/group headers
  margin?: number; // Uniform margin in pixels (default: 22px = 0.3")
  margins?: MarginSettings; // Optional per-side margins (preferred when available)
  showHeader?: boolean; // default true
  showFooter?: boolean; // default true
  headerHeight?: number; // override reserved header height for pagination
  footerHeight?: number; // override reserved footer height for pagination
}

/**
 * Budget totals interface
 */
export interface BudgetTotals {
  totalBudgetAllocated: number;
  obligatedBudget: number;
  totalBudgetUtilized: number;
  projectCompleted: number;
  projectDelayed: number;
  projectsOngoing: number;
}

/**
 * Result of table-to-canvas conversion
 */
export interface ConversionResult {
  pages: Page[];
  header: HeaderFooter;
  footer: HeaderFooter;
  metadata: ConversionMetadata;
}

/**
 * Metadata about the conversion
 */
export interface ConversionMetadata {
  totalPages: number;
  totalRows: number;
  createdAt: number;
  pageSize: string;
  orientation: 'portrait' | 'landscape';
  columnCount: number;
}

/**
 * Page metadata for tracking table content
 */
export interface PageMetadata {
  isTablePage: boolean;
  tableRowRange?: { start: number; end: number };
  hasUserEdits: boolean;
  pageType?: 'title' | 'data' | 'totals';
}

/**
 * Print draft storage interface
 */
export interface PrintDraft {
  id: string;
  timestamp: number;
  lastModified?: number; // Track separate modification time (optional for backward compatibility)
  documentTitle?: string; // User-defined document name (optional for backward compatibility)
  budgetYear: number;
  budgetParticular?: string;

  filterState: {
    searchQuery: string;
    statusFilter: string[];
    yearFilter: number[];
    sortField: string | null;
    sortDirection: string | null;
    hiddenColumns: string[];
  };

  canvasState: {
    pages: Page[];
    currentPageIndex: number;
    header: HeaderFooter;
    footer: HeaderFooter;
  };

  tableSnapshot: {
    items: BudgetItem[];
    totals: BudgetTotals;
    columns: ColumnDefinition[];
  };

  // Template that was applied when draft was created
  appliedTemplate?: CanvasTemplate;
}

/**
 * Draft metadata for tracking all drafts
 */
export interface DraftMetadata {
  drafts: DraftInfo[];
}

/**
 * Individual draft info
 */
export interface DraftInfo {
  key: string;
  year: number;
  particular?: string;
  timestamp: number;
  lastModified?: number; // Last modification time (optional for backward compatibility)
  documentTitle?: string; // Document title (optional for backward compatibility)
  pageCount: number;
}

/**
 * Cell position and size
 */
export interface CellBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Table styling configuration
 */
export interface TableStyle {
  headerFontSize: number;
  dataFontSize: number;
  totalsFontSize: number;
  cellPadding: number;
  borderWidth: number;
  headerColor: string;
  dataColor: string;
  totalsColor: string;
  borderColor: string;
  headerBgColor: string;
  totalsBgColor: string;
}

/**
 * Default table styling - Google Docs style (ZERO padding, borders handled separately)
 */
export const DEFAULT_TABLE_STYLE: TableStyle = {
  headerFontSize: 10,
  dataFontSize: 9,
  totalsFontSize: 10,
  cellPadding: 0, // âœ… CHANGED: Zero padding for edge-to-edge cells
  borderWidth: 1,
  headerColor: '#18181b',
  dataColor: '#27272a',
  totalsColor: '#18181b',
  borderColor: '#000000', // âœ… CHANGED: Black borders like Google Docs
  headerBgColor: '#f4f4f5',
  totalsBgColor: '#e4e4e7',
};
