// lib/print-canvas/tableToCanvas.ts

import { Page, HeaderFooter, TextElement } from '@/app/(extra)/canvas/_components/editor/types';
import {
  ConversionConfig,
  ConversionResult,
  DEFAULT_TABLE_STYLE,
  CellBounds,
  ColumnDefinition,
  BudgetTotals,
  clampTableFontSize,
} from './types';
import { BudgetItem } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/types";
import {
  wrapText,
  calculateWrappedRow,
  calculateWrappedHeader,
  WrappedRowData,
} from './textUtils';

const PAGE_SIZES = {
  A4: { width: 595, height: 842 },
  Short: { width: 612, height: 792 },
  Long: { width: 612, height: 936 },
};

const HEADER_HEIGHT = 80;
const FOOTER_HEIGHT = 60;
// Module-level margins, set per-conversion from config. Default: 0.3" * 72 ≈ 22px
let MARGIN_LEFT = 22;
let MARGIN_RIGHT = 22;
let MARGIN_TOP = 22;
let MARGIN_BOTTOM = 22;
// Minimum row heights (rows will expand if text wraps)
const MIN_ROW_HEIGHT = 22;
const MIN_HEADER_ROW_HEIGHT = 30;
const LINE_HEIGHT = 1.2;
// Extra row slack to absorb html2canvas/PDF font metric differences.
// We center this slack in row placement so preview remains visually centered.
const TABLE_ROW_RENDER_SAFETY = 8;
const HEADER_ROW_RENDER_SAFETY = 5;
// Explicit top slack (px). Remaining slack falls to the bottom, creating
// a stable "more bottom padding" appearance in PDF output.
const TABLE_TOP_SLACK_PX = 0;
const HEADER_TOP_SLACK_PX = 0;

// âœ… Internal padding for text inside cells (NOT cell spacing)
const CELL_TEXT_PADDING = 0; // Small padding so text doesn't touch borders
// Separate top insets so we can reduce visible top padding without changing wrap width math.
const DATA_ROW_TEXT_TOP_INSET = 0;
const HEADER_ROW_TEXT_TOP_INSET = 0;
const CATEGORY_ROW_TEXT_TOP_INSET = 0;
const TOTAL_ROW_TEXT_TOP_INSET = 0;

// âœ… Extra left padding for first column text (spacing from left border)
const FIRST_COLUMN_LEFT_PADDING = 20;

function toCamelCaseHeaderLabel(rawLabel: string): string {
  const normalized = rawLabel
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return rawLabel;

  return normalized
    .split(' ')
    .map((word) => {
      const lower = word.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Converts budget table data into canvas pages
 * Supports row markers for category/group headers and dynamic text wrapping
 */
export function convertTableToCanvas(config: ConversionConfig): ConversionResult {
  const {
    items,
    totals,
    columns,
    hiddenColumns,
    pageSize,
    includeHeaders,
    includeTotals,
    title,
    subtitle,
    rowMarkers = [],
    showHeader = true,
    showFooter = true,
  } = config;
  const tableFontSize = clampTableFontSize(config.tableFontSize);

  // Set module-level margins from config (safe: synchronous, single-threaded)
  const uniformMargin = config.margin ?? 22;
  MARGIN_LEFT = config.margins?.left ?? uniformMargin;
  MARGIN_RIGHT = config.margins?.right ?? uniformMargin;
  MARGIN_TOP = config.margins?.top ?? uniformMargin;
  MARGIN_BOTTOM = showFooter ? 0 : (config.margins?.bottom ?? uniformMargin);

  const isLandscape = config.orientation === 'landscape';
  const baseSize = PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES] || PAGE_SIZES.A4;
  const size = isLandscape
    ? { width: baseSize.height, height: baseSize.width }
    : baseSize;

  const reservedHeaderHeight = showHeader ? (config.headerHeight ?? HEADER_HEIGHT) : 0;
  const reservedFooterHeight = showFooter ? (config.footerHeight ?? FOOTER_HEIGHT) : 0;
  const availableHeight = size.height - reservedHeaderHeight - reservedFooterHeight - MARGIN_TOP - MARGIN_BOTTOM;
  const contentTop = MARGIN_TOP;
  const contentBottom = contentTop + availableHeight;

  // Filter visible columns
  const visibleColumns = columns.filter(col => !hiddenColumns.has(col.key));

  const columnWidths = calculateColumnWidths(visibleColumns, size.width - MARGIN_LEFT - MARGIN_RIGHT);

  // Create column width map for text wrapping calculations
  // First column gets reduced width to account for extra left padding
  const columnWidthMap = new Map<string, number>();
  visibleColumns.forEach((col, index) => {
    const extraPadding = index === 0 ? FIRST_COLUMN_LEFT_PADDING : 0;
    columnWidthMap.set(col.key, columnWidths[index] - extraPadding);
  });

  // Pre-calculate header height with text wrapping
  const columnLabels = new Map<string, string>();
  visibleColumns.forEach(col => columnLabels.set(col.key, toCamelCaseHeaderLabel(col.label)));
  const headerWrappedData = calculateWrappedHeader(
    columnLabels,
    columnWidthMap,
    tableFontSize,
    'Inter',
    CELL_TEXT_PADDING,
    MIN_HEADER_ROW_HEIGHT,
    LINE_HEIGHT,
    HEADER_ROW_RENDER_SAFETY
  );
  const dynamicHeaderHeight = includeHeaders ? headerWrappedData.rowHeight : 0;

  // Pre-calculate row heights for all items
  const preCalculatedRows: { item: BudgetItem; wrappedData: WrappedRowData; markerLabel?: string }[] = [];

  items.forEach((item, index) => {
    // Check for category marker
    const markerAtThisIndex = rowMarkers.find(m => m.index === index);

    // Create cell values map
    const cellValues = new Map<string, string>();
    visibleColumns.forEach(col => {
      cellValues.set(col.key, formatCellValue(item, col.key));
    });

    // Calculate wrapped row data
    const wrappedData = calculateWrappedRow(
      cellValues,
      columnWidthMap,
      tableFontSize,
      'Inter',
      CELL_TEXT_PADDING,
      MIN_ROW_HEIGHT,
      LINE_HEIGHT,
      TABLE_ROW_RENDER_SAFETY
    );

    preCalculatedRows.push({
      item,
      wrappedData,
      markerLabel: markerAtThisIndex?.label,
    });
  });

  // Create pages using height-based pagination
  const pages: Page[] = [];

  // Create title page if title provided
  if (title) {
    const titlePage = createTitlePage(pageSize, title, subtitle, config.orientation);
    pages.push(titlePage);
  }

  // Paginate items based on accumulated height
  let itemIndex = 0;
  while (itemIndex < preCalculatedRows.length) {
    const pageElements: TextElement[] = [];
    let currentY = contentTop;
    const globalRowIndex = itemIndex;

    // Create unique group ID for this page's table data
    const groupId = `table-group-${Date.now()}-${globalRowIndex}`;
    const groupName = `Table (Page Data ${pages.length + 1})`;

    // Add headers if requested
    if (includeHeaders) {
      pageElements.push(...createTableHeadersWithWrapping(
        visibleColumns,
        columnWidths,
        currentY,
        headerWrappedData,
        tableFontSize,
        groupId,
        groupName
      ));
      currentY += dynamicHeaderHeight;
    }

    // Add rows until we run out of space or items
    while (itemIndex < preCalculatedRows.length) {
      const rowData = preCalculatedRows[itemIndex];
      let rowHeightNeeded = rowData.wrappedData.rowHeight;

      // Account for category marker if present
      if (rowData.markerLabel) {
        rowHeightNeeded += MIN_ROW_HEIGHT; // Category markers use minimum height
      }

      // Check if this row fits on the current page
      if (currentY + rowHeightNeeded > contentBottom && pageElements.length > (includeHeaders ? visibleColumns.length : 0)) {
        // Row doesn't fit and we have content, start a new page
        break;
      }

      // Add category marker if present
      if (rowData.markerLabel) {
        pageElements.push(...createCategoryHeaderRow(
          rowData.markerLabel,
          columnWidths,
          currentY,
          tableFontSize,
          groupId,
          groupName
        ));
        currentY += MIN_ROW_HEIGHT;
      }

      // Add the data row with wrapped text
      pageElements.push(...createTableRowWithWrapping(
        rowData.item,
        visibleColumns,
        columnWidths,
        currentY,
        rowData.wrappedData,
        tableFontSize,
        groupId,
        groupName
      ));
      currentY += rowData.wrappedData.rowHeight;

      itemIndex++;
    }

    // Create the page
    const page: Page = {
      id: `page-data-${Date.now()}-${globalRowIndex}`,
      size: pageSize as 'A4' | 'Short' | 'Long',
      orientation: config.orientation || 'portrait',
      elements: pageElements,
      backgroundColor: '#ffffff',
    };
    pages.push(page);
  }

  // Add totals page if requested
  if (includeTotals && pages.length > 0) {
    const lastPage = pages[pages.length - 1];
    const hasSpace = checkSpaceForTotals(lastPage, contentBottom);

    if (hasSpace) {
      addTotalsToPage(lastPage, totals, visibleColumns, columnWidths, tableFontSize);
    } else {
      const totalsPage = createTotalsPage(
        pageSize,
        totals,
        visibleColumns,
        columnWidths,
        tableFontSize,
        config.orientation
      );
      pages.push(totalsPage);
    }
  }

  // Create header and footer
  const header = createPrintHeader(title || 'Budget Tracking Report', showHeader);
  const footer = createPrintFooter(showFooter);

  const result = {
    pages,
    header,
    footer,
    metadata: {
      totalPages: pages.length,
      totalRows: items.length,
      createdAt: Date.now(),
      pageSize,
      orientation: config.orientation || 'portrait',
      columnCount: visibleColumns.length,
    },
  };

  return result;
}

/**
 * Calculate column widths based on content and alignment
 */
function calculateColumnWidths(columns: ColumnDefinition[], totalWidth: number): number[] {
  const weights: Record<string, number> = {
    particular: 3,
    particulars: 3,
    implementingOffice: 2,
    year: 1,
    status: 1.2,
    totalBudgetAllocated: 2,
    obligatedBudget: 2,
    totalBudgetUtilized: 2,
    utilizationRate: 1.5,
    projectCompleted: 1.2,
    projectDelayed: 1.2,
    projectsOnTrack: 1.2,
    projectsOngoing: 1.2,
    remarks: 1.5,
  };

  const totalWeight = columns.reduce((sum, col) => sum + (weights[col.key] || 1), 0);

  return columns.map(col => {
    const weight = weights[col.key] || 1;
    return (totalWidth * weight) / totalWeight;
  });
}

/**
 * Create title page
 */
function createTitlePage(pageSize: string, title: string, subtitle?: string, orientation: 'portrait' | 'landscape' = 'portrait'): Page {
  const baseSize = PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES];
  const size = orientation === 'landscape'
    ? { width: baseSize.height, height: baseSize.width }
    : baseSize;
  const elements: TextElement[] = [];

  // Main title
  elements.push({
    id: `title-${Date.now()}`,
    type: 'text',
    text: title,
    x: size.width / 2 - 200,
    y: size.height / 2 - 100,
    width: 400,
    height: 50,
    fontSize: 32,
    fontFamily: 'Inter',
    bold: true,
    italic: false,
    underline: false,
    color: '#18181b',
    shadow: false,
    outline: false,
    visible: true,
  });

  // Subtitle
  if (subtitle) {
    elements.push({
      id: `subtitle-${Date.now()}`,
      type: 'text',
      text: subtitle,
      x: size.width / 2 - 200,
      y: size.height / 2 - 40,
      width: 400,
      height: 30,
      fontSize: 16,
      fontFamily: 'Inter',
      bold: false,
      italic: false,
      underline: false,
      color: '#71717a',
      shadow: false,
      outline: false,
      visible: true,
    });
  }

  // Generated date
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  elements.push({
    id: `date-${Date.now()}`,
    type: 'text',
    text: `Generated on ${dateStr}`,
    x: size.width / 2 - 150,
    y: size.height / 2 + 20,
    width: 300,
    height: 25,
    fontSize: 12,
    fontFamily: 'Inter',
    bold: false,
    italic: true,
    underline: false,
    color: '#a1a1aa',
    shadow: false,
    outline: false,
    visible: true,
  });

  return {
    id: `page-title-${Date.now()}`,
    size: pageSize as 'A4' | 'Short' | 'Long',
    orientation: orientation,
    elements,
    backgroundColor: '#ffffff',
  };
}

/**
 * Create data page with table rows and optional category markers
 * @deprecated Use the new height-based pagination in convertTableToCanvas instead
 */
function createDataPage(
  pageSize: string,
  items: BudgetItem[],
  columns: ColumnDefinition[],
  columnWidths: number[],
  includeHeaders: boolean,
  rowStartIndex: number,
  globalRowIndex: number,
  orientation: 'portrait' | 'landscape' = 'portrait',
  rowMarkers: import('./types').RowMarker[] = []
): Page {
  const baseSize = PAGE_SIZES[pageSize as keyof typeof PAGE_SIZES];
  const size = orientation === 'landscape'
    ? { width: baseSize.height, height: baseSize.width }
    : baseSize;
  const elements: TextElement[] = [];
  let currentY = MARGIN_TOP;

  // Create unique group ID for this page's table data
  const groupId = `table-group-${Date.now()}-${globalRowIndex}`;
  const groupName = `Table (Page Data ${globalRowIndex + 1})`;

  // Add headers if requested
  if (includeHeaders) {
    elements.push(...createTableHeaders(columns, columnWidths, currentY, groupId, groupName));
    currentY += MIN_HEADER_ROW_HEIGHT;
  }

  // Add data rows with category marker support
  items.forEach((item, index) => {
    // Check if there's a category marker at this position
    const markerAtThisIndex = rowMarkers.find(m => m.index === globalRowIndex + index);

    if (markerAtThisIndex) {
      // Render category header
      elements.push(...createCategoryHeaderRow(
        markerAtThisIndex.label,
        columnWidths,
        currentY,
        undefined,
        groupId,
        groupName
      ));
      currentY += MIN_ROW_HEIGHT;
    }

    // Render data row
    elements.push(...createTableRow(item, columns, columnWidths, currentY, index % 2 === 0, groupId, groupName));
    currentY += MIN_ROW_HEIGHT;
  });

  return {
    id: `page-data-${Date.now()}-${globalRowIndex}`,
    size: pageSize as 'A4' | 'Short' | 'Long',
    orientation: orientation,
    elements,
    backgroundColor: '#ffffff',
  };
}

/**
 * Create table headers - ZERO PADDING, text has small internal padding
 */
function createTableHeaders(
  columns: ColumnDefinition[],
  columnWidths: number[],
  y: number,
  groupId?: string,
  groupName?: string
): TextElement[] {
  const elements: TextElement[] = [];
  let currentX = MARGIN_LEFT;

  columns.forEach((col, index) => {
    const headerLabel = toCamelCaseHeaderLabel(col.label);

    // Extra left padding for first column
    const firstColPadding = index === 0 ? FIRST_COLUMN_LEFT_PADDING : 0;

    elements.push({
      id: `header-${col.key}-${Date.now()}`,
      type: 'text',
      text: headerLabel,
      x: currentX + CELL_TEXT_PADDING + firstColPadding,
      y: y + HEADER_ROW_TEXT_TOP_INSET,
      width: columnWidths[index] - (CELL_TEXT_PADDING * 2) - firstColPadding,
      height: MIN_HEADER_ROW_HEIGHT - (CELL_TEXT_PADDING * 2),
      fontSize: DEFAULT_TABLE_STYLE.headerFontSize,
      fontFamily: 'Inter',
      bold: true,
      italic: false,
      underline: false,
      color: DEFAULT_TABLE_STYLE.headerColor,
      shadow: false,
      outline: false,
      visible: true,
      lineHeight: LINE_HEIGHT,
      groupId,
      groupName,
    });

    currentX += columnWidths[index]; // âœ… NO GAP between columns
  });

  return elements;
}

/**
 * Create table headers with text wrapping support
 */
function createTableHeadersWithWrapping(
  columns: ColumnDefinition[],
  columnWidths: number[],
  y: number,
  wrappedData: WrappedRowData,
  tableFontSize: number = DEFAULT_TABLE_STYLE.dataFontSize,
  groupId?: string,
  groupName?: string
): TextElement[] {
  const elements: TextElement[] = [];
  let currentX = MARGIN_LEFT;

  columns.forEach((col, index) => {
    // Find the wrapped cell data for this column
    const cellData = wrappedData.cells.find(c => c.columnKey === col.key);
    const wrappedText = cellData
      ? cellData.lines.join('\n')
      : toCamelCaseHeaderLabel(col.label);

    // Extra left padding for first column
    const firstColPadding = index === 0 ? FIRST_COLUMN_LEFT_PADDING : 0;

    const verticalSlack = Math.max(0, wrappedData.verticalSlack ?? 0);
    const verticalSlackTop = getTopSlackOffset(verticalSlack, HEADER_TOP_SLACK_PX);
    const textBoxHeight = Math.max(1, wrappedData.rowHeight - (CELL_TEXT_PADDING * 2) - verticalSlack);

    elements.push({
      id: `header-${col.key}-${Date.now()}`,
      type: 'text',
      text: wrappedText,
      x: currentX + CELL_TEXT_PADDING + firstColPadding,
      y: y + HEADER_ROW_TEXT_TOP_INSET + verticalSlackTop,
      width: columnWidths[index] - (CELL_TEXT_PADDING * 2) - firstColPadding,
      height: textBoxHeight,
      fontSize: tableFontSize,
      fontFamily: 'Inter',
      bold: true,
      italic: false,
      underline: false,
      color: DEFAULT_TABLE_STYLE.headerColor,
      shadow: false,
      outline: false,
      visible: true,
      lineHeight: LINE_HEIGHT,
      groupId,
      groupName,
    });

    currentX += columnWidths[index];
  });

  return elements;
}

/**
 * Create a category header row (full-width, styled differently)
 */
function createCategoryHeaderRow(
  categoryLabel: string,
  columnWidths: number[],
  y: number,
  tableFontSize: number = DEFAULT_TABLE_STYLE.dataFontSize,
  groupId?: string,
  groupName?: string
): TextElement[] {
  const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0);

  return [{
    id: `category-header-${categoryLabel}-${Date.now()}`,
    type: 'text',
    text: categoryLabel,
    x: MARGIN_LEFT,
    y,
    width: totalWidth,
    height: MIN_ROW_HEIGHT,
    fontSize: tableFontSize,
    fontFamily: 'Inter',
    bold: true,
    italic: false,
    underline: false,
    color: '#18181b',
    shadow: false,
    outline: false,
    backgroundColor: '#e5e7eb',
    visible: true,
    lineHeight: LINE_HEIGHT,
    groupId,
    groupName,
  }];
}

/**
 * Create a single table row - ZERO PADDING between cells
 */
function createTableRow(
  item: BudgetItem,
  columns: ColumnDefinition[],
  columnWidths: number[],
  y: number,
  isEven: boolean,
  groupId?: string,
  groupName?: string
): TextElement[] {
  const elements: TextElement[] = [];
  let currentX = MARGIN_LEFT;

  columns.forEach((col, index) => {
    const value = formatCellValue(item, col.key);

    // Extra left padding for first column
    const firstColPadding = index === 0 ? FIRST_COLUMN_LEFT_PADDING : 0;

    elements.push({
      id: `cell-${item.id}-${col.key}-${Date.now()}`,
      type: 'text',
      text: value,
      x: currentX + CELL_TEXT_PADDING + firstColPadding,
      y: y + DATA_ROW_TEXT_TOP_INSET,
      width: columnWidths[index] - (CELL_TEXT_PADDING * 2) - firstColPadding,
      height: MIN_ROW_HEIGHT - (CELL_TEXT_PADDING * 2),
      fontSize: DEFAULT_TABLE_STYLE.dataFontSize,
      fontFamily: 'Inter',
      bold: false,
      italic: false,
      underline: false,
      color: DEFAULT_TABLE_STYLE.dataColor,
      shadow: false,
      outline: false,
      visible: true,
      lineHeight: LINE_HEIGHT,
      groupId,
      groupName,
    });

    currentX += columnWidths[index]; // âœ… NO GAP between columns
  });

  return elements;
}

/**
 * Create a single table row with text wrapping support
 */
function createTableRowWithWrapping(
  item: BudgetItem,
  columns: ColumnDefinition[],
  columnWidths: number[],
  y: number,
  wrappedData: WrappedRowData,
  tableFontSize: number = DEFAULT_TABLE_STYLE.dataFontSize,
  groupId?: string,
  groupName?: string
): TextElement[] {
  const elements: TextElement[] = [];
  let currentX = MARGIN_LEFT;

  columns.forEach((col, index) => {
    // Find the wrapped cell data for this column
    const cellData = wrappedData.cells.find(c => c.columnKey === col.key);
    const wrappedText = cellData ? cellData.lines.join('\n') : formatCellValue(item, col.key);

    // Extra left padding for first column
    const firstColPadding = index === 0 ? FIRST_COLUMN_LEFT_PADDING : 0;

    const verticalSlack = Math.max(0, wrappedData.verticalSlack ?? 0);
    const verticalSlackTop = getTopSlackOffset(verticalSlack, TABLE_TOP_SLACK_PX);
    const textBoxHeight = Math.max(1, wrappedData.rowHeight - (CELL_TEXT_PADDING * 2) - verticalSlack);

    elements.push({
      id: `cell-${item.id}-${col.key}-${Date.now()}`,
      type: 'text',
      text: wrappedText,
      x: currentX + CELL_TEXT_PADDING + firstColPadding,
      y: y + DATA_ROW_TEXT_TOP_INSET + verticalSlackTop,
      width: columnWidths[index] - (CELL_TEXT_PADDING * 2) - firstColPadding,
      height: textBoxHeight,
      fontSize: tableFontSize,
      fontFamily: 'Inter',
      bold: false,
      italic: false,
      underline: false,
      color: DEFAULT_TABLE_STYLE.dataColor,
      shadow: false,
      outline: false,
      visible: true,
      lineHeight: LINE_HEIGHT,
      groupId,
      groupName,
    });

    currentX += columnWidths[index];
  });

  return elements;
}

/**
 * Format cell value based on column type
 */
function formatCellValue(item: BudgetItem, key: string): string {
  const value = (item as any)[key];

  if (value === null || value === undefined) return '-';

  // Currency formatting
  if (key.includes('Budget') || key.includes('budget')) {
    return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  // Percentage formatting
  if (key === 'utilizationRate' || key === 'utilRate') {
    return `${value.toFixed(1)}%`;
  }

  // Status formatting
  if (key === 'status') {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  return String(value);
}

function calculateTotalsUtilizationRate(totals: BudgetTotals): number {
  const explicitRate = (totals as any).utilizationRate;
  if (typeof explicitRate === 'number' && Number.isFinite(explicitRate)) {
    return explicitRate;
  }

  const allocated = Number((totals as any).totalBudgetAllocated ?? 0);
  const utilized = Number((totals as any).totalBudgetUtilized ?? 0);

  if (!Number.isFinite(allocated) || allocated <= 0) return 0;
  if (!Number.isFinite(utilized)) return 0;

  return (utilized / allocated) * 100;
}

/**
 * Create totals page
 */
function createTotalsPage(
  pageSize: string,
  totals: BudgetTotals,
  columns: ColumnDefinition[],
  columnWidths: number[],
  tableFontSize: number = DEFAULT_TABLE_STYLE.dataFontSize,
  orientation: 'portrait' | 'landscape' = 'portrait'
): Page {
  const elements: TextElement[] = [];
  const y = MARGIN_TOP;

  // Create unique group ID for totals page
  const groupId = `table-group-totals-${Date.now()}`;
  const groupName = 'Table (Totals)';

  elements.push(...createTotalsRow(
    totals,
    columns,
    columnWidths,
    y,
    tableFontSize,
    groupId,
    groupName
  ));

  return {
    id: `page-totals-${Date.now()}`,
    size: pageSize as 'A4' | 'Short' | 'Long',
    orientation: orientation,
    elements,
    backgroundColor: '#ffffff',
  };
}

/**
 * Add totals to existing page
 */
function addTotalsToPage(
  page: Page,
  totals: BudgetTotals,
  columns: ColumnDefinition[],
  columnWidths: number[],
  tableFontSize: number = DEFAULT_TABLE_STYLE.dataFontSize
): void {
  const lastElement = page.elements[page.elements.length - 1];
  const y = getPageTableOuterBottom(page) ?? (lastElement ? lastElement.y + lastElement.height + CELL_TEXT_PADDING * 2 : MARGIN_TOP);

  // Use the same groupId as other elements on this page
  const existingGroupId = lastElement?.groupId;
  const existingGroupName = lastElement?.groupName;

  const totalsElements = createTotalsRow(
    totals,
    columns,
    columnWidths,
    y,
    tableFontSize,
    existingGroupId,
    existingGroupName
  );
  page.elements.push(...totalsElements);
}

/**
 * Create totals row - ZERO PADDING
 */
function createTotalsRow(
  totals: BudgetTotals,
  columns: ColumnDefinition[],
  columnWidths: number[],
  y: number,
  tableFontSize: number = DEFAULT_TABLE_STYLE.dataFontSize,
  groupId?: string,
  groupName?: string
): TextElement[] {
  const elements: TextElement[] = [];
  let currentX = MARGIN_LEFT;
  const totalUtilizationRate = calculateTotalsUtilizationRate(totals);

  columns.forEach((col, index) => {
    let value = '';

    if (col.key === 'particular') {
      value = 'TOTAL';
    } else if (col.key === 'utilizationRate' || col.key === 'utilRate') {
      value = `${totalUtilizationRate.toFixed(1)}%`;
    } else if (col.key in totals) {
      const totalValue = (totals as any)[col.key];
      value = formatCellValue({ [col.key]: totalValue } as any, col.key);
    }

    // Extra left padding for first column
    const firstColPadding = index === 0 ? FIRST_COLUMN_LEFT_PADDING : 0;

    if (value) {
      elements.push({
        id: `total-${col.key}-${Date.now()}`,
        type: 'text',
        text: value,
        x: currentX + CELL_TEXT_PADDING + firstColPadding,
        y: y + TOTAL_ROW_TEXT_TOP_INSET,
        width: columnWidths[index] - (CELL_TEXT_PADDING * 2) - firstColPadding,
        height: MIN_ROW_HEIGHT - (CELL_TEXT_PADDING * 2),
        fontSize: tableFontSize,
        fontFamily: 'Inter',
        bold: true,
        italic: false,
        underline: false,
        color: DEFAULT_TABLE_STYLE.totalsColor,
        shadow: false,
        outline: false,
        visible: true,
        lineHeight: LINE_HEIGHT,
        groupId,
        groupName,
      });
    }

    currentX += columnWidths[index]; // âœ… NO GAP between columns
  });

  return elements;
}

/**
 * Check if page has space for totals row
 */
function checkSpaceForTotals(page: Page, contentBottom: number): boolean {
  if (page.elements.length === 0) return true;

  const lastElementBottom = getPageTableOuterBottom(page) ?? (() => {
    const lastElement = page.elements[page.elements.length - 1];
    return lastElement.y + lastElement.height + CELL_TEXT_PADDING * 2;
  })();

  return (lastElementBottom + MIN_ROW_HEIGHT) <= contentBottom;
}

function getPageTableOuterBottom(page: Page): number | null {
  let bottom: number | null = null;

  for (const element of page.elements) {
    if (element.type !== 'text') continue;
    const rowBottom = estimateTableRowOuterBottom(element);
    if (rowBottom == null) continue;
    bottom = bottom == null ? rowBottom : Math.max(bottom, rowBottom);
  }

  return bottom;
}

function estimateTableRowOuterBottom(element: TextElement): number | null {
  const rowKind = getTableRowKindFromElementId(element.id);
  if (!rowKind) return null;

  const lineCount = Math.max(1, (element.text?.split('\n').length ?? 1));
  const lh = typeof element.lineHeight === 'number' ? element.lineHeight : LINE_HEIGHT;
  const contentHeight = lineCount * element.fontSize * lh;
  const baseRowHeight = contentHeight + (CELL_TEXT_PADDING * 2);

  let minRowHeight = MIN_ROW_HEIGHT;
  let renderSafety = 0;
  let topInset = 0;
  let topSlackPx = 0;

  if (rowKind === 'header') {
    minRowHeight = MIN_HEADER_ROW_HEIGHT;
    renderSafety = HEADER_ROW_RENDER_SAFETY;
    topInset = HEADER_ROW_TEXT_TOP_INSET;
    topSlackPx = HEADER_TOP_SLACK_PX;
  } else if (rowKind === 'data') {
    minRowHeight = MIN_ROW_HEIGHT;
    renderSafety = TABLE_ROW_RENDER_SAFETY;
    topInset = DATA_ROW_TEXT_TOP_INSET;
    topSlackPx = TABLE_TOP_SLACK_PX;
  } else if (rowKind === 'category') {
    minRowHeight = MIN_ROW_HEIGHT;
    renderSafety = 0;
    topInset = CATEGORY_ROW_TEXT_TOP_INSET;
    topSlackPx = 0;
  } else if (rowKind === 'total') {
    minRowHeight = MIN_ROW_HEIGHT;
    renderSafety = 0;
    topInset = TOTAL_ROW_TEXT_TOP_INSET;
    topSlackPx = 0;
  }

  const rowHeight = Math.max(baseRowHeight + renderSafety, minRowHeight);
  const verticalSlack = Math.max(0, rowHeight - baseRowHeight);
  const topSlack = getTopSlackOffset(verticalSlack, topSlackPx);
  const rowTop = element.y - topInset - topSlack;

  return rowTop + rowHeight;
}

function getTableRowKindFromElementId(id: string): 'header' | 'data' | 'category' | 'total' | null {
  if (id.startsWith('header-')) return 'header';
  if (id.startsWith('cell-')) return 'data';
  if (id.startsWith('category-header-')) return 'category';
  if (id.startsWith('total-')) return 'total';
  return null;
}

/**
 * Create print header
 */
function createPrintHeader(title: string, visible: boolean = true): HeaderFooter {
  return {
    elements: [
      {
        id: `header-title-${Date.now()}`,
        type: 'text',
        text: title,
        x: MARGIN_LEFT,
        y: 20,
        width: 400,
        height: 30,
        fontSize: 18,
        fontFamily: 'Inter',
        bold: true,
        italic: false,
        underline: false,
        color: '#18181b',
        shadow: false,
        outline: false,
        visible: true,
      },
    ],
    backgroundColor: '#ffffff',
    visible,
  };
}

function getTopSlackOffset(verticalSlack: number, topSlackPx: number): number {
  if (!Number.isFinite(verticalSlack) || verticalSlack <= 0) return 0;
  // Integer pixels reduce rasterized text blur in html2canvas/jsPDF output.
  const topSlack = Math.max(0, Math.floor(topSlackPx));
  return Math.max(0, Math.min(verticalSlack, topSlack));
}

/**
 * Create print footer
 */
function createPrintFooter(visible: boolean = true): HeaderFooter {
  return {
    elements: [
      {
        id: `footer-page-${Date.now()}`,
        type: 'text',
        text: 'Page {{pageNumber}} of {{totalPages}}',
        x: MARGIN_LEFT,
        y: 20,
        width: 200,
        height: 20,
        fontSize: 10,
        fontFamily: 'Inter',
        bold: false,
        italic: false,
        underline: false,
        color: '#71717a',
        shadow: false,
        outline: false,
        visible: true,
      },
    ],
    backgroundColor: '#ffffff',
    visible,
  };
}
