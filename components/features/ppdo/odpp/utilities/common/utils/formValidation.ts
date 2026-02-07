
/**
 * Common Form Validation Utilities
 * 
 * Shared Zod schemas and validation utilities used across PPDO forms.
 */

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

/**
 * Base project schema shared across project-like entities
 * Used by: Projects, 20% Development Fund, and similar budget items
 */
export const baseProjectSchema = z
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
        aipRefCode: z.string().optional(),
    })
    .refine(
        validateObligatedNotExceedAllocated('totalBudgetAllocated'),
        {
            message: "Obligated budget cannot exceed allocated budget.",
            path: ["obligatedBudget"],
        }
    );

/**
 * Project form validation schema
 * @deprecated Use baseProjectSchema from common/utils/formValidation instead
 */
export const projectSchema = baseProjectSchema;

/**
 * 20% Development Fund form validation schema
 * @deprecated Use baseProjectSchema from common/utils/formValidation instead
 */
export const twentyPercentDFSchema = baseProjectSchema;

/**
 * Budget item form validation schema (for 11_project_plan)
 * Simpler schema without cross-field validation
 */
export const budgetItemSchema = z.object({
    particular: particularCodeString,
    totalBudgetAllocated: budgetAmount,
    obligatedBudget: optionalBudgetAmount,
    totalBudgetUtilized: optionalBudgetAmount,
    year: yearField,
    autoCalculateBudgetUtilized: autoCalculateField,
});

// Type exports
export type BaseProjectFormValues = z.infer<typeof baseProjectSchema>;
export type ProjectFormValues = z.infer<typeof projectSchema>;
export type TwentyPercentDFFormValues = z.infer<typeof twentyPercentDFSchema>;
export type BudgetItemFormValues = z.infer<typeof budgetItemSchema>;
