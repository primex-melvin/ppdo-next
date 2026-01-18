// convex/schema/fiscalYears.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const fiscalYearTables = {
  /**
   * Fiscal Years Management
   * Used for organizing and displaying years in the UI
   * Does NOT cascade delete - deleting a year only affects visibility
   * Recreating a deleted year will restore visibility of all associated data
   */
  fiscalYears: defineTable({
    /**
     * Year number (e.g., 2024, 2025, 2026)
     * Must be unique
     */
    year: v.number(),
    
    /**
     * Optional display label (e.g., "FY 2024-2025")
     */
    label: v.optional(v.string()),
    
    /**
     * Optional description or notes
     */
    description: v.optional(v.string()),
    
    /**
     * Whether this year is active/visible
     */
    isActive: v.boolean(),
    
    /**
     * Whether this is the current fiscal year
     * Only one year should have isCurrent = true
     */
    isCurrent: v.optional(v.boolean()),
    
    /**
     * Reference counts (for display purposes)
     * These are informational only - NOT enforced constraints
     */
    budgetItemCount: v.optional(v.number()),
    projectCount: v.optional(v.number()),
    breakdownCount: v.optional(v.number()),
    
    /**
     * Audit fields
     */
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
    
    /**
     * Optional notes
     */
    notes: v.optional(v.string()),
  })
    .index("year", ["year"]) // For uniqueness and lookup
    .index("isActive", ["isActive"]) // For filtering active years
    .index("isCurrent", ["isCurrent"]) // For finding current year
    .index("createdAt", ["createdAt"]) // For chronological sorting
    .index("yearAndActive", ["year", "isActive"]), // Combined for efficient queries
};