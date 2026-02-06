// components/ppdo/breakdown/form/utils/budgetCalculations.ts

/**
 * Budget Calculation Utilities for Breakdown Form
 *
 * Used by both Project and Trust Fund breakdown forms.
 * 
 * NOTE: These utilities are ENTITY-SPECIFIC and have different interfaces
 * from the common utils in @/components/features/ppdo/odpp/common/utils/budgetCalculations.
 * 
 * The Breakdown form uses a specialized `BudgetAllocationStatus` interface
 * with additional fields like `noProjectId`, `siblings`, and `siblingCount`
 * that are specific to breakdown budget validation UI components.
 * 
 * Do NOT consolidate with common utils - keep this file separate.
 */

import { formatCurrency } from "@/lib/shared/utils/form-helpers";

/**
 * Result of budget availability calculation
 */
export interface BudgetAllocationStatus {
  isLoading: boolean;
  noProjectId: boolean;
  parentTotal: number;
  siblingTotal: number;
  available: number;
  isExceeded: boolean;
  difference: number;
  percentage: number;
  siblings: Array<{
    _id: string;
    projectTitle?: string;
    implementingOffice: string;
    allocatedBudget?: number;
  }>;
  siblingCount: number;
}

/**
 * Budget warning information
 */
export interface BudgetWarning {
  message: string;
  parentBudget: number;
  allocatedTotal: number;
}

/**
 * Calculate budget availability from parent project
 * @param effectiveProjectId - The project ID to validate against
 * @param parentProject - Parent project data from query
 * @param siblingBreakdowns - Sibling breakdown data from query
 * @param currentBreakdown - Current breakdown being edited (to exclude from siblings)
 * @param currentAllocated - Current input value for allocated budget
 * @returns Budget allocation status
 */
export const calculateBudgetAvailability = (
  effectiveProjectId: string | undefined,
  parentProject: any | undefined | null,
  siblingBreakdowns: any[] | undefined | null,
  currentBreakdown: any | null,
  currentAllocated: number
): BudgetAllocationStatus => {
  // No project ID - cannot validate
  if (!effectiveProjectId) {
    return {
      isLoading: false,
      noProjectId: true,
      parentTotal: 0,
      siblingTotal: 0,
      available: 0,
      isExceeded: false,
      difference: 0,
      percentage: 0,
      siblings: [],
      siblingCount: 0,
    };
  }

  // Still loading data
  if (!parentProject || !siblingBreakdowns) {
    return {
      isLoading: true,
      noProjectId: false,
      parentTotal: 0,
      siblingTotal: 0,
      available: 0,
      isExceeded: false,
      difference: 0,
      percentage: 0,
      siblings: [],
      siblingCount: 0,
    };
  }

  const parentTotal = parentProject.totalBudgetAllocated || parentProject.received || 0;

  // Filter out current breakdown from siblings
  const filteredSiblings = currentBreakdown
    ? siblingBreakdowns.filter((b) => b._id !== currentBreakdown._id)
    : siblingBreakdowns;

  const siblingTotal = filteredSiblings.reduce(
    (sum, b) => sum + (b.allocatedBudget || 0),
    0
  );

  const available = parentTotal - siblingTotal;
  const totalWithCurrent = siblingTotal + currentAllocated;
  const isExceeded = totalWithCurrent > parentTotal;
  const difference = isExceeded ? totalWithCurrent - parentTotal : 0;
  const percentage = parentTotal > 0 ? (totalWithCurrent / parentTotal) * 100 : 0;

  return {
    isLoading: false,
    noProjectId: false,
    parentTotal,
    siblingTotal,
    available,
    isExceeded,
    difference,
    percentage,
    siblings: filteredSiblings,
    siblingCount: filteredSiblings.length,
  };
};

/**
 * Generate budget warning message if applicable
 * @param budgetStatus - Current budget allocation status
 * @param currentAllocated - Current allocated amount
 * @returns Warning object or null
 */
export const getBudgetWarning = (
  budgetStatus: BudgetAllocationStatus,
  currentAllocated: number
): BudgetWarning | null => {
  if (budgetStatus.isLoading || budgetStatus.noProjectId) {
    return null;
  }

  if (budgetStatus.isExceeded) {
    return {
      message: `Total allocated budget (â‚±${formatCurrency(
        budgetStatus.siblingTotal + currentAllocated
      )}) exceeds parent project budget (â‚±${formatCurrency(budgetStatus.parentTotal)}) by â‚±${formatCurrency(
        budgetStatus.difference
      )}`,
      parentBudget: budgetStatus.parentTotal,
      allocatedTotal: budgetStatus.siblingTotal + currentAllocated,
    };
  }

  return null;
};

/**
 * Calculate utilization rate
 */
export const calculateUtilizationRate = (utilized: number, allocated: number): number => {
  if (allocated <= 0) return 0;
  return (utilized / allocated) * 100;
};