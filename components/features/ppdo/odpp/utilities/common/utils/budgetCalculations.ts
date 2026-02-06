
/**
 * Budget Calculation Utilities
 * 
 * Shared utilities for calculating budget availability, utilization rates,
 * and budget violation checks.
 */

import { BaseBudgetEntity } from "../types";

/**
 * Result of budget availability calculation
 */
export interface BudgetAvailabilityResult {
    /** Whether data is still loading */
    isLoading: boolean;
    /** Total budget of parent item */
    parentTotal: number;
    /** Total budget allocated to sibling items */
    siblingTotal: number;
    /** Available budget (parent - siblings) */
    available: number;
    /** Whether current allocation exceeds available budget */
    isOverBudget: boolean;
    /** Amount by which budget is exceeded */
    overBudgetAmount: number;
    /** Percentage of available budget being used */
    percentage: number;
}

/**
 * Default/initial budget availability result (loading state)
 */
export const defaultBudgetAvailability: BudgetAvailabilityResult = {
    isLoading: true,
    parentTotal: 0,
    siblingTotal: 0,
    available: 0,
    isOverBudget: false,
    overBudgetAmount: 0,
    percentage: 0,
};

/**
 * Calculate budget availability for child items
 * 
 * @param shouldFetchParent - Whether parent data should be fetched
 * @param parentBudgetItem - Parent budget item with totalBudgetAllocated
 * @param siblingItems - Array of sibling items (other children of same parent)
 * @param currentItem - Current item being edited (excluded from sibling total)
 * @param totalBudgetAllocated - Proposed budget allocation amount
 * @returns BudgetAvailabilityResult with availability info
 * 
 * @example
 * const availability = calculateBudgetAvailability(
 *   true,
 *   parentItem,
 *   siblingProjects,
 *   currentProject,
 *   500000
 * );
 * if (availability.isOverBudget) {
 *   // Show warning
 * }
 */
export function calculateBudgetAvailability(
    shouldFetchParent: boolean,
    parentBudgetItem: { totalBudgetAllocated: number } | null | undefined,
    siblingItems: Array<{ totalBudgetAllocated: number; id?: string; _id?: string }> | undefined,
    currentItem: { totalBudgetAllocated: number; id?: string; _id?: string } | null | undefined,
    totalBudgetAllocated: number
): BudgetAvailabilityResult {
    if (!shouldFetchParent || !parentBudgetItem || !siblingItems) {
        return defaultBudgetAvailability;
    }

    const parentTotal = parentBudgetItem.totalBudgetAllocated;
    
    // Filter out current item from siblings when editing
    const currentId = currentItem?.id || (currentItem as any)?._id;
    const filteredSiblings = currentId
        ? siblingItems.filter((item) => item.id !== currentId && (item as any)._id !== currentId)
        : siblingItems;
    
    const siblingTotal = filteredSiblings.reduce(
        (sum, item) => sum + (item.totalBudgetAllocated || 0),
        0
    );
    
    const available = parentTotal - siblingTotal;
    const isOverBudget = totalBudgetAllocated > available;
    const overBudgetAmount = isOverBudget ? totalBudgetAllocated - available : 0;
    const percentage = available > 0 ? (totalBudgetAllocated / available) * 100 : 0;

    return {
        isLoading: false,
        parentTotal,
        siblingTotal,
        available,
        isOverBudget,
        overBudgetAmount,
        percentage,
    };
}

/**
 * Calculate utilization rate
 * 
 * @param utilized - Amount utilized
 * @param allocated - Amount allocated
 * @returns Utilization rate as a percentage (0-100+)
 */
export function calculateUtilizationRate(
    utilized: number,
    allocated: number
): number {
    if (!allocated || allocated <= 0) return 0;
    return (utilized / allocated) * 100;
}

/**
 * Calculate remaining balance
 * 
 * @param allocated - Amount allocated
 * @param utilized - Amount utilized
 * @returns Remaining balance
 */
export function calculateBalance(
    allocated: number,
    utilized: number
): number {
    return Math.max(0, (allocated || 0) - (utilized || 0));
}

/**
 * Check if a budget violates parent constraints
 * 
 * @param childAllocation - Child's budget allocation
 * @param parentAvailable - Parent's available budget
 * @returns Violation info or null if no violation
 */
export function checkAllocationViolation(
    childAllocation: number,
    parentAvailable: number
): { hasViolation: boolean; message: string; diff: number } | null {
    if (childAllocation <= parentAvailable) {
        return null;
    }
    
    return {
        hasViolation: true,
        message: "Child budget exceeds parent's available budget",
        diff: childAllocation - parentAvailable,
    };
}

/**
 * Check if utilization exceeds allocation
 * 
 * @param utilized - Amount utilized
 * @param allocated - Amount allocated
 * @returns Violation info or null if no violation
 */
export function checkUtilizationViolation(
    utilized: number,
    allocated: number
): { hasViolation: boolean; message: string; diff: number } | null {
    if (utilized <= allocated) {
        return null;
    }
    
    return {
        hasViolation: true,
        message: "Utilized amount exceeds allocated budget",
        diff: utilized - allocated,
    };
}
