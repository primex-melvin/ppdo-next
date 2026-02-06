// app/dashboard/project/[year]/components/form/utils/formValidation.ts

/**
 * @deprecated These utilities have been moved to @/components/features/ppdo/odpp/common/utils
 * Please update your imports to use the new centralized location.
 * 
 * Before: import { budgetItemSchema, BudgetItemFormValues } from "./form/formValidation";
 * After:  import { budgetItemSchema, BudgetItemFormValues } from "@/components/features/ppdo/odpp/common/utils";
 */

export {
    budgetItemSchema,
    type BudgetItemFormValues,
} from "@/components/features/ppdo/odpp/utilities/common/utils/formValidation";