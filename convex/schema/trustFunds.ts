// convex/schema/trustFunds.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const trustFundTables = {
  /**
   * Trust Funds Management
   * Tracks fund allocation, utilization, and project status for trust funds
   */
  trustFunds: defineTable({
    /**
     * Project Title (free-form text, no connection to other tables)
     * Can contain any characters - user enters project name directly
     */
    projectTitle: v.string(),
    
    /**
     * Office In-Charge (connects to implementing agencies OR departments)
     * Uses the same system as projects for consistency
     */
    officeInCharge: v.string(), // Code from implementingAgencies table
    
    /**
     * Optional department reference (auto-linked if office is a department)
     */
    departmentId: v.optional(v.id("departments")),
    
    /**
     * Date when the trust fund was received
     */
    dateReceived: v.number(), // Timestamp
    
    /**
     * Financial tracking fields
     */
    received: v.number(), // Total amount received
    obligatedPR: v.optional(v.number()), // Obligated via Purchase Request
    utilized: v.number(), // Amount utilized
    balance: v.number(), // Remaining balance (auto-calculated)
    
    /**
     * Utilization rate (auto-calculated)
     * Formula: (utilized / received) * 100
     */
    utilizationRate: v.optional(v.number()),
    
    /**
     * Optional fields
     */
    remarks: v.optional(v.string()),
    year: v.optional(v.number()), // Fiscal year
    fiscalYear: v.optional(v.number()),
    
    /**
     * Status tracking
     */
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("pending")
      )
    ),
    
    /**
     * Pin functionality
     */
    isPinned: v.optional(v.boolean()),
    pinnedAt: v.optional(v.number()),
    pinnedBy: v.optional(v.id("users")),
    
    /**
     * Trash system (soft delete)
     */
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
    
    /**
     * Audit fields
     */
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
    notes: v.optional(v.string()),
  })
    .index("createdBy", ["createdBy"])
    .index("createdAt", ["createdAt"])
    .index("updatedAt", ["updatedAt"])
    .index("officeInCharge", ["officeInCharge"])
    .index("departmentId", ["departmentId"])
    .index("year", ["year"])
    .index("fiscalYear", ["fiscalYear"])
    .index("status", ["status"])
    .index("isPinned", ["isPinned"])
    .index("isDeleted", ["isDeleted"])
    .index("dateReceived", ["dateReceived"])
    .index("yearAndStatus", ["year", "status"])
    .index("departmentAndYear", ["departmentId", "year"]),

  /**
   * Trust Fund Activity Log
   * Tracks all changes to trust funds
   */
  trustFundActivities: defineTable({
    action: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted"),
      v.literal("restored")
    ),
    trustFundId: v.optional(v.id("trustFunds")),
    projectTitle: v.string(),
    officeInCharge: v.string(),
    
    previousValues: v.optional(v.string()), // JSON string
    newValues: v.optional(v.string()), // JSON string
    changedFields: v.optional(v.string()), // JSON array of field names
    changeSummary: v.optional(v.any()), // Smart summary object
    
    performedBy: v.id("users"),
    performedByName: v.string(),
    performedByEmail: v.string(),
    performedByRole: v.optional(v.string()),
    
    timestamp: v.number(),
    reason: v.optional(v.string()),
  })
    .index("trustFundId", ["trustFundId"])
    .index("performedBy", ["performedBy"])
    .index("timestamp", ["timestamp"])
    .index("action", ["action"]),
};