// types/access.types.ts

import { Id } from "@/convex/_generated/dataModel";

/**
 * Access level types shared across budget and particular access
 */
export type AccessLevel = "viewer" | "editor" | "admin";

/**
 * Enriched user with access information
 * This is what gets returned from getSharedUsers queries
 */
export interface UserWithAccessInfo {
  _id: Id<"budgetSharedAccess"> | Id<"budgetParticularSharedAccess">;
  userId: Id<"users">;
  userName: string;
  userEmail: string;
  departmentName?: string;
  accessLevel: AccessLevel;
  grantedAt: number;
  grantedBy: Id<"users">;
}

/**
 * Simplified user information for access requests
 * This matches what the backend returns
 */
export interface SimplifiedUser {
  _id: Id<"users">;
  name?: string;
  email?: string;
  departmentName?: string;
}

/**
 * Access request with user information
 * This exactly matches what getParticularPendingRequests returns
 */
export interface AccessRequestWithUser {
  _id: Id<"accessRequests">;
  userId: Id<"users">;
  pageRequested: string;
  accessType: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  user: SimplifiedUser | null;
}

/**
 * Base access request (for budget-level)
 */
export interface AccessRequest {
  _id: Id<"accessRequests">;
  userName: string;
  userEmail: string;
  departmentName: string;
  createdAt: number;
  accessType: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

/**
 * Selected user for granting access
 */
export interface SelectedUserForAccess {
  userId: Id<"users">;
  name: string;
  email: string;
  departmentName?: string;
  accessLevel: AccessLevel;
}