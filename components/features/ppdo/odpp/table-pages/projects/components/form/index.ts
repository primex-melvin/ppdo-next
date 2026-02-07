
export { AipRefCodeField } from "./AipRefCodeField";
export { ParticularField } from "./ParticularField";
export { CategoryField } from "./CategoryField";
export { ImplementingOfficeField } from "./ImplementingOfficeField";
export { YearField } from "./YearField";
export { AllocatedBudgetField } from "./AllocatedBudgetField";
export { AutoCalculateSwitch } from "./AutoCalculateSwitch";
export { ManualInputSection } from "./ManualInputSection";
export { RemarksField } from "./RemarksField";
export { UtilizationDisplay } from "./UtilizationDisplay";
export { FormActions } from "./FormActions";

// Utils - Form Validation (module-specific)
export * from "./utils/formValidation";

// Utils - Form Helpers (from shared)
export { 
    formatCurrency,
    formatNumberWithCommas,
    formatNumberForDisplay,
    parseFormattedNumber,
} from "@/lib/shared/utils/form-helpers";

// Utils - Budget Calculations (re-exported from common for backward compatibility)
export type { BudgetAvailabilityResult } from "./utils/budgetCalculations";
export { 
    calculateBudgetAvailability,
    defaultBudgetAvailability,
} from "./utils/budgetCalculations";
// Note: calculateUtilizationRate, calculateBalance, checkAllocationViolation, 
// checkUtilizationViolation are now available from @/components/features/ppdo/common