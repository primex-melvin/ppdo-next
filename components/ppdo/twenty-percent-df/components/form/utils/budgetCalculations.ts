
/**
 * @deprecated These utilities have been moved to @/components/ppdo/common/utils
 * Please update your imports to use the new centralized location.
 * 
 * Before: import { calculateBudgetAvailability } from "./utils/budgetCalculations";
 * After:  import { calculateBudgetAvailability } from "@/components/ppdo/common";
 */

export {
    calculateBudgetAvailability,
    calculateUtilizationRate,
    calculateBalance,
    checkAllocationViolation,
    checkUtilizationViolation,
    defaultBudgetAvailability,
} from "@/components/ppdo/common/utils/budgetCalculations";

export type { BudgetAvailabilityResult } from "@/components/ppdo/common/utils/budgetCalculations";
