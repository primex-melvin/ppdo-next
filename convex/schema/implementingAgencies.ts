// convex/schema/implementingAgencies.ts
import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Implementing Agencies Table
 * 
 * This table stores the master list of implementing agencies/offices that can be
 * used by both projects and project breakdowns.
 * 
 * An agency can be:
 * 1. A DEPARTMENT (links to departments table)
 * 2. An EXTERNAL agency (private contractor, subcon, etc.)
 * 
 * Usage Context:
 * - "project": Used for main projects
 * - "breakdown": Used for project breakdowns
 * - Both are tracked separately
 */
export const implementingAgencyTables = {
  implementingAgencies: defineTable({
    /**
     * Short code/abbreviation (e.g., "DPWH", "IAC", "PEO")
     * Must be unique across all agencies
     */
    code: v.string(),
    
    /**
     * Full name of the agency
     * (e.g., "Department of Public Works and Highways", "Imperial Asia Construction")
     */
    fullName: v.string(),
    
    /**
     * Type of agency
     * - "department": Links to an existing department in the system
     * - "external": External contractor/agency (not a department)
     */
    type: v.union(
      v.literal("department"),
      v.literal("external")
    ),
    
    /**
     * Link to department (ONLY if type = "department")
     * If this is set, the agency represents a department
     */
    departmentId: v.optional(v.id("departments")),
    
    /**
     * Optional description providing more context
     */
    description: v.optional(v.string()),
    
    /**
     * Contact information (for external agencies)
     */
    contactPerson: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    
    /**
     * Display order for sorting in UI (lower numbers appear first)
     */
    displayOrder: v.optional(v.number()),
    
    /**
     * Whether this agency is currently active/available for use
     * Inactive agencies won't show in dropdowns but existing records remain valid
     */
    isActive: v.boolean(),
    
    /**
     * Whether this is a system default agency (cannot be deleted)
     */
    isSystemDefault: v.optional(v.boolean()),
    
    /**
     * Usage statistics - Track separately for projects and breakdowns
     */
    projectUsageCount: v.optional(v.number()), // How many projects use this
    breakdownUsageCount: v.optional(v.number()), // How many breakdowns use this
    
    /**
     * Optional category for grouping (e.g., "Government", "Private Contractor")
     */
    category: v.optional(v.string()),
    
    /**
     * Optional color code for UI display (hex color)
     */
    colorCode: v.optional(v.string()),
    
    /**
     * Audit fields
     */
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
    
    /**
     * Optional notes about this agency
     */
    notes: v.optional(v.string()),
  })
    // Indexes for efficient queries
    .index("code", ["code"]) // For uniqueness check and lookups by code
    .index("type", ["type"]) // For filtering by type
    .index("isActive", ["isActive"]) // For filtering active agencies
    .index("displayOrder", ["displayOrder"]) // For ordered display
    .index("category", ["category"]) // For category filtering
    .index("isActiveAndDisplayOrder", ["isActive", "displayOrder"]) // Combined for sorted active list
    .index("departmentId", ["departmentId"]) // For department lookups
    .index("typeAndActive", ["type", "isActive"]) // For filtered lists
    .index("createdBy", ["createdBy"])
    .index("createdAt", ["createdAt"])
    .index("isSystemDefault", ["isSystemDefault"])
    .index("projectUsageCount", ["projectUsageCount"]) // For sorting by popularity
    .index("breakdownUsageCount", ["breakdownUsageCount"]), // For sorting by popularity
};