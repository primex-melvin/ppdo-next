// app/dashboard/project/[year]/components/form/utils/formValidation.ts

import { z } from "zod";
import {
  particularCodeString,
  budgetAmount,
  optionalBudgetAmount,
  yearField,
  autoCalculateField,
} from "@/lib/shared/schemas/budget-schema";

export const budgetItemSchema = z.object({
  particular: particularCodeString,
  totalBudgetAllocated: budgetAmount,
  obligatedBudget: optionalBudgetAmount,
  totalBudgetUtilized: optionalBudgetAmount,
  year: yearField,
  autoCalculateBudgetUtilized: autoCalculateField,
});

export type BudgetItemFormValues = z.infer<typeof budgetItemSchema>;