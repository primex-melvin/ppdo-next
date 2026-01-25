// app/dashboard/project/[year]/[particularId]/[projectbreakdownId]/components/form/utils/formValidation.ts

import { z } from "zod";
import {
  optionalBudgetAmount,
  utilizationRateField,
  implementingOfficeField,
} from "@/lib/shared/schemas/budget-schema";

/**
 * Breakdown form validation schema
 * Matches existing validation rules from types/form.types.ts
 */
export const breakdownSchema = z.object({
  projectName: z.string().optional(),
  implementingOffice: implementingOfficeField,
  projectTitle: z.string().optional(),
  allocatedBudget: optionalBudgetAmount,
  obligatedBudget: optionalBudgetAmount,
  budgetUtilized: optionalBudgetAmount,
  utilizationRate: utilizationRateField,
  balance: z.number().optional(),
  dateStarted: z.number().optional(),
  targetDate: z.number().optional(),
  completionDate: z.number().optional(),
  projectAccomplishment: utilizationRateField,
  status: z.enum(["ongoing", "completed", "delayed"]).optional(),
  remarks: z.string().optional(),
  district: z.string().optional(),
  municipality: z.string().optional(),
  barangay: z.string().optional(),
  reportDate: z.number().optional(),
  batchId: z.string().optional(),
  fundSource: z.string().optional(),
});

/**
 * Inferred TypeScript type from schema
 */
export type BreakdownFormValues = z.infer<typeof breakdownSchema>;