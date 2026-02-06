
/**
 * @deprecated This component has been moved to @/components/features/ppdo/data-tables/tables
 * Please update your imports to use the new centralized location.
 * 
 * Before: import { BudgetResizableTable } from "@/components/features/ppdo/11_project_plan/components/BudgetResizableTable";
 * After:  import { BudgetTable } from "@/components/features/ppdo/data-tables";
 * 
 * Note: The component was renamed from BudgetResizableTable to BudgetTable
 */

// Re-export from new centralized location for backward compatibility
export { BudgetTable as BudgetResizableTable } from "@/components/features/ppdo/odpp/utilities/data-tables/tables";