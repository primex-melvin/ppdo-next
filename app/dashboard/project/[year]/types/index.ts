// app/dashboard/project/budget/types/index.ts

import { Id } from "@/convex/_generated/dataModel";
import { SortState, ContextMenuState } from "@/lib/shared/types/table.types";

// ============================================================================
// BUDGET ITEM TYPES
// ============================================================================

export interface BudgetItem {
  id: string;
  particular: string;
  totalBudgetAllocated: number;
  obligatedBudget?: number;
  totalBudgetUtilized: number;
  utilizationRate: number;
  projectCompleted: number;
  projectDelayed: number;
  projectsOnTrack: number;
  year?: number;
  status?: "completed" | "ongoing" | "delayed";
  isPinned?: boolean;
  pinnedAt?: number;
  pinnedBy?: string;
}

export interface BudgetItemFromDB {
  _id: Id<"budgetItems">;
  particulars: string;
  totalBudgetAllocated: number;
  obligatedBudget?: number;
  totalBudgetUtilized: number;
  utilizationRate: number;
  projectCompleted: number;
  projectDelayed: number;
  projectsOnTrack: number;
  year?: number;
  status?: "completed" | "ongoing" | "delayed";
  isPinned?: boolean;
  pinnedAt?: number;
  pinnedBy?: string;
}

export type BudgetItemFormData = Omit<
  BudgetItem,
  | "id"
  | "utilizationRate"
  | "projectCompleted"
  | "projectDelayed"
  | "projectsOnTrack"
  | "status"
>;

// ============================================================================
// STATISTICS TYPES
// ============================================================================

export interface BudgetStatistics {
  totalAllocated: number;
  totalUtilized: number;
  averageUtilizationRate: number;
  totalProjects: number;
}

// ============================================================================
// SORTING & FILTERING TYPES (using shared types)
// ============================================================================

export type BudgetSortField =
  | "particular"
  | "year"
  | "status"
  | "totalBudgetAllocated"
  | "obligatedBudget"
  | "totalBudgetUtilized"
  | "utilizationRate"
  | "projectCompleted"
  | "projectDelayed"
  | "projectsOnTrack";

// Use shared SortState
export type BudgetSortState = SortState<BudgetSortField>;

// Use shared ContextMenuState
export type BudgetContextMenuState = ContextMenuState<BudgetItem>;

// ============================================================================
// ACCESS & USER TYPES
// ============================================================================

export interface AccessCheck {
  canAccess: boolean;
  user?: {
    name?: string;
    email?: string;
    role?: "super_admin" | "admin" | "inspector" | "user";
  };
  department?: {
    name?: string;
  };
}

export interface UserFromList {
  _id: Id<"users">;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  nameExtension?: string;
  name?: string;
  email?: string;
  departmentName?: string;
  role?: "super_admin" | "admin" | "inspector" | "user";
  status?: "active" | "inactive" | "suspended";
}

// ============================================================================
// BUDGET PARTICULAR TYPES
// ============================================================================

export interface BudgetParticular {
  _id: Id<"budgetParticulars">;
  code: string;
  fullName: string;
  description?: string;
  category?: string;
  usageCount?: number;
  isActive?: boolean;
}

// ============================================================================
// TOTALS TYPES
// ============================================================================

export interface BudgetTotals {
  totalBudgetAllocated: number;
  obligatedBudget: number;
  totalBudgetUtilized: number;
  projectCompleted: number;
  projectDelayed: number;
  projectsOnTrack: number;
}

// ============================================================================
// TABLE TYPES
// ============================================================================

export type SortDirection = "asc" | "desc" | null;
export type SortField = BudgetSortField | null;

// Re-export ContextMenuState for backward compatibility
export type { ContextMenuState } from "@/lib/shared/types/table.types";