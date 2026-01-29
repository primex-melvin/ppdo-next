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

// Schema for Convex ID - accepts string format that will be cast to Id type
const convexId = z.string().refine((val) => val.length > 0, {
    message: "Invalid ID format",
});

export const twentyPercentDFSchema = z
    .object({
        particulars: particularCodeString,
        implementingOffice: implementingOfficeField,
        categoryId: convexId.optional(),
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