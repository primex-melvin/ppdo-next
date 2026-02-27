// app/dashboard/project/[year]/components/table-borders/TableBorderOverlay.tsx

'use client';

import React, { useMemo } from 'react';
import { CanvasElement } from '@/app/(extra)/canvas/_components/editor/types';

interface TableBorderOverlayProps {
  elements: CanvasElement[];
  /** Detect table structure automatically if not provided */
  tableStructure?: TableStructure;
}

interface TableStructure {
  columns: { x: number; width: number }[];
  rows: { y: number; height: number }[];
  mergedRows: { y: number; height: number }[];
  tableLeft: number;
  tableTop: number;
  tableWidth: number;
  tableHeight: number;
}

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

const inferCommonInnerGap = (positions: number[], sizeByPosition: Map<number, number>): number => {
  const gaps: number[] = [];
  for (let i = 0; i < positions.length - 1; i++) {
    const pos = positions[i];
    const next = positions[i + 1];
    const size = sizeByPosition.get(pos) ?? 0;
    const gap = next - pos - size;
    if (gap >= 0) gaps.push(gap);
  }
  if (gaps.length === 0) return 0;
  const positive = gaps.filter((gap) => gap > 0);
  return positive.length > 0 ? Math.min(...positive) : median(gaps);
};

/**
 * TableBorderOverlay Component
 * Renders Google Docs-style table borders (1px solid black, edge-to-edge)
 * Works by detecting table groups and drawing precise border lines
 */
export function TableBorderOverlay({ elements, tableStructure: providedStructure }: TableBorderOverlayProps) {
  const structure = useMemo(() => {
    if (providedStructure) return providedStructure;
    return detectTableStructure(elements);
  }, [elements, providedStructure]);

  if (!structure) return null;

  const mergedIntervals = getMergedIntervals(structure.mergedRows);
  const tableBottom = structure.tableTop + structure.tableHeight;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        zIndex: 1,
      }}
    >
      {/* Outer table border */}
      <rect
        x={structure.tableLeft}
        y={structure.tableTop}
        width={structure.tableWidth}
        height={structure.tableHeight}
        fill="none"
        stroke="#000000"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />

      {/* Vertical column borders */}
      {structure.columns.slice(0, -1).map((col, index) => {
        const x = col.x + col.width;
        return getVerticalLineSegments(structure.tableTop, tableBottom, mergedIntervals).map((segment, segmentIndex) => (
          <line
            key={`col-${index}-seg-${segmentIndex}`}
            x1={x}
            y1={segment.start}
            x2={x}
            y2={segment.end}
            stroke="#000000"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ));
      })}

      {/* Horizontal row borders */}
      {structure.rows.slice(0, -1).map((row, index) => {
        const y = row.y + row.height;
        return (
          <line
            key={`row-${index}`}
            x1={structure.tableLeft}
            y1={y}
            x2={structure.tableLeft + structure.tableWidth}
            y2={y}
            stroke="#000000"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </svg>
  );
}

/**
 * Detect table structure from canvas elements
 * Groups elements by groupId and analyzes their layout
 * Only considers visible elements to support column hiding
 */
function detectTableStructure(elements: CanvasElement[]): TableStructure | null {
  const isCategoryElement = (el: CanvasElement): boolean =>
    el.type === 'text' && el.id.startsWith('category-header-');

  // Find visible table elements (filter out hidden columns)
  const tableElements = elements.filter(
    (el) => el.groupId && el.groupName?.toLowerCase().includes('table') && el.visible !== false
  );
  const regularCellElements = tableElements.filter((el) => !isCategoryElement(el));

  if (tableElements.length === 0 || regularCellElements.length === 0) return null;

  // Get unique X positions (columns) and Y positions (rows)
  const uniqueX = Array.from(new Set(regularCellElements.map((el) => el.x))).sort((a, b) => a - b);
  const uniqueY = Array.from(new Set(tableElements.map((el) => el.y))).sort((a, b) => a - b);

  if (uniqueX.length === 0 || uniqueY.length === 0) return null;

  const widthByX = new Map<number, number>();
  const heightByY = new Map<number, number>();

  uniqueX.forEach((x) => {
    const cellsInColumn = regularCellElements.filter((el) => el.x === x);
    if (cellsInColumn.length > 0) widthByX.set(x, cellsInColumn[0].width);
  });
  uniqueY.forEach((y) => {
    const cellsInRow = tableElements.filter((el) => el.y === y);
    if (cellsInRow.length > 0) heightByY.set(y, cellsInRow[0].height);
  });

  const commonColumnGap = inferCommonInnerGap(uniqueX, widthByX);
  const commonRowGap = inferCommonInnerGap(uniqueY, heightByY);
  const halfColumnGap = commonColumnGap / 2;
  const halfRowGap = commonRowGap / 2;

  // Reconstruct outer column bounds from text bounds.
  const columns = uniqueX.map((x, index) => {
    const width = widthByX.get(x) ?? 0;
    let left = x - halfColumnGap;

    // Compensate first-column custom left padding when present.
    if (index === 0 && uniqueX.length > 1) {
      const firstGap = uniqueX[1] - x - width;
      const extraLeftPadding = Math.max(0, firstGap - commonColumnGap);
      left -= extraLeftPadding;
    }

    const right = index < uniqueX.length - 1
      ? uniqueX[index + 1] - halfColumnGap
      : x + width + halfColumnGap;

    return { x: left, width: Math.max(0, right - left) };
  });

  // Reconstruct row bounds from start-to-next-start spacing.
  const rows = uniqueY.map((y, index) => {
    const rowHeight = heightByY.get(y) ?? 0;
    const bottom = index < uniqueY.length - 1
      ? uniqueY[index + 1]
      : y + rowHeight + halfRowGap;

    return { y, height: Math.max(0, bottom - y) };
  });

  const mergedRows = rows.filter((row) =>
    tableElements.some((el) => el.y === row.y && isCategoryElement(el))
  );

  // Calculate bounds from reconstructed outer cell bounds.
  const tableLeft = Math.min(...columns.map((column) => column.x));
  const tableTop = Math.min(...rows.map((row) => row.y));
  const tableRight = Math.max(...columns.map((column) => column.x + column.width));
  const tableBottom = Math.max(...rows.map((row) => row.y + row.height));
  const tableWidth = Math.max(0, tableRight - tableLeft);
  const tableHeight = Math.max(0, tableBottom - tableTop);

  return {
    columns,
    rows,
    mergedRows,
    tableLeft,
    tableTop,
    tableWidth,
    tableHeight,
  };
}

function getMergedIntervals(rows: Array<{ y: number; height: number }>): Array<{ start: number; end: number }> {
  if (rows.length === 0) return [];

  const intervals = rows
    .map((row) => ({ start: row.y, end: row.y + row.height }))
    .sort((a, b) => a.start - b.start);

  const merged: Array<{ start: number; end: number }> = [];
  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (!last || interval.start > last.end) {
      merged.push({ ...interval });
    } else {
      last.end = Math.max(last.end, interval.end);
    }
  }

  return merged;
}

function getVerticalLineSegments(
  top: number,
  bottom: number,
  skipIntervals: Array<{ start: number; end: number }>
): Array<{ start: number; end: number }> {
  if (bottom <= top) return [];

  if (skipIntervals.length === 0) {
    return [{ start: top, end: bottom }];
  }

  const segments: Array<{ start: number; end: number }> = [];
  let cursor = top;

  for (const interval of skipIntervals) {
    const skipStart = Math.max(top, interval.start);
    const skipEnd = Math.min(bottom, interval.end);
    if (skipEnd <= skipStart) continue;

    if (skipStart > cursor) {
      segments.push({ start: cursor, end: skipStart });
    }
    cursor = Math.max(cursor, skipEnd);
  }

  if (cursor < bottom) {
    segments.push({ start: cursor, end: bottom });
  }

  return segments.filter((segment) => segment.end > segment.start);
}
