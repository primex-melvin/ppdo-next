// types/trustFund.types.ts

import { Id } from "@/convex/_generated/dataModel";

export interface TrustFund {
  id: string;
  projectTitle: string;
  officeInCharge: string;
  departmentId?: string;
  dateReceived?: number; // ✅ CHANGED: Made optional to match schema
  received: number;
  obligatedPR?: number;
  utilized: number;
  balance: number;
  utilizationRate?: number;
  remarks?: string;
  year?: number;
  fiscalYear?: number;
  status?: "active" | "completed" | "pending";
  isPinned?: boolean;
  pinnedAt?: number;
  pinnedBy?: string;
  isDeleted?: boolean;
  deletedAt?: number;
  deletedBy?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  updatedBy?: string;
  notes?: string;
}

export interface TrustFundFromDB {
  _id: Id<"trustFunds">;
  _creationTime: number;
  projectTitle: string;
  officeInCharge: string;
  departmentId?: Id<"departments">;
  dateReceived?: number; // ✅ CHANGED: Made optional to match schema
  received: number;
  obligatedPR?: number;
  utilized: number;
  balance: number;
  utilizationRate?: number;
  remarks?: string;
  year?: number;
  fiscalYear?: number;
  status?: "active" | "completed" | "pending";
  isPinned?: boolean;
  pinnedAt?: number;
  pinnedBy?: Id<"users">;
  isDeleted?: boolean;
  deletedAt?: number;
  deletedBy?: Id<"users">;
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
  updatedBy?: Id<"users">;
  notes?: string;
}

export interface TrustFundFormData {
  projectTitle: string;
  officeInCharge: string;
  dateReceived?: number; // ✅ CHANGED: Made optional to match schema
  received: number;
  obligatedPR?: number;
  utilized: number;
  remarks?: string;
  year?: number;
  fiscalYear?: number;
}

export interface TrustFundStatistics {
  totalReceived: number;
  totalUtilized: number;
  totalBalance: number;
  totalProjects: number;
  averageUtilizationRate: number;
}

export type TrustFundStatus = "active" | "completed" | "pending";

export type TrustFundSortField =
  | "projectTitle"
  | "officeInCharge"
  | "dateReceived"
  | "received"
  | "obligatedPR"
  | "utilized"
  | "balance"
  | "utilizationRate"
  | "year"
  | "status";

export type SortDirection = "asc" | "desc" | null;

export interface TrustFundContextMenuState {
  x: number;
  y: number;
  entity: TrustFund;
}

// ✅ FIXED: Helper function to convert DB format to frontend format
// Now handles optional dateReceived field properly
export function convertTrustFundFromDB(dbFund: TrustFundFromDB): TrustFund {
  return {
    id: dbFund._id,
    projectTitle: dbFund.projectTitle,
    officeInCharge: dbFund.officeInCharge,
    departmentId: dbFund.departmentId,
    dateReceived: dbFund.dateReceived, // ✅ Now properly optional
    received: dbFund.received,
    obligatedPR: dbFund.obligatedPR,
    utilized: dbFund.utilized,
    balance: dbFund.balance,
    utilizationRate: dbFund.utilizationRate,
    remarks: dbFund.remarks,
    year: dbFund.year,
    fiscalYear: dbFund.fiscalYear,
    status: dbFund.status,
    isPinned: dbFund.isPinned,
    pinnedAt: dbFund.pinnedAt,
    pinnedBy: dbFund.pinnedBy as string,
    isDeleted: dbFund.isDeleted,
    deletedAt: dbFund.deletedAt,
    deletedBy: dbFund.deletedBy as string,
    createdBy: dbFund.createdBy as string,
    createdAt: dbFund.createdAt,
    updatedAt: dbFund.updatedAt,
    updatedBy: dbFund.updatedBy as string,
    notes: dbFund.notes,
  };
}