// convex/schema/implementingAgenciesMerged.ts
// NEW MERGED SCHEMA - Ready for migration
// This file contains the unified implementingAgencies schema that absorbs departments

import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Merged Implementing Agencies Table
 * 
 * This unified table replaces both the departments and implementingAgencies tables.
 * It supports both internal organizational units (departments, offices, divisions)
 * and external agencies (contractors, subcontractors, other organizations).
 * 
 * Agency Types:
 * - "internal": Organizational units within the system (old departments)
 * - "external": External contractors, agencies, or organizations
 */
export const implementingAgencyMergedTables = {
  implementingAgencies: defineTable({
    // ============================================================================
    // IDENTIFICATION
    // ============================================================================
    
    /**
     * Short code/abbreviation (e.g., "DPWH", "FIN", "HR")
     * Must be unique across all agencies
     */
    code: v.string(),
    
    /**
     * Primary display name of the agency
     * (e.g., "Department of Public Works and Highways", "Finance Office")
     * 
     * MIGRATION NOTE: Was `fullName` in old implementingAgencies table
     * and `name` in departments table - now unified as `name`
     */
    name: v.string(),
    
    /**
     * Type of agency
     * - "internal": Internal organizational unit (department, office, division)
     * - "external": External contractor/agency/organization
     * 
     * MIGRATION NOTE: Old value "department" maps to "internal"
     */
    type: v.union(
      v.literal("internal"),
      v.literal("external")
    ),
    
    /**
     * Full description of the agency's role/responsibilities
     */
    description: v.optional(v.string()),
    
    // ============================================================================
    // HIERARCHY (Internal Agencies Only)
    // ============================================================================
    
    /**
     * Parent agency ID for hierarchical structure (internal agencies only)
     * null for top-level agencies
     * 
     * MIGRATION NOTE: Was `parentDepartmentId` in departments table
     * Now references implementingAgencies (self-referential)
     */
    parentAgencyId: v.optional(v.id("implementingAgencies")),
    
    // ============================================================================
    // LEADERSHIP / CONTACT INFORMATION
    // ============================================================================
    
    /**
     * Head of agency - user ID reference (internal agencies only)
     * Links to the users table for internal department heads/managers
     * 
     * MIGRATION NOTE: Was `headUserId` in departments table
     */
    headUserId: v.optional(v.id("users")),
    
    /**
     * Contact person name (external agencies only)
     * Free-text contact name for external organizations
     * 
     * MIGRATION NOTE: Existing field from implementingAgencies
     */
    contactPerson: v.optional(v.string()),
    
    /**
     * Primary contact email
     * 
     * MIGRATION NOTE: Use this for new implementations.
     * For migrated departments, this will be copied from the old `email` field.
     */
    contactEmail: v.optional(v.string()),
    
    /**
     * Contact phone number
     * 
     * MIGRATION NOTE: Was `phone` in departments table, now `contactPhone`
     */
    contactPhone: v.optional(v.string()),
    
    /**
     * Physical address (external agencies primarily)
     * 
     * MIGRATION NOTE: Existing field from implementingAgencies
     */
    address: v.optional(v.string()),
    
    /**
     * Physical location/office (internal agencies, legacy from departments)
     * @deprecated Use address for new implementations
     */
    location: v.optional(v.string()),
    
    /**
     * Department email (internal agencies, legacy from departments)
     * @deprecated Use contactEmail for new implementations
     */
    email: v.optional(v.string()),
    
    // ============================================================================
    // CATEGORIZATION & DISPLAY
    // ============================================================================
    
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
     * Optional category for grouping (e.g., "Government", "Private Contractor", "NGO")
     */
    category: v.optional(v.string()),
    
    /**
     * Optional color code for UI display (hex color)
     */
    colorCode: v.optional(v.string()),
    
    // ============================================================================
    // USAGE STATISTICS
    // ============================================================================
    
    /**
     * Number of projects using this agency
     */
    projectUsageCount: v.optional(v.number()),
    
    /**
     * Number of breakdowns using this agency
     */
    breakdownUsageCount: v.optional(v.number()),
    
    // ============================================================================
    // AUDIT FIELDS
    // ============================================================================
    
    /**
     * User who created this agency
     */
    createdBy: v.id("users"),
    
    /**
     * Timestamp when created
     */
    createdAt: v.number(),
    
    /**
     * Timestamp when last updated
     */
    updatedAt: v.number(),
    
    /**
     * User who last updated this agency
     */
    updatedBy: v.optional(v.id("users")),
    
    // ============================================================================
    // ADDITIONAL FIELDS
    // ============================================================================
    
    /**
     * Optional notes about this agency
     */
    notes: v.optional(v.string()),
    
    /**
     * Legacy department ID for migration tracking
     * Stores the old departments._id when migrating from departments table
     * This allows mapping old references during the migration period
     */
    legacyDepartmentId: v.optional(v.string()),
  })
    // ============================================================================
    // INDEXES
    // ============================================================================
    // Primary lookups
    .index("code", ["code"])                           // For uniqueness check and lookups by code
    .index("name", ["name"])                           // For name-based searches
    
    // Type and status filtering
    .index("type", ["type"])                           // For filtering by type
    .index("isActive", ["isActive"])                   // For filtering active agencies
    .index("typeAndActive", ["type", "isActive"])      // For filtered lists by type
    
    // Display and ordering
    .index("displayOrder", ["displayOrder"])           // For ordered display
    .index("isActiveAndDisplayOrder", ["isActive", "displayOrder"]) // Combined for sorted active list
    
    // Categorization
    .index("category", ["category"])                   // For category filtering
    .index("isSystemDefault", ["isSystemDefault"])     // For system default filtering
    
    // Hierarchy and relationships
    .index("parentAgencyId", ["parentAgencyId"])       // For hierarchy queries (children lookup)
    .index("headUserId", ["headUserId"])               // For finding agencies by head user
    
    // Usage tracking
    .index("projectUsageCount", ["projectUsageCount"]) // For sorting by project popularity
    .index("breakdownUsageCount", ["breakdownUsageCount"]) // For sorting by breakdown popularity
    
    // Audit
    .index("createdBy", ["createdBy"])
    .index("createdAt", ["createdAt"])
    .index("updatedAt", ["updatedAt"])
    
    // Migration support
    .index("legacyDepartmentId", ["legacyDepartmentId"]), // For migration lookups
};
