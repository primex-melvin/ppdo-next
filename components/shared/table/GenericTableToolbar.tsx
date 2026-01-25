// components/shared/table/GenericTableToolbar.tsx

"use client";

import { ReactNode } from "react";

interface GenericTableToolbarProps {
  /**
   * Search input or left-side content
   * Typically contains TableSearchInput component
   */
  children: ReactNode;

  /**
   * Action buttons or right-side content
   * Typically contains TableActionButton components wrapped in a fragment
   */
  actions: ReactNode;
}

/**
 * GenericTableToolbar - Shared toolbar container for tables
 *
 * Provides consistent layout structure for table toolbars across the application.
 *
 * Features:
 * - Responsive layout (stacks vertically on mobile, horizontal on desktop)
 * - Consistent spacing and borders
 * - Dark mode support
 * - Flexbox layout with space-between
 *
 * Layout behavior:
 * - Mobile (< sm): Stacks vertically with gap-2
 * - Desktop (>= sm): Horizontal with space-between, gap-3
 *
 * @example
 * ```tsx
 * <GenericTableToolbar
 *   actions={
 *     <>
 *       <ColumnVisibilityMenu {...columnProps} />
 *       <TableActionButton icon={Trash2} label="Recycle Bin" onClick={...} />
 *       <TableActionButton icon={Printer} label="Print" onClick={...} />
 *       <TableActionButton
 *         icon={Plus}
 *         label="Add Record"
 *         onClick={...}
 *         variant="primary"
 *         accentColor={accentColor}
 *       />
 *     </>
 *   }
 * >
 *   <TableSearchInput
 *     value={search}
 *     onChange={setSearch}
 *     placeholder="Search..."
 *   />
 * </GenericTableToolbar>
 * ```
 */
export function GenericTableToolbar({
  children,
  actions,
}: GenericTableToolbarProps) {
  return (
    <div
      className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 shrink-0"
      style={{
        borderBottom: '1px solid rgb(228 228 231 / 1)',
      }}
    >
      {children}
      <div className="flex items-center gap-2">
        {actions}
      </div>
    </div>
  );
}
