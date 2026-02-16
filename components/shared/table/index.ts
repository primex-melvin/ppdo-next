// components/shared/table/index.ts

/**
 * Shared Table Components
 *
 * Unified, reusable components for table toolbars across the application.
 * These components provide consistent styling, behavior, and responsive design.
 *
 * Usage:
 * ```tsx
 * import {
 *   GenericTableToolbar,
 *   TableSearchInput,
 *   TableActionButton
 * } from '@/components/shared/table';
 * ```
 */

export { TableSearchInput } from './TableSearchInput';
export { TableActionButton } from './TableActionButton';
export { GenericTableToolbar } from './GenericTableToolbar';
export { RowActionMenu } from './RowActionMenu';
export type { RowActionMenuProps, ExtraAction } from './RowActionMenu';
export { SortDropdown } from './SortDropdown';
export type { SortDropdownProps } from './SortDropdown';
