// components/ppdo/breakdown/types/breakdown.types.ts

/**
 * Centralized Breakdown Types
 *
 * These types are used by both Project and Trust Fund breakdown pages.
 * This follows the DRY principle by centralizing shared type definitions.
 */

import { Id } from "@/convex/_generated/dataModel";

export interface Breakdown {
  _id: Id<"govtProjectBreakdowns"> | Id<"trustFundBreakdowns">;
  _creationTime: number;
  projectName: string;
  implementingOffice: string;
  projectId?: Id<"projects">;
  trustFundId?: Id<"trustFunds">;
  projectTitle?: string;
  allocatedBudget?: number;
  obligatedBudget?: number;
  budgetUtilized?: number;
  utilizationRate?: number;
  balance?: number;
  dateStarted?: number;
  targetDate?: number;
  completionDate?: number;
  projectAccomplishment?: number;
  status?: "completed" | "ongoing" | "delayed";
  remarks?: string;
  district?: string;
  municipality?: string;
  barangay?: string;
  reportDate?: number;
  batchId?: string;
  fundSource?: string;
}

export type ColumnType = "text" | "number" | "date" | "status" | "currency";
export type ColumnAlign = "left" | "right" | "center";

export interface ColumnConfig {
  key: keyof Breakdown;
  label: string;
  width: number;
  type: ColumnType;
  align: ColumnAlign;
}

export interface BreakdownHistoryTableProps {
  breakdowns: Breakdown[];
  onPrint: () => void;
  onAdd?: () => void;
  onEdit?: (breakdown: Breakdown) => void;
  onDelete?: (id: string) => void;
  onOpenTrash?: () => void;
  /** Entity type for navigation - determines URL structure */
  entityType?: "project" | "trustfund";
  /** Navigation params for building detail paths */
  navigationParams?: {
    particularId?: string;
    projectbreakdownId?: string;
    trustfundbreakdownId?: string;
    year?: string;
  };
}

export interface RowHeights {
  [rowId: string]: number;
}

export interface ColumnTotals {
  [key: string]: number;
}

export interface TableSettings {
  tableIdentifier: string;
  columns: Array<{
    fieldKey: string;
    width: number;
    isVisible: boolean;
  }>;
  customRowHeights?: string;
}

// Navigation utilities interface
export interface NavigationParams {
  particularId?: string;
  projectbreakdownId?: string;
  trustfundbreakdownId?: string;
  year?: string;
}
