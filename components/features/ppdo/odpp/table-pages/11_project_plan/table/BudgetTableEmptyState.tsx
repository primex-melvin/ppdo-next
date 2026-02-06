// components/ppdo/odpp/11_project_plan/table/BudgetTableEmptyState.tsx

/**
 * @deprecated Use TableEmptyState from @/components/features/ppdo/odpp/data-tables/core instead.
 * Example migration:
 * ```tsx
 * import { TableEmptyState } from "@/components/features/ppdo/odpp/data-tables/core";
 *
 * <TableEmptyState
 *   colSpan={11}
 *   message="No results found"
 *   subMessage="Try adjusting your search or filters"
 * />
 * ```
 */
export {
  TableEmptyState as BudgetTableEmptyState,
} from "@/components/features/ppdo/odpp/utilities/data-tables/core";