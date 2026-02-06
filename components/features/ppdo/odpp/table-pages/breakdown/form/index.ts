// components/ppdo/breakdown/form/index.ts

/**
 * Centralized Breakdown Form Components Index
 */

// Main form component
export { BreakdownForm } from "./BreakdownForm";

// Form field components
export { ProjectTitleField } from "./ProjectTitleField";
export { ImplementingOfficeField } from "./ImplementingOfficeField";
export { AllocatedBudgetField } from "./AllocatedBudgetField";
export { ObligatedBudgetField } from "./ObligatedBudgetField";
export { UtilizedBudgetField } from "./UtilizedBudgetField";
export { AccomplishmentField } from "./AccomplishmentField";
export { StatusField } from "./StatusField";
export { RemarksField } from "./RemarksField";
export { LocationFields } from "./LocationFields";
export { DateFields } from "./DateFields";
export { FormActions } from "./FormActions";

// Budget components
export { BudgetOverviewCard } from "./BudgetOverviewCard";
export { BudgetWarningAlert } from "./BudgetWarningAlert";
export { BudgetStatusBar } from "./BudgetStatusBar";

// Section components
export { FinancialInfoSection } from "./FinancialInfoSection";
export { AdditionalInfoSection } from "./AdditionalInfoSection";

// Utils and validation
export * from "./utils/formValidation";
export * from "./utils/budgetCalculations";
export * from "./utils/budgetValidation";
// Note: form-helpers are available via @/lib/shared/utils/form-helpers
