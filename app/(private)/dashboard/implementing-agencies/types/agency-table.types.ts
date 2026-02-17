// app/(private)/dashboard/implementing-agencies/types/agency-table.types.ts

import { Id } from "@/convex/_generated/dataModel";

/**
 * Enriched agency data returned from the Convex `list` query
 */
export interface Agency {
  _id: Id<"implementingAgencies">;
  _creationTime: number;
  code: string;
  fullName: string;
  type: "internal" | "external";
  departmentId?: Id<"departments">;
  description?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  displayOrder?: number;
  isActive: boolean;
  isSystemDefault?: boolean;
  projectUsageCount?: number;
  breakdownUsageCount?: number;
  category?: string;
  colorCode?: string;
  notes?: string;
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
  updatedBy?: Id<"users">;
  // Enriched fields from the list query
  department?: {
    id: Id<"departments">;
    name: string;
    code: string;
  } | null;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  utilizedBudget: number;
  usageCount?: number;
  // Index signature for dynamic column access
  [key: string]: any;
}

export type AgencyColumnType = "text" | "number" | "date" | "status" | "badge";
export type AgencyColumnAlign = "left" | "right" | "center";

export interface AgencyColumnConfig {
  key: string | number | symbol;
  label: string;
  width: number;
  flex: number;
  minWidth?: number;
  maxWidth?: number;
  type: AgencyColumnType;
  align: AgencyColumnAlign;
  defaultVisible?: boolean;
}

export interface AgencyRowHeights {
  [rowId: string]: number;
}

export type AgencySortOption =
  | "lastModified"
  | "nameAsc"
  | "nameDesc"
  | "codeAsc"
  | "codeDesc"
  | "projectsDesc"
  | "projectsAsc"
  | "typeAsc"
  | "typeDesc";

export interface AgencySortOptionConfig {
  value: AgencySortOption;
  label: string;
}
