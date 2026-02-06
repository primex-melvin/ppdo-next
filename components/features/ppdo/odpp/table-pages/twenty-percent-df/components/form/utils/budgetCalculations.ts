
/**
 * @deprecated These utilities have been moved to @/components/features/ppdo/common/utils
 * Please update your imports to use the new centralized location.
 * 
 * Before: import { calculateBudgetAvailability } from "./utils/budgetCalculations";
 * After:  import { calculateBudgetAvailability } from "@/components/features/ppdo/common";
 */

export {
    calculateBudgetAvailability,
    calculateUtilizationRate,
    calculateBalance,
    checkAllocationViolation,
    checkUtilizationViolation,
    defaultBudgetAvailability,
} from "@/components/features/ppdo/odpp/utilities/common/utils/budgetCalculations";

export type { BudgetAvailabilityResult } from "@/components/features/ppdo/odpp/utilities/common/utils/budgetCalculations";