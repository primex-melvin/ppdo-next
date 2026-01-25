// lib/shared/schemas/budget-schema.ts

import { z } from "zod";
import {
  VALIDATION_MESSAGES,
  VALIDATION_LIMITS,
  VALIDATION_PATTERNS,
} from "@/lib/shared/utils/validation";

/**
 * Shared validation pattern for "particular" codes
 * Used across budget items and projects
 */
export const particularCodeString = z
  .string()
  .min(1, { message: VALIDATION_MESSAGES.REQUIRED })
  .refine((val) => val.trim().length > 0, {
    message: VALIDATION_MESSAGES.EMPTY_WHITESPACE,
  })
  .refine((val) => VALIDATION_PATTERNS.CODE.test(val), {
    message: VALIDATION_MESSAGES.INVALID_FORMAT,
  })
  .transform((val) => val.trim());

/**
 * Shared validation pattern for year field
 */
export const yearField = z
  .number()
  .int()
  .min(VALIDATION_LIMITS.MIN_YEAR, { message: VALIDATION_MESSAGES.YEAR_MIN })
  .max(VALIDATION_LIMITS.MAX_YEAR, { message: VALIDATION_MESSAGES.YEAR_MAX })
  .optional()
  .or(z.literal(0));

/**
 * Shared validation pattern for budget amounts (non-negative)
 */
export const budgetAmount = z
  .number()
  .min(0, { message: VALIDATION_MESSAGES.MIN_ZERO });

/**
 * Shared validation pattern for optional budget amounts
 */
export const optionalBudgetAmount = z
  .number()
  .min(0)
  .optional()
  .or(z.literal(0));

/**
 * Shared validation pattern for utilization rate percentage
 */
export const utilizationRateField = z
  .number()
  .min(VALIDATION_LIMITS.MIN_PERCENTAGE, {
    message: VALIDATION_MESSAGES.MIN_VALUE(VALIDATION_LIMITS.MIN_PERCENTAGE),
  })
  .max(VALIDATION_LIMITS.MAX_PERCENTAGE, {
    message: VALIDATION_MESSAGES.MAX_VALUE(VALIDATION_LIMITS.MAX_PERCENTAGE),
  })
  .optional();

/**
 * Shared validation pattern for auto-calculate toggle
 */
export const autoCalculateField = z.boolean().optional();

/**
 * Shared validation pattern for implementing office
 */
export const implementingOfficeField = z
  .string()
  .min(1, { message: VALIDATION_MESSAGES.REQUIRED_FIELD("Implementing office") });

/**
 * Base budget fields that are common across forms
 * Note: This is a helper object, not a schema to extend
 */
export const baseBudgetFields = {
  obligatedBudget: optionalBudgetAmount,
  year: yearField,
  autoCalculateBudgetUtilized: autoCalculateField,
};

/**
 * Validation helper: Ensure obligated budget doesn't exceed allocated budget
 * Usage: .refine(validateObligatedNotExceedAllocated('totalBudgetAllocated'), {...})
 */
export const validateObligatedNotExceedAllocated = (allocatedFieldName: string) => {
  return (data: any) => {
    const allocated = data[allocatedFieldName];
    const obligated = data.obligatedBudget;
    if (!obligated || !allocated) return true;
    return obligated <= allocated;
  };
};
