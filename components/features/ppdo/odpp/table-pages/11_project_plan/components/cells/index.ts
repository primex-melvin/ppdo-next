/**
 * @deprecated These cells have been moved to @/components/features/ppdo/data-tables/cells
 * Please update your imports to use the new centralized location.
 * 
 * Before: import { ... } from "@/components/features/ppdo/11_project_plan/components/cells";
 * After:  import { ... } from "@/components/features/ppdo/data-tables";
 */

// Re-export from new centralized location for backward compatibility
export {
    BudgetParticularCell,
    BudgetStatusCell,
    BudgetAmountCell,
    BudgetCountCell,
} from "@/components/features/ppdo/odpp/utilities/data-tables/cells";