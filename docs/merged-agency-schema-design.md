# Merged Implementing Agency Schema Design

## Overview
This document outlines the design for merging the `departments` and `implementingAgencies` tables into a single, unified `implementingAgencies` table that supports both internal (department) and external agency use cases.

---

## 1. Design Decisions

### 1.1 Type Field Change
- **Old Values:** `"department" | "external"`
- **New Values:** `"internal" | "external"`
- **Rationale:** The term "department" is being absorbed into "internal agencies". This is more semantically accurate since internal agencies can include not just departments but also divisions, units, offices, etc.

### 1.2 Primary Name Field
- **Decision:** Use `name` instead of `fullName`
- **Rationale:** 
  - `name` is more concise and standard across the codebase
  - The ImplementingAgencies table has more recent usage and is growing in adoption
  - Migration complexity is manageable since both fields serve the same purpose

### 1.3 Hierarchy Support
- **New Field:** `parentAgencyId` (optional ID reference)
- **Rationale:** Replaces `parentDepartmentId` to support hierarchy for internal agencies
- **Constraint:** Should only be set when `type = "internal"`

### 1.4 Head User Support
- **Existing Field:** Use existing `contactPerson` pattern
- **New Field:** `headUserId` (optional ID reference to users table)
- **Rationale:** 
  - `headUserId` for internal agencies (links to users table)
  - `contactPerson` for external agencies (free text string)
  - This maintains type-safety while supporting both use cases

---

## 2. Merged Schema Field Reference

| Field Name | Type | Required | Default | Source | Notes |
|------------|------|----------|---------|--------|-------|
| `code` | `string` | ✅ Yes | - | Both | Unique identifier/abbreviation |
| `name` | `string` | ✅ Yes | - | Merged (was `fullName` in agencies, `name` in depts) | Primary display name |
| `type` | `"internal" \| "external"` | ✅ Yes | - | Agencies (modified) | `"internal"` replaces `"department"` |
| `description` | `string` | Optional | `undefined` | Both | Full description |
| `parentAgencyId` | `Id<"implementingAgencies">` | Optional | `undefined` | Departments (renamed from `parentDepartmentId`) | For internal hierarchy |
| `headUserId` | `Id<"users">` | Optional | `undefined` | Departments | Head of internal agency |
| `contactPerson` | `string` | Optional | `undefined` | Agencies | Contact name for external agencies |
| `contactEmail` | `string` | Optional | `undefined` | Agencies | Contact email |
| `contactPhone` | `string` | Optional | `undefined` | Merged (was `phone` in depts) | Contact phone |
| `address` | `string` | Optional | `undefined` | Agencies | Physical address |
| `location` | `string` | Optional | `undefined` | Departments | Physical location (kept for legacy) |
| `email` | `string` | Optional | `undefined` | Departments | Department email (legacy, use contactEmail) |
| `displayOrder` | `number` | Optional | `undefined` | Both | Sort order |
| `isActive` | `boolean` | ✅ Yes | `true` | Both | Active status |
| `isSystemDefault` | `boolean` | Optional | `false` | Agencies | Cannot delete if true |
| `projectUsageCount` | `number` | Optional | `0` | Agencies | Usage tracking |
| `breakdownUsageCount` | `number` | Optional | `0` | Agencies | Usage tracking |
| `category` | `string` | Optional | `undefined` | Agencies | Grouping category |
| `colorCode` | `string` | Optional | `undefined` | Agencies | UI display color |
| `createdBy` | `Id<"users">` | ✅ Yes | - | Both | Creator |
| `createdAt` | `number` | ✅ Yes | - | Both | Creation timestamp |
| `updatedAt` | `number` | ✅ Yes | - | Both | Last update timestamp |
| `updatedBy` | `Id<"users">` | Optional | `undefined` | Both | Last updater |
| `notes` | `string` | Optional | `undefined` | Agencies | Additional notes |
| `legacyDepartmentId` | `string` | Optional | `undefined` | **New** | Migration tracking |

---

## 3. Field Mapping Tables

### 3.1 Department → New Agency Mapping

| Old Department Field | New Agency Field | Transformation |
|---------------------|------------------|----------------|
| `name` | `name` | Direct copy |
| `code` | `code` | Direct copy |
| `description` | `description` | Direct copy |
| `parentDepartmentId` | `parentAgencyId` | Renamed + ID migration |
| `headUserId` | `headUserId` | Direct copy |
| `email` | `email` | Direct copy (legacy field) |
| `phone` | `contactPhone` | Renamed |
| `location` | `location` | Direct copy |
| `isActive` | `isActive` | Direct copy |
| `displayOrder` | `displayOrder` | Direct copy |
| `createdBy` | `createdBy` | Direct copy |
| `createdAt` | `createdAt` | Direct copy |
| `updatedAt` | `updatedAt` | Direct copy |
| `updatedBy` | `updatedBy` | Direct copy |
| `_id` | `legacyDepartmentId` | Store old ID for reference |
| — | `type` | Set to `"internal"` |
| — | `contactEmail` | Copy from `email` |
| — | `projectUsageCount` | Calculate from related data |
| — | `breakdownUsageCount` | Calculate from related data |
| — | `isSystemDefault` | Set to `false` |

### 3.2 Agency → New Agency Mapping

| Old Agency Field | New Agency Field | Transformation |
|-----------------|------------------|----------------|
| `code` | `code` | Direct copy |
| `fullName` | `name` | Renamed |
| `type` | `type` | `"department"` → `"internal"`, `"external"` stays |
| `departmentId` | `parentAgencyId` or `headUserId` | Conditional migration* |
| `description` | `description` | Direct copy |
| `contactPerson` | `contactPerson` | Direct copy |
| `contactEmail` | `contactEmail` | Direct copy |
| `contactPhone` | `contactPhone` | Direct copy |
| `address` | `address` | Direct copy |
| `displayOrder` | `displayOrder` | Direct copy |
| `isActive` | `isActive` | Direct copy |
| `isSystemDefault` | `isSystemDefault` | Direct copy |
| `projectUsageCount` | `projectUsageCount` | Direct copy |
| `breakdownUsageCount` | `breakdownUsageCount` | Direct copy |
| `category` | `category` | Direct copy |
| `colorCode` | `colorCode` | Direct copy |
| `createdBy` | `createdBy` | Direct copy |
| `createdAt` | `createdAt` | Direct copy |
| `updatedAt` | `updatedAt` | Direct copy |
| `updatedBy` | `updatedBy` | Direct copy |
| `notes` | `notes` | Direct copy |
| `_id` | `_id` | Keep same ID (no migration needed) |

**Note on `departmentId` migration:**
- If `type = "department"` (old): Migrate to new internal agency with `parentAgencyId` = new parent internal agency ID
- The old `departmentId` reference needs to be resolved to the new merged agency ID

### 3.3 Fields to be Deprecated/Removed

| Field | Reason |
|-------|--------|
| `departments` table | Fully replaced by merged `implementingAgencies` |
| `departmentId` references in other tables | Will be migrated to `implementingAgencyId` |
| `email` (on internal agencies) | Use `contactEmail` instead; kept temporarily for backward compatibility |
| `phone` (old naming) | Replaced by `contactPhone` |
| `fullName` | Replaced by `name` |
| `"department"` type value | Replaced by `"internal"` |

### 3.4 New Fields Added

| Field | Purpose |
|-------|---------|
| `parentAgencyId` | Support hierarchy for internal agencies |
| `headUserId` | Link to head/manager for internal agencies |
| `location` | Physical location (from departments) |
| `email` | Legacy department email (temporary) |
| `legacyDepartmentId` | Migration tracking for department IDs |

---

## 4. Indexes

### 4.1 Required Indexes

```typescript
.index("code", ["code"])                           // Unique lookup
.index("type", ["type"])                           // Filter by internal/external
.index("isActive", ["isActive"])                   // Filter active records
.index("displayOrder", ["displayOrder"])           // Sort order
.index("category", ["category"])                   // Group by category
.index("parentAgencyId", ["parentAgencyId"])       // Hierarchy queries
.index("headUserId", ["headUserId"])               // Find agencies by head
.index("typeAndActive", ["type", "isActive"])      // Filter internal/external active
.index("isActiveAndDisplayOrder", ["isActive", "displayOrder"])  // Sorted active list
.index("createdBy", ["createdBy"])
.index("createdAt", ["createdAt"])
.index("isSystemDefault", ["isSystemDefault"])
.index("projectUsageCount", ["projectUsageCount"])
.index("breakdownUsageCount", ["breakdownUsageCount"])
```

---

## 5. Convex Schema TypeScript Code

```typescript
// convex/schema/implementingAgencies.ts

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
export const implementingAgencyTables = {
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
     */
    name: v.string(),
    
    /**
     * Type of agency
     * - "internal": Internal organizational unit (department, office, division)
     * - "external": External contractor/agency/organization
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
     */
    parentAgencyId: v.optional(v.id("implementingAgencies")),
    
    // ============================================================================
    // LEADERSHIP / CONTACT INFORMATION
    // ============================================================================
    
    /**
     * Head of agency - user ID reference (internal agencies only)
     * Links to the users table for internal department heads/managers
     */
    headUserId: v.optional(v.id("users")),
    
    /**
     * Contact person name (external agencies only)
     * Free-text contact name for external organizations
     */
    contactPerson: v.optional(v.string()),
    
    /**
     * Primary contact email
     */
    contactEmail: v.optional(v.string()),
    
    /**
     * Contact phone number
     */
    contactPhone: v.optional(v.string()),
    
    /**
     * Physical address (external agencies primarily)
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
     */
    legacyDepartmentId: v.optional(v.string()),
  })
    // ============================================================================
    // INDEXES
    // ============================================================================
    .index("code", ["code"])                           // For uniqueness check and lookups
    .index("type", ["type"])                           // For filtering by type
    .index("isActive", ["isActive"])                   // For filtering active agencies
    .index("displayOrder", ["displayOrder"])           // For ordered display
    .index("category", ["category"])                   // For category filtering
    .index("parentAgencyId", ["parentAgencyId"])       // For hierarchy queries
    .index("headUserId", ["headUserId"])               // For finding agencies by head
    .index("isActiveAndDisplayOrder", ["isActive", "displayOrder"]) // Combined for sorted active list
    .index("typeAndActive", ["type", "isActive"])      // For filtered lists by type
    .index("createdBy", ["createdBy"])
    .index("createdAt", ["createdAt"])
    .index("isSystemDefault", ["isSystemDefault"])
    .index("projectUsageCount", ["projectUsageCount"]) // For sorting by popularity
    .index("breakdownUsageCount", ["breakdownUsageCount"]) // For sorting by popularity
    .index("legacyDepartmentId", ["legacyDepartmentId"]), // For migration lookups
};
```

---

## 6. Migration Strategy Summary

### Phase 1: Schema Update (Non-breaking)
1. Update `implementingAgencies` table with new merged schema
2. Add `legacyDepartmentId` field
3. Update `type` union to include `"internal"` alongside `"external"`
4. Deploy schema changes

### Phase 2: Data Migration
1. For each department in `departments` table:
   - Create new implementingAgency record with `type = "internal"`
   - Set `legacyDepartmentId` to old department._id
   - Map all fields according to mapping table
   
2. For each existing implementingAgency:
   - Update `type` from `"department"` to `"internal"`
   - Rename `fullName` to `name`
   - Update any `departmentId` references

3. Update all foreign key references:
   - `users.departmentId` → point to new agency IDs
   - `budgetItems.departmentId` → point to new agency IDs
   - `projects.departmentId` → point to new agency IDs
   - All other tables with departmentId references

### Phase 3: Deprecation
1. Mark `departments` table as deprecated (keep for rollback)
2. Update all queries to use `implementingAgencies`
3. Add runtime validation to ensure data consistency

### Phase 4: Cleanup
1. Remove `departments` table (after sufficient validation period)
2. Remove `legacyDepartmentId` field
3. Remove deprecated `email` and `location` fields (if desired)

---

## 7. Usage Patterns

### Query Internal Agencies (Departments)
```typescript
// Get all internal (department-like) agencies
await ctx.db
  .query("implementingAgencies")
  .withIndex("typeAndActive", q => q.eq("type", "internal").eq("isActive", true))
  .order("asc")
  .collect();
```

### Query External Agencies
```typescript
// Get all external agencies
await ctx.db
  .query("implementingAgencies")
  .withIndex("typeAndActive", q => q.eq("type", "external").eq("isActive", true))
  .order("asc")
  .collect();
```

### Get Agency Hierarchy
```typescript
// Get child agencies
await ctx.db
  .query("implementingAgencies")
  .withIndex("parentAgencyId", q => q.eq("parentAgencyId", parentId))
  .collect();
```

---

## 8. Validation Rules

| Rule | Enforcement |
|------|-------------|
| `headUserId` only when `type = "internal"` | Application-level validation |
| `parentAgencyId` must reference an internal agency | Application-level validation |
| `contactPerson` primarily for `type = "external"` | Application-level validation |
| `code` must be unique | Convex unique index (recommended) or application validation |
| `isSystemDefault` agencies cannot be deleted | Application-level validation |

---

*Document Version: 1.0*
*Last Updated: 2026-02-16*
