// app/dashboard/project/[year]/components/index.ts

// Original budget components
export { BudgetPageHeader } from "./BudgetPageHeader";
export { BudgetTrackingTable } from "./BudgetTrackingTable";
export { BudgetItemForm } from "./BudgetItemForm";
export { LoadingState } from "./LoadingState";
export { ExpandModal } from "./ExpandModal";

// Hooks
export { useBudgetAccess } from "./hooks/useBudgetAccess";
export { useBudgetData } from "./hooks/useBudgetData";
export { useBudgetMutations } from "./hooks/useBudgetMutations";

// Year-specific components
export { YearBudgetPageHeader } from "./YearBudgetPageHeader";