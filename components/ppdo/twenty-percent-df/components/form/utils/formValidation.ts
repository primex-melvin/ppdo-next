
import { z } from "zod";
import {
    particularCodeString,
    budgetAmount,
    optionalBudgetAmount,
    yearField,
    autoCalculateField,
    implementingOfficeField,
    validateObligatedNotExceedAllocated,
} from "@/lib/shared/schemas/budget-schema";

export const twentyPercentDFSchema = z
    .object({
        particulars: particularCodeString,
        implementingOffice: implementingOfficeField,
        categoryId: z.string().optional(),
        totalBudgetAllocated: budgetAmount,
        obligatedBudget: optionalBudgetAmount,
        totalBudgetUtilized: budgetAmount,
        remarks: z.string().optional(),
        year: yearField,
        autoCalculateBudgetUtilized: autoCalculateField,
    })
    .refine(
        validateObligatedNotExceedAllocated('totalBudgetAllocated'),
        {
            message: "Obligated budget cannot exceed allocated budget.",
            path: ["obligatedBudget"],
        }
    );

export type TwentyPercentDFFormValues = z.infer<typeof twentyPercentDFSchema>;
