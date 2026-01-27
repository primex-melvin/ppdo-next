// components/shared/loaders/TableSkeleton.tsx

"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Props for TableSkeleton component
 */
export interface TableSkeletonProps {
  /** Number of rows to display */
  rows?: number;
  /** Number of columns to display */
  columns?: number;
  /** Show header skeleton */
  showHeader?: boolean;
  /** Custom row height in pixels */
  rowHeight?: number;
  /** Custom className for container */
  className?: string;
}

/**
 * Table skeleton loader component
 *
 * Displays a shimmering placeholder that matches standard table layout.
 * Use this instead of generic loading spinners for better UX.
 *
 * @example
 * // Basic usage:
 * if (isLoading) return <TableSkeleton />;
 *
 * @example
 * // Custom configuration:
 * if (isLoading) {
 *   return (
 *     <TableSkeleton
 *       rows={10}
 *       columns={8}
 *       showHeader={true}
 *       rowHeight={48}
 *     />
 *   );
 * }
 */
export function TableSkeleton({
  rows = 8,
  columns = 6,
  showHeader = true,
  rowHeight = 42,
  className = "",
}: TableSkeletonProps) {
  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden ${className}`}>
      {/* Table Header */}
      {showHeader && (
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={`header-${i}`} className="h-4" />
            ))}
          </div>
        </div>
      )}

      {/* Table Rows */}
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="px-4 py-2"
            style={{ height: rowHeight }}
          >
            <div className="grid gap-3 items-center h-full" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => {
                // Vary the width slightly for more realistic look
                const widthVariant = colIndex % 3 === 0 ? "w-4/5" : colIndex % 3 === 1 ? "w-full" : "w-3/4";
                return (
                  <Skeleton
                    key={`cell-${rowIndex}-${colIndex}`}
                    className={`h-3 ${widthVariant}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact table skeleton for smaller tables or sidebars
 *
 * @example
 * if (isLoading) return <CompactTableSkeleton rows={5} columns={3} />;
 */
export function CompactTableSkeleton({
  rows = 5,
  columns = 3,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-3 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-2 items-center">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-3 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Data table skeleton with toolbar
 * Includes search bar and action buttons skeleton
 *
 * @example
 * if (isLoading) return <DataTableSkeleton />;
 */
export function DataTableSkeleton({
  rows = 8,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
        {/* Search */}
        <Skeleton className="h-8 w-64" />

        {/* Actions */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Table */}
      <TableSkeleton rows={rows} columns={columns} />
    </div>
  );
}

/**
 * Card table skeleton for grid layouts
 *
 * @example
 * if (isLoading) return <CardTableSkeleton cards={6} />;
 */
export function CardTableSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={`card-${i}`}
          className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4"
        >
          <Skeleton className="h-5 w-3/4 mb-3" />
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-3 w-5/6 mb-2" />
          <Skeleton className="h-3 w-4/5" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-8 flex-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
