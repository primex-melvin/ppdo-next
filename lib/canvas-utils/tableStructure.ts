// lib/canvas-utils/tableStructure.ts

import { CanvasElement, TextElement } from '@/app/(extra)/canvas/_components/editor/types';

/**
 * Represents a column in a table group
 */
export interface TableColumn {
  index: number;
  x: number;
  width: number;
  elementIds: string[];
}

/**
 * Represents a row in a table group
 */
export interface TableRow {
  index: number;
  y: number;
  height: number;
  elementIds: string[];
}

/**
 * Represents a complete table group with its structure
 */
export interface TableGroup {
  groupId: string;
  groupName?: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  columns: TableColumn[];
  rows: TableRow[];
  elements: CanvasElement[];
}

/**
 * Column position data for sorting and grouping
 */
interface ColumnPosition {
  x: number;
  width: number;
  elementIds: string[];
}

/**
 * Row position data for sorting and grouping
 */
interface RowPosition {
  y: number;
  height: number;
  elementIds: string[];
}

/**
 * Detects all table groups from canvas elements
 * Only considers visible elements to support column hiding
 * @param elements - Array of canvas elements
 * @returns Array of detected table groups
 */
export function detectTableGroups(elements: CanvasElement[]): TableGroup[] {
  // Filter elements that belong to table groups (exclude hidden elements)
  const tableElements = elements.filter(
    (el) => el.groupId && el.groupId.startsWith('table-group-') && el.visible !== false
  );

  // Group elements by groupId
  const groupMap = new Map<string, CanvasElement[]>();
  tableElements.forEach((el) => {
    const groupId = el.groupId!;
    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, []);
    }
    groupMap.get(groupId)!.push(el);
  });

  // Convert each group to a TableGroup structure
  const tableGroups: TableGroup[] = [];
  groupMap.forEach((groupElements, groupId) => {
    if (groupElements.length === 0) return;

    const columns = getTableColumns(groupElements);
    const rows = getTableRows(groupElements);
    const bounds = calculateGroupBounds(groupElements);
    const groupName = groupElements[0].groupName;

    tableGroups.push({
      groupId,
      groupName,
      bounds,
      columns,
      rows,
      elements: groupElements,
    });
  });

  return tableGroups;
}

/**
 * Extracts column structure from table elements
 * @param elements - Table group elements
 * @returns Array of table columns sorted left to right
 */
export function getTableColumns(elements: CanvasElement[]): TableColumn[] {
  if (elements.length === 0) return [];

  // Group elements by x position (with small tolerance for floating point)
  const columnMap = new Map<number, ColumnPosition>();
  const POSITION_TOLERANCE = 0.5; // pixels

  elements.forEach((el) => {
    // Find existing column with similar x position
    let foundColumn = false;
    for (const [x, col] of columnMap.entries()) {
      if (Math.abs(el.x - x) < POSITION_TOLERANCE) {
        col.elementIds.push(el.id);
        // Update width to maximum in this column
        col.width = Math.max(col.width, el.width);
        foundColumn = true;
        break;
      }
    }

    if (!foundColumn) {
      columnMap.set(el.x, {
        x: el.x,
        width: el.width,
        elementIds: [el.id],
      });
    }
  });

  // Convert to array and sort by x position
  const columns: TableColumn[] = Array.from(columnMap.entries())
    .sort(([x1], [x2]) => x1 - x2)
    .map(([x, col], index) => ({
      index,
      x: col.x,
      width: col.width,
      elementIds: col.elementIds,
    }));

  return columns;
}

/**
 * Extracts row structure from table elements
 * @param elements - Table group elements
 * @returns Array of table rows sorted top to bottom
 */
export function getTableRows(elements: CanvasElement[]): TableRow[] {
  if (elements.length === 0) return [];

  // Group elements by y position (with small tolerance)
  const rowMap = new Map<number, RowPosition>();
  const POSITION_TOLERANCE = 0.5; // pixels

  elements.forEach((el) => {
    // Find existing row with similar y position
    let foundRow = false;
    for (const [y, row] of rowMap.entries()) {
      if (Math.abs(el.y - y) < POSITION_TOLERANCE) {
        row.elementIds.push(el.id);
        // Update height to maximum in this row
        row.height = Math.max(row.height, el.height);
        foundRow = true;
        break;
      }
    }

    if (!foundRow) {
      rowMap.set(el.y, {
        y: el.y,
        height: el.height,
        elementIds: [el.id],
      });
    }
  });

  // Convert to array and sort by y position
  const rows: TableRow[] = Array.from(rowMap.entries())
    .sort(([y1], [y2]) => y1 - y2)
    .map(([y, row], index) => ({
      index,
      y: row.y,
      height: row.height,
      elementIds: row.elementIds,
    }));

  return rows;
}

/**
 * Finds the column at a specific x position
 * @param columns - Array of table columns
 * @param x - X coordinate to check
 * @param tolerance - Position tolerance in pixels (default: 4)
 * @returns Column index or null if not found
 */
export function findColumnAtPosition(
  columns: TableColumn[],
  x: number,
  tolerance: number = 4
): number | null {
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const rightEdge = col.x + col.width;

    // Check if x is near the right edge of this column
    if (Math.abs(x - rightEdge) <= tolerance) {
      return i;
    }
  }

  return null;
}

/**
 * Finds the row at a specific y position
 * @param rows - Array of table rows
 * @param y - Y coordinate to check
 * @param tolerance - Position tolerance in pixels (default: 4)
 * @returns Row index or null if not found
 */
export function findRowAtPosition(
  rows: TableRow[],
  y: number,
  tolerance: number = 4
): number | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const bottomEdge = row.y + row.height;

    // Check if y is near the bottom edge of this row
    if (Math.abs(y - bottomEdge) <= tolerance) {
      return i;
    }
  }

  return null;
}

/**
 * Calculates the bounding box of a group of elements
 * @param elements - Array of canvas elements
 * @returns Bounding box {x, y, width, height}
 */
export function calculateGroupBounds(elements: CanvasElement[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((el) => {
    minX = Math.min(minX, el.x);
    minY = Math.min(minY, el.y);
    maxX = Math.max(maxX, el.x + el.width);
    maxY = Math.max(maxY, el.y + el.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Gets all elements in a specific column
 * @param elements - Array of canvas elements
 * @param column - Column to get elements from
 * @returns Array of elements in the column
 */
export function getColumnElements(
  elements: CanvasElement[],
  column: TableColumn
): CanvasElement[] {
  return elements.filter((el) => column.elementIds.includes(el.id));
}

/**
 * Gets all elements in a specific row
 * @param elements - Array of canvas elements
 * @param row - Row to get elements from
 * @returns Array of elements in the row
 */
export function getRowElements(
  elements: CanvasElement[],
  row: TableRow
): CanvasElement[] {
  return elements.filter((el) => row.elementIds.includes(el.id));
}

/**
 * Calculates optimal column width based on content
 * @param elements - Elements in the column
 * @param minWidth - Minimum allowed width
 * @param maxWidth - Maximum allowed width
 * @returns Optimal width in pixels
 */
export function calculateOptimalColumnWidth(
  elements: CanvasElement[],
  minWidth: number = 40,
  maxWidth: number = 400
): number {
  if (elements.length === 0) return minWidth;

  // Find the element with the longest text in this column
  let maxTextWidth = minWidth;

  elements.forEach((el) => {
    if (el.type === 'text') {
      const textEl = el as TextElement;
      // Estimate text width based on character count and font size
      // This is a rough estimate; actual rendering would be more accurate
      const estimatedWidth = estimateTextWidth(
        textEl.text,
        textEl.fontSize,
        textEl.bold
      );
      maxTextWidth = Math.max(maxTextWidth, estimatedWidth);
    }
  });

  // Add padding (approximately 12px on each side)
  const withPadding = maxTextWidth + 24;

  // Apply min/max constraints
  return Math.max(minWidth, Math.min(maxWidth, withPadding));
}

/**
 * Estimates text width based on content and font properties
 * This is a rough estimation; actual canvas measurement would be more accurate
 * @param text - Text content
 * @param fontSize - Font size in pixels
 * @param bold - Whether text is bold
 * @returns Estimated width in pixels
 */
function estimateTextWidth(text: string, fontSize: number, bold: boolean): number {
  // Rough approximation: average character width is ~0.6 * fontSize
  // Bold text is slightly wider (~1.1x)
  const charWidth = fontSize * 0.6;
  const boldMultiplier = bold ? 1.1 : 1;
  return text.length * charWidth * boldMultiplier;
}
