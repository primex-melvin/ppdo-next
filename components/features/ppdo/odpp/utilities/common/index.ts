
/**
 * PPDO Common Module
 * 
 * A centralized collection of shared components, hooks, utilities, and types
 * used across all PPDO modules (projects, budget, funds, 20% DF, breakdown).
 * 
 * @example
 * // Import shared components
 * import { ConfirmationModal, BudgetViolationModal } from "@/components/features/ppdo/common";
 * 
 * // Import form fields
 * import { AutoCalculateSwitch, AllocatedBudgetField } from "@/components/features/ppdo/common";
 * 
 * // Import utilities
 * import { calculateBudgetAvailability } from "@/components/features/ppdo/common";
 * 
 * // Import types
 * import type { BaseBudgetEntity, ViolationData } from "@/components/features/ppdo/common";
 */

// Components
export * from "./components/forms";
export * from "./components/modals";

// Utilities
export * from "./utils";

// Types
export * from "./types";