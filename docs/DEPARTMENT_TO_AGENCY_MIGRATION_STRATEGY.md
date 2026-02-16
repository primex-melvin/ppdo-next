# Departments to Implementing Agencies Migration Strategy

## Executive Summary

This document outlines the comprehensive data migration strategy for merging the `departments` table into `implementingAgencies`, changing the type field values, and updating all references across the system.

---

## 1. CURRENT STATE ANALYSIS

### 1.1 Departments Table Schema (`convex/schema/departments.ts`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Department name |
| `code` | string | Yes | Short code (e.g., "FIN", "HR") |
| `description` | string | No | Department description |
| `parentDepartmentId` | id("departments") | No | Hierarchical structure |
| `headUserId` | id("users") | No | Department head reference |
| `email` | string | No | Contact email |
| `phone` | string | No | Contact phone |
| `location` | string | No | Physical location |
| `isActive` | boolean | Yes | Active status |
| `displayOrder` | number | No | UI sort order |
| `createdBy` | id("users") | Yes | Creator reference |
| `createdAt` | number | Yes | Timestamp |
| `updatedAt` | number | Yes | Timestamp |
| `updatedBy` | id("users") | No | Updater reference |

**Indexes:** name, code, parentDepartmentId, headUserId, isActive, displayOrder

### 1.2 Implementing Agencies Table Schema (`convex/schema/implementingAgencies.ts`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `code` | string | Yes | Short code (unique) |
| `fullName` | string | Yes | Full agency name |
| `type` | union | Yes | "department" \| "external" |
| `departmentId` | id("departments") | No | Link to department (if type="department") |
| `description` | string | No | Description |
| `contactPerson` | string | No | Contact person name |
| `contactEmail` | string | No | Contact email |
| `contactPhone` | string | No | Contact phone |
| `address` | string | No | Physical address |
| `displayOrder` | number | No | UI sort order |
| `isActive` | boolean | Yes | Active status |
| `isSystemDefault` | boolean | No | System default flag |
| `projectUsageCount` | number | No | Usage statistics |
| `breakdownUsageCount` | number | No | Usage statistics |
| `category` | string | No | Grouping category |
| `colorCode` | string | No | UI color (hex) |
| `createdBy` | id("users") | Yes | Creator reference |
| `createdAt` | number | Yes | Timestamp |
| `updatedAt` | number | Yes | Timestamp |
| `updatedBy` | id("users") | No | Updater reference |
| `notes` | string | No | Additional notes |

**Indexes:** code, type, isActive, displayOrder, category, isActiveAndDisplayOrder, departmentId, typeAndActive, createdBy, createdAt, isSystemDefault, projectUsageCount, breakdownUsageCount

### 1.3 Tables Referencing departmentId

| Table | Field | Usage |
|-------|-------|-------|
| `users` | departmentId | User's department assignment |
| `projects` | departmentId | Project's department reference |
| `budgetItems` | departmentId | Budget item's department |
| `twentyPercentDF` | departmentId | 20% DF department reference |
| `trustFunds` | departmentId | Trust fund department reference |
| `specialHealthFunds` | departmentId | Special health fund department |
| `specialEducationFunds` | departmentId | Special education fund department |
| `accessRequests` | departmentId | Access request department snapshot |
| `budgetItemActivities` | departmentId | Activity log department reference |
| `searchIndex` | departmentId | Search indexing (stored as string) |
| `implementingAgencies` | departmentId | Self-reference for department-linked agencies |

---

## 2. FIELD MAPPING & CONFLICT ANALYSIS

### 2.1 Direct Field Mappings (No Conflicts)

| Departments Field | Implementing Agencies Field | Notes |
|-------------------|----------------------------|-------|
| `code` | `code` | Direct mapping |
| `description` | `description` | Direct mapping |
| `email` | `contactEmail` | Semantic match |
| `phone` | `contactPhone` | Semantic match |
| `location` | `address` | Semantic match (rename) |
| `isActive` | `isActive` | Direct mapping |
| `displayOrder` | `displayOrder` | Direct mapping |
| `createdBy` | `createdBy` | Direct mapping |
| `createdAt` | `createdAt` | Direct mapping |
| `updatedAt` | `updatedAt` | Direct mapping |
| `updatedBy` | `updatedBy` | Direct mapping |

### 2.2 Field Mapping Conflicts & Resolutions

#### A. Name Field (`department.name` → `agency.fullName`)
- **Conflict**: Different field names
- **Resolution**: Map `department.name` to `implementingAgencies.fullName`
- **Migration Action**: Direct value copy

#### B. Type Field Transformation
- **Current**: `type: "department" | "external"` in implementingAgencies
- **New**: `type: "internal" | "external"`
- **Migration Mapping**:
  - `"department"` → `"internal"`
  - `"external"` → `"external"` (unchanged)
- **Migration Action**: Update all existing implementingAgencies records

### 2.3 Fields Requiring Special Handling

#### A. `department.parentDepartmentId` (Hierarchical Structure)
- **Status**: NO EQUIVALENT in implementingAgencies
- **Options**:
  1. **Option A - Add to Schema**: Add `parentAgencyId` field to implementingAgencies
  2. **Option B - Flatten Hierarchy**: Lose hierarchy, keep as notes
  3. **Option C - Preserve as Metadata**: Store in `notes` or new `metadata` field
- **Recommendation**: Option A - Add `parentAgencyId` field for feature parity

#### B. `department.headUserId` (Department Leadership)
- **Status**: NO EQUIVALENT in implementingAgencies
- **Options**:
  1. **Option A - Add to Schema**: Add `headUserId` field
  2. **Option B - Use contactPerson**: Map to `contactPerson` (store user ID or name)
  3. **Option C - Drop Field**: Remove this functionality
- **Recommendation**: Option A - Add `headUserId` to implementingAgencies for feature parity

---

## 3. REFERENCE PATTERN ANALYSIS

### 3.1 Current Reference Patterns

| Referencing Table | Reference Type | Referenced As | Notes |
|-------------------|---------------|---------------|-------|
| `users` | ID | `departmentId: Id<"departments">` | Direct ID reference |
| `projects` | ID | `departmentId: Id<"departments">` | Direct ID reference |
| `budgetItems` | ID | `departmentId: Id<"departments">` | Direct ID reference |
| `twentyPercentDF` | ID | `departmentId: Id<"departments">` | Direct ID reference |
| `trustFunds` | ID | `departmentId: Id<"departments">` | Direct ID reference |
| `specialHealthFunds` | ID | `departmentId: Id<"departments">` | Direct ID reference |
| `specialEducationFunds` | ID | `departmentId: Id<"departments">` | Direct ID reference |
| `accessRequests` | ID | `departmentId: Id<"departments">` | Snapshot reference |
| `budgetItemActivities` | ID | `departmentId: Id<"departments">` | Audit reference |
| `searchIndex` | String | `departmentId: string` | String ID for polymorphic index |
| `implementingAgencies` | ID | `departmentId: Id<"departments">` | Self-reference |

### 3.2 Projects & Funds Reference Agencies Differently

**Key Finding**: Projects and funds use `implementingOffice` (STRING code) to reference implementing agencies:

```typescript
// projects.ts, twentyPercentDF.ts, trustFunds.ts, etc.
implementingOffice: v.string(), // Code from implementingAgencies table
```

This is a **FUNDAMENTAL DIFFERENCE**:
- Departments are referenced by **ID** (`departmentId: Id<"departments">`)
- Implementing Agencies are referenced by **CODE STRING** (`implementingOffice: string`)

### 3.3 Migration Impact on References

After migration:
- All tables currently referencing `departmentId` need to reference `implementingAgencies` by **ID**
- The `implementingOffice` string references remain unchanged
- Need to ensure agency CODE matches department CODE for consistency

---

## 4. MIGRATION STRATEGY

### 4.1 Phase 1: Schema Updates (Pre-Migration)

#### Step 1.1: Update implementingAgencies Schema

```typescript
// convex/schema/implementingAgencies.ts

// 1. Change type field
 type: v.union(
   v.literal("internal"),  // Changed from "department"
   v.literal("external")
 ),

// 2. Add parentAgencyId (for hierarchical structure)
parentAgencyId: v.optional(v.id("implementingAgencies")),

// 3. Add headUserId (for department leadership)
headUserId: v.optional(v.id("users")),

// 4. Add corresponding indexes
.index("parentAgencyId", ["parentAgencyId"])
.index("headUserId", ["headUserId"])
```

#### Step 1.2: Update All Referencing Tables

Update `departmentId` references in all tables to point to `implementingAgencies`:

```typescript
// For each table: users, projects, budgetItems, etc.
// Change:
departmentId: v.optional(v.id("departments")),
// To:
departmentId: v.optional(v.id("implementingAgencies")),
```

Tables to update:
- `users`
- `projects`
- `budgetItems`
- `twentyPercentDF`
- `trustFunds`
- `specialHealthFunds`
- `specialEducationFunds`
- `accessRequests`
- `budgetItemActivities`
- `searchIndex` (already string, but verify)

### 4.2 Phase 2: Data Migration

#### Step 2.1: Create Migration Script

```typescript
// convex/migrations/migrateDepartmentsToAgencies.ts

import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "../_generated/dataModel";

/**
 * Migration Result Types
 */
interface MigrationResult {
  success: boolean;
  departmentsMigrated: number;
  agenciesUpdated: number;
  referencesUpdated: {
    users: number;
    projects: number;
    budgetItems: number;
    twentyPercentDF: number;
    trustFunds: number;
    specialHealthFunds: number;
    specialEducationFunds: number;
    accessRequests: number;
    budgetItemActivities: number;
  };
  errors: string[];
  idMapping: Record<string, string>; // oldDeptId -> newAgencyId
}

/**
 * PHASE 1: Migrate Departments to Implementing Agencies
 * - Create new agency records for each department
 * - Build ID mapping table
 */
export const migrateDepartmentsToAgencies = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<MigrationResult> => {
    const dryRun = args.dryRun ?? true;
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify super_admin
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "super_admin") {
      throw new Error("Only super_admin can run migration");
    }

    const result: MigrationResult = {
      success: true,
      departmentsMigrated: 0,
      agenciesUpdated: 0,
      referencesUpdated: {
        users: 0,
        projects: 0,
        budgetItems: 0,
        twentyPercentDF: 0,
        trustFunds: 0,
        specialHealthFunds: 0,
        specialEducationFunds: 0,
        accessRequests: 0,
        budgetItemActivities: 0,
      },
      errors: [],
      idMapping: {},
    };

    const now = Date.now();

    try {
      // ============================================================
      // STEP 1: Migrate all departments to implementing agencies
      // ============================================================
      const departments = await ctx.db.query("departments").collect();

      for (const dept of departments) {
        try {
          // Check if agency with same code already exists
          const existingAgency = await ctx.db
            .query("implementingAgencies")
            .withIndex("code", (q) => q.eq("code", dept.code))
            .first();

          if (existingAgency) {
            // Update existing agency
            if (!dryRun) {
              await ctx.db.patch(existingAgency._id, {
                fullName: dept.name,
                type: "internal", // Changed from "department"
                description: dept.description,
                contactEmail: dept.email,
                contactPhone: dept.phone,
                address: dept.location,
                isActive: dept.isActive,
                displayOrder: dept.displayOrder,
                headUserId: dept.headUserId, // NEW FIELD
                // parentAgencyId will be set in step 2
                updatedAt: now,
                updatedBy: userId,
              });
            }
            result.idMapping[dept._id] = existingAgency._id;
            result.agenciesUpdated++;
          } else {
            // Create new agency
            if (!dryRun) {
              const newAgencyId = await ctx.db.insert("implementingAgencies", {
                code: dept.code,
                fullName: dept.name,
                type: "internal", // Changed from "department"
                description: dept.description,
                contactEmail: dept.email,
                contactPhone: dept.phone,
                address: dept.location,
                isActive: dept.isActive,
                displayOrder: dept.displayOrder,
                headUserId: dept.headUserId, // NEW FIELD
                isSystemDefault: false,
                projectUsageCount: 0,
                breakdownUsageCount: 0,
                createdBy: userId,
                createdAt: now,
                updatedAt: now,
              });
              result.idMapping[dept._id] = newAgencyId;
            }
            result.departmentsMigrated++;
          }
        } catch (error) {
          result.errors.push(`Failed to migrate department ${dept._id}: ${error}`);
        }
      }

      // ============================================================
      // STEP 2: Set parentAgencyId for hierarchical structure
      // ============================================================
      if (!dryRun) {
        for (const dept of departments) {
          if (dept.parentDepartmentId && result.idMapping[dept._id]) {
            const parentAgencyId = result.idMapping[dept.parentDepartmentId];
            if (parentAgencyId) {
              await ctx.db.patch(result.idMapping[dept._id], {
                parentAgencyId: parentAgencyId as Id<"implementingAgencies">,
              });
            }
          }
        }
      }

      // ============================================================
      // STEP 3: Update existing agencies' type field
      // ============================================================
      if (!dryRun) {
        const allAgencies = await ctx.db.query("implementingAgencies").collect();
        for (const agency of allAgencies) {
          if (agency.type === "department") {
            await ctx.db.patch(agency._id, {
              type: "internal",
            });
          }
        }
      }

      // ============================================================
      // STEP 4: Update all departmentId references
      // ============================================================
      if (!dryRun) {
        // Update users
        const users = await ctx.db.query("users").collect();
        for (const u of users) {
          if (u.departmentId && result.idMapping[u.departmentId]) {
            await ctx.db.patch(u._id, {
              departmentId: result.idMapping[u.departmentId] as Id<"implementingAgencies">,
            });
            result.referencesUpdated.users++;
          }
        }

        // Update projects
        const projects = await ctx.db.query("projects").collect();
        for (const p of projects) {
          if (p.departmentId && result.idMapping[p.departmentId]) {
            await ctx.db.patch(p._id, {
              departmentId: result.idMapping[p.departmentId] as Id<"implementingAgencies">,
            });
            result.referencesUpdated.projects++;
          }
        }

        // Update budgetItems
        const budgetItems = await ctx.db.query("budgetItems").collect();
        for (const b of budgetItems) {
          if (b.departmentId && result.idMapping[b.departmentId]) {
            await ctx.db.patch(b._id, {
              departmentId: result.idMapping[b.departmentId] as Id<"implementingAgencies">,
            });
            result.referencesUpdated.budgetItems++;
          }
        }

        // Update twentyPercentDF
        const twentyPercentDFs = await ctx.db.query("twentyPercentDF").collect();
        for (const t of twentyPercentDFs) {
          if (t.departmentId && result.idMapping[t.departmentId]) {
            await ctx.db.patch(t._id, {
              departmentId: result.idMapping[t.departmentId] as Id<"implementingAgencies">,
            });
            result.referencesUpdated.twentyPercentDF++;
          }
        }

        // Update trustFunds
        const trustFunds = await ctx.db.query("trustFunds").collect();
        for (const t of trustFunds) {
          if (t.departmentId && result.idMapping[t.departmentId]) {
            await ctx.db.patch(t._id, {
              departmentId: result.idMapping[t.departmentId] as Id<"implementingAgencies">,
            });
            result.referencesUpdated.trustFunds++;
          }
        }

        // Update specialHealthFunds
        const specialHealthFunds = await ctx.db.query("specialHealthFunds").collect();
        for (const s of specialHealthFunds) {
          if (s.departmentId && result.idMapping[s.departmentId]) {
            await ctx.db.patch(s._id, {
              departmentId: result.idMapping[s.departmentId] as Id<"implementingAgencies">,
            });
            result.referencesUpdated.specialHealthFunds++;
          }
        }

        // Update specialEducationFunds
        const specialEducationFunds = await ctx.db.query("specialEducationFunds").collect();
        for (const s of specialEducationFunds) {
          if (s.departmentId && result.idMapping[s.departmentId]) {
            await ctx.db.patch(s._id, {
              departmentId: result.idMapping[s.departmentId] as Id<"implementingAgencies">,
            });
            result.referencesUpdated.specialEducationFunds++;
          }
        }

        // Update accessRequests
        const accessRequests = await ctx.db.query("accessRequests").collect();
        for (const a of accessRequests) {
          if (a.departmentId && result.idMapping[a.departmentId]) {
            await ctx.db.patch(a._id, {
              departmentId: result.idMapping[a.departmentId] as Id<"implementingAgencies">,
            });
            result.referencesUpdated.accessRequests++;
          }
        }

        // Update budgetItemActivities
        const budgetItemActivities = await ctx.db.query("budgetItemActivities").collect();
        for (const a of budgetItemActivities) {
          if (a.departmentId && result.idMapping[a.departmentId]) {
            await ctx.db.patch(a._id, {
              departmentId: result.idMapping[a.departmentId] as Id<"implementingAgencies">,
            });
            result.referencesUpdated.budgetItemActivities++;
          }
        }

        // Update searchIndex (stored as string, convert ID)
        const searchIndexes = await ctx.db.query("searchIndex").collect();
        for (const s of searchIndexes) {
          if (s.departmentId && result.idMapping[s.departmentId]) {
            await ctx.db.patch(s._id, {
              departmentId: result.idMapping[s.departmentId],
            });
          }
        }
      }

      result.success = result.errors.length === 0;
      return result;

    } catch (error) {
      result.success = false;
      result.errors.push(`Migration failed: ${error}`);
      return result;
    }
  },
});
```

### 4.3 Phase 3: Post-Migration Cleanup

#### Step 3.1: Update Application Code

Update all queries/mutations that reference `departments`:

1. **Update `convex/departments.ts` queries** to use `implementingAgencies`:
   - `list` → Use `implementingAgencies.list` with `type: "internal"` filter
   - `get` → Use `implementingAgencies.get`
   - `getHierarchy` → New query using `parentAgencyId`

2. **Update search indexing** in `convex/search/index.ts`:
   - Change entity type from `"department"` to `"internal_agency"`

3. **Update all components** that use department queries

#### Step 3.2: Remove Departments Table

After successful migration and verification:

```typescript
// Remove from convex/schema.ts
// Remove convex/schema/departments.ts
// Remove convex/departments.ts
```

---

## 5. OPTIONAL VS REQUIRED FIELDS IN MERGED SCHEMA

### 5.1 Proposed Implementing Agencies Schema (Merged)

```typescript
{
  // Required Fields
  code: v.string(),                    // Required - unique identifier
  fullName: v.string(),                // Required - display name (was department.name)
  type: v.union(
    v.literal("internal"),             // Required - "department" → "internal"
    v.literal("external")
  ),
  isActive: v.boolean(),               // Required
  createdBy: v.id("users"),           // Required
  createdAt: v.number(),               // Required
  updatedAt: v.number(),               // Required

  // Optional Fields (can be empty/null for migration safety)
  description: v.optional(v.string()),
  
  // NEW: Self-referential hierarchy (was parentDepartmentId)
  parentAgencyId: v.optional(v.id("implementingAgencies")),
  
  // NEW: Department head (was headUserId)
  headUserId: v.optional(v.id("users")),
  
  // Contact Information
  contactPerson: v.optional(v.string()),
  contactEmail: v.optional(v.string()),  // Was department.email
  contactPhone: v.optional(v.string()),  // Was department.phone
  address: v.optional(v.string()),       // Was department.location
  
  // UI/Organization
  displayOrder: v.optional(v.number()),
  category: v.optional(v.string()),
  colorCode: v.optional(v.string()),
  
  // System Fields
  isSystemDefault: v.optional(v.boolean()),
  
  // Usage Statistics
  projectUsageCount: v.optional(v.number()),
  breakdownUsageCount: v.optional(v.number()),
  
  // Legacy: Link to old department (can be removed after migration)
  // departmentId: v.optional(v.id("departments")), // DEPRECATED
  
  // Audit
  updatedBy: v.optional(v.id("users")),
  notes: v.optional(v.string()),
}
```

### 5.2 Field Optionality Rationale

| Field | Optionality | Rationale |
|-------|-------------|-----------|
| `code` | Required | Primary identifier, must exist |
| `fullName` | Required | Display name, must exist |
| `type` | Required | Classification, must exist |
| `parentAgencyId` | Optional | Not all agencies have parents |
| `headUserId` | Optional | External agencies may not have heads |
| `contactEmail` | Optional | External agencies may not have emails |
| `contactPhone` | Optional | External agencies may not have phones |
| `address` | Optional | Not all agencies have physical addresses |
| `description` | Optional | Optional descriptive field |
| `displayOrder` | Optional | UI-only field, defaults to end |
| `category` | Optional | Grouping is optional |
| `colorCode` | Optional | UI-only customization |
| `isSystemDefault` | Optional | Most agencies are not system defaults |
| `projectUsageCount` | Optional | Calculated field |
| `breakdownUsageCount` | Optional | Calculated field |
| `notes` | Optional | Additional info is optional |

---

## 6. ROLLBACK PLAN

### 6.1 Pre-Migration Checklist

1. **Backup Data**: Export all tables before migration
2. **Dry Run**: Execute migration with `dryRun: true` first
3. **Verify Mapping**: Review ID mapping output
4. **Test Environment**: Run on staging environment first

### 6.2 Rollback Script

```typescript
// convex/migrations/rollbackDepartmentsToAgencies.ts

export const rollbackMigration = mutation({
  args: {},
  handler: async (ctx) => {
    // This would restore from backup or reverse the changes
    // Implementation depends on backup strategy
  },
});
```

### 6.3 Rollback Triggers

- Migration errors exceed threshold
- Data integrity issues detected
- Application errors after migration
- User-reported issues

---

## 7. TESTING STRATEGY

### 7.1 Pre-Migration Tests

1. Count all records in departments table
2. Count all records with departmentId references
3. Verify all department codes are unique
4. Verify no orphaned references exist

### 7.2 Migration Tests

1. Run dry-run migration
2. Verify ID mapping completeness
3. Check for duplicate code conflicts
4. Verify type field transformation

### 7.3 Post-Migration Tests

1. Verify all departments migrated to agencies
2. Verify type field updated to "internal"
3. Verify all departmentId references updated
4. Verify hierarchy preserved (parentAgencyId)
5. Verify headUserId preserved
6. Test application queries work correctly
7. Verify search indexing works

---

## 8. IMPLEMENTATION TIMELINE

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| 1 | Schema updates | 1 day | None |
| 2 | Migration script development | 2 days | Phase 1 |
| 3 | Testing on staging | 2 days | Phase 2 |
| 4 | Production migration | 1 day | Phase 3 |
| 5 | Application code updates | 3 days | Phase 4 |
| 6 | Cleanup (remove departments) | 1 day | Phase 5 |
| **Total** | | **~10 days** | |

---

## 9. SUMMARY

This migration consolidates two overlapping concepts (Departments and Implementing Agencies) into a unified Implementing Agencies table with:

1. **Type field changed**: `"department"` → `"internal"`
2. **Added fields**: `parentAgencyId`, `headUserId` for feature parity
3. **Updated references**: All `departmentId` fields now reference `implementingAgencies`
4. **Preserved data**: All department data migrated with full history

The key challenge is handling the ID-to-CODE referencing difference, which is managed by maintaining ID-based references for all tables while keeping the string-based `implementingOffice` for projects/funds.
