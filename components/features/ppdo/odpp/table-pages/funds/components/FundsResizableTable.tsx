
/**
 * @deprecated This component has been moved to @/components/features/ppdo/data-tables/tables
 * Please update your imports to use the new centralized location.
 * 
 * Before: import { FundsResizableTable } from "@/components/features/ppdo/funds/components/FundsResizableTable";
 * After:  import { FundsTable } from "@/components/features/ppdo/data-tables";
 * 
 * Note: The component was renamed from FundsResizableTable to FundsTable
 */

// Re-export from new centralized location for backward compatibility
export { FundsTable as FundsResizableTable } from "@/components/features/ppdo/odpp/utilities/data-tables/tables";