
/**
 * Base Types for PPDO Common Module
 * 
 * These types define the common structure shared across all PPDO entities
 * (Projects, Budget Items, 20% DF, Funds, Breakdowns)
 */

import { Id } from "@/convex/_generated/dataModel";

// ============================================================================
// BASE ENTITY TYPE
// ============================================================================

/**
 * Base interface for all budget-related entities
 */
export interface BaseBudgetEntity {
    id: string;
    totalBudgetAllocated: number;
    totalBudgetUtilized: number;
    utilizationRate: number;
    remarks?: string;
    year?: number;
    status?: "completed" | "ongoing" | "delayed" | string;
    isPinned?: boolean;
    autoCalculateBudgetUtilized?: boolean;
    createdAt?: number;
    updatedAt?: number;
}

/**
 * Base interface for project-like entities
 */
export interface BaseProjectEntity extends BaseBudgetEntity {
    particulars: string;
    implementingOffice: string;
    categoryId?: string | Id<"projectCategories">;
    departmentId?: string | Id<"departments">;
    obligatedBudget?: number;
    projectCompleted?: number;
    projectDelayed?: number;
    projectsOngoing?: number;
    targetDateCompletion?: number;
    projectManagerId?: string | Id<"users">;
}

/**
 * Base interface for fund-like entities
 */
export interface BaseFundEntity extends BaseBudgetEntity {
    projectTitle: string;
    officeInCharge: string;
    dateReceived?: number;
    received: number;
    obligatedPR?: number;
    utilized: number;
    balance: number;
    fiscalYear?: number;
    autoCalculateFinancials?: boolean;
}

// ============================================================================
// BASE FORM DATA TYPES
// ============================================================================

/**
 * Base form data for budget entities
 */
export interface BaseBudgetFormData {
    totalBudgetAllocated: number;
    totalBudgetUtilized: number;
    remarks?: string;
    year?: number;
    status?: string;
    autoCalculateBudgetUtilized?: boolean;
}

/**
 * Base form data for project entities
 */
export interface BaseProjectFormData extends BaseBudgetFormData {
    particulars: string;
    implementingOffice: string;
    categoryId?: string | Id<"projectCategories">;
    departmentId?: string | Id<"departments">;
    obligatedBudget?: number;
    targetDateCompletion?: number;
}

/**
 * Base form data for fund entities
 */
export interface BaseFundFormData extends BaseBudgetFormData {
    projectTitle: string;
    officeInCharge: string;
    dateReceived?: number;
    received: number;
    obligatedPR?: number;
    utilized: number;
}

// ============================================================================
// SHARED FIELD TYPES
// ============================================================================

/**
 * Note: BudgetAvailabilityResult is exported from @/components/features/ppdo/common/utils
 * to keep the type with its primary implementation.
 * 
 * Import it from:
 * import type { BudgetAvailabilityResult } from "@/components/features/ppdo/common/utils";
 * or
 * import type { BudgetAvailabilityResult } from "@/components/features/ppdo/common";
 */

/**
 * Form field error type
 */
export interface FormFieldError {
    message?: string;
}

/**
 * Generic select option
 */
export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

// ============================================================================
// STATUS TYPES
// ============================================================================

export type ProjectStatus = "completed" | "ongoing" | "delayed";

export type FundStatus = "not_yet_started" | "on_process" | "ongoing" | "completed" | "not_available";

// ============================================================================
// VIOLATION TYPES
// ============================================================================

// Note: ViolationData and ViolationDetail types are exported from 
// @/components/features/ppdo/common/components/modals to avoid circular dependencies
// and keep modal-related types with their components.
//
// Import them from:
// import type { ViolationData, ViolationDetail } from "@/components/features/ppdo/common/components/modals";
// or
// import type { ViolationData, ViolationDetail } from "@/components/features/ppdo/common";