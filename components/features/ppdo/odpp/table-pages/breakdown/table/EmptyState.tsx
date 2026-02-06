// components/ppdo/odpp/breakdown/table/EmptyState.tsx

/**
 * @deprecated Use TableEmptyState from @/components/features/ppdo/odpp/data-tables/core instead.
 * Example migration:
 * ```tsx
 * import { TableEmptyState } from "@/components/features/ppdo/odpp/data-tables/core";
 *
 * // For table row usage:
 * <TableEmptyState
 *   colSpan={columns.length}
 *   message="No breakdown records found"
 * />
 *
 * // For div container usage (outside table):
 * <TableEmptyState
 *   asTableRow={false}
 *   message="No breakdown records found"
 * />
 * ```
 */
export {
  TableEmptyState,
  TableEmptyState as EmptyState,
} from "@/components/features/ppdo/odpp/utilities/data-tables/core";