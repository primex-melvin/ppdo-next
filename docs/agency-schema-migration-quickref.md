# Agency Schema Migration - Quick Reference

## Schema Files

| File | Purpose |
|------|---------|
| `convex/schema/implementingAgenciesMerged.ts` | **NEW** Merged schema (ready to use) |
| `convex/schema/implementingAgencies.ts` | **OLD** Current agencies schema (to be replaced) |
| `convex/schema/departments.ts` | **OLD** Current departments schema (to be deprecated) |
| `convex/migrations/migrateDepartmentsToAgencies.ts` | Migration script template |
| `docs/merged-agency-schema-design.md` | Full design document |

---

## Field Changes Summary

### Name Field Consolidation
```
OLD agencies.fullName  ──┐
                         ├─→ NEW name (string, required)
OLD departments.name   ──┘
```

### Type Values Changed
```
OLD "department"  ──→ NEW "internal"
OLD "external"    ──→ NEW "external" (unchanged)
```

### Contact/Hierarchy Fields
```
OLD departments.parentDepartmentId  ──→ NEW parentAgencyId (self-referential)
OLD departments.headUserId          ──→ NEW headUserId (unchanged)
OLD departments.phone               ──→ NEW contactPhone
OLD departments.email               ──→ NEW contactEmail (also kept as legacy email)
OLD departments.location            ──→ NEW location (legacy, use address instead)
```

---

## Complete Field Matrix

| Field | Dept Old | Agency Old | Agency New | Required? | Notes |
|-------|----------|------------|------------|-----------|-------|
| `code` | ✅ | ✅ | ✅ | Yes | Unique identifier |
| `name` | — | — | ✅ | Yes | Was `fullName` (agencies) or `name` (depts) |
| `fullName` | — | ✅ | — | — | **REMOVED** - use `name` |
| `type` | — | ✅ | ✅ | Yes | `"internal"` (was `"department"`) or `"external"` |
| `description` | ✅ | ✅ | ✅ | No | — |
| `parentAgencyId` | — | — | ✅ | No | Was `parentDepartmentId` |
| `parentDepartmentId` | ✅ | — | — | — | **REMOVED** - use `parentAgencyId` |
| `headUserId` | ✅ | — | ✅ | No | For internal agencies |
| `contactPerson` | — | ✅ | ✅ | No | For external agencies |
| `contactEmail` | — | ✅ | ✅ | No | — |
| `contactPhone` | — | ✅ | ✅ | No | Was `phone` in depts |
| `email` | ✅ | — | ✅ | No | **DEPRECATED** - use `contactEmail` |
| `phone` | ✅ | — | — | — | **REMOVED** - use `contactPhone` |
| `address` | — | ✅ | ✅ | No | — |
| `location` | ✅ | — | ✅ | No | **DEPRECATED** - use `address` |
| `displayOrder` | ✅ | ✅ | ✅ | No | — |
| `isActive` | ✅ | ✅ | ✅ | Yes | — |
| `isSystemDefault` | — | ✅ | ✅ | No | — |
| `category` | — | ✅ | ✅ | No | — |
| `colorCode` | — | ✅ | ✅ | No | — |
| `projectUsageCount` | — | ✅ | ✅ | No | Defaults to 0 |
| `breakdownUsageCount` | — | ✅ | ✅ | No | Defaults to 0 |
| `createdBy` | ✅ | ✅ | ✅ | Yes | — |
| `createdAt` | ✅ | ✅ | ✅ | Yes | — |
| `updatedAt` | ✅ | ✅ | ✅ | Yes | — |
| `updatedBy` | ✅ | ✅ | ✅ | No | — |
| `notes` | — | ✅ | ✅ | No | — |
| `legacyDepartmentId` | — | — | ✅ | No | **NEW** - for migration tracking |

---

## Indexes

### New Indexes (in merged schema)
| Index | Fields | Purpose |
|-------|--------|---------|
| `name` | `["name"]` | Name-based search |
| `parentAgencyId` | `["parentAgencyId"]` | Hierarchy queries |
| `headUserId` | `["headUserId"]` | Find agencies by head |
| `typeAndActive` | `["type", "isActive"]` | Filter internal/external |
| `legacyDepartmentId` | `["legacyDepartmentId"]` | Migration lookups |

### Kept Indexes (from old agencies)
- `code`, `type`, `isActive`, `displayOrder`, `category`
- `isActiveAndDisplayOrder`, `isSystemDefault`
- `projectUsageCount`, `breakdownUsageCount`
- `createdBy`, `createdAt`

### Kept Indexes (from old departments)
- `name` (renamed from old name index)
- `displayOrder`
- Plus all converted to self-referential `implementingAgencies`

---

## Migration Steps (In Order)

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 0: PREPARATION                                           │
│  • Backup database                                               │
│  • Review foreign key dependencies                               │
│  • Test migration in staging environment                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: SCHEMA UPDATE                                         │
│  • Deploy new implementingAgencies schema                        │
│  • Keep old departments table (for rollback)                     │
│  • Deploy foreign key reference updates to other tables          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: DATA MIGRATION                                        │
│  2.1: migrateDepartments → creates internal agencies             │
│  2.2: migrateExistingAgencies → updates type="department"        │
│  2.3: updateParentReferences → fixes hierarchy links             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: FOREIGN KEY UPDATES                                   │
│  • Update users.departmentId → implementingAgencyId              │
│  • Update budgetItems.departmentId → implementingAgencyId        │
│  • Update projects.departmentId → implementingAgencyId           │
│  • Update all other departmentId references                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: VALIDATION                                            │
│  • Run data integrity checks                                     │
│  • Verify all references resolved                                │
│  • Compare record counts                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5: DEPRECATION (Optional - can delay)                    │
│  • Mark departments table deprecated                             │
│  • Update application code to remove department queries          │
│  • Monitor for issues                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 6: CLEANUP (Optional - delay until confident)            │
│  • Remove departments table                                      │
│  • Remove legacyDepartmentId field                               │
│  • Remove deprecated fields (email, location)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Code Examples

### Query All Internal Agencies (Old: Departments)
```typescript
// Before
const departments = await ctx.db
  .query("departments")
  .withIndex("isActive", q => q.eq("isActive", true))
  .collect();

// After
const internalAgencies = await ctx.db
  .query("implementingAgencies")
  .withIndex("typeAndActive", q => 
    q.eq("type", "internal").eq("isActive", true)
  )
  .collect();
```

### Get Agency Hierarchy
```typescript
// Get children of an agency
const children = await ctx.db
  .query("implementingAgencies")
  .withIndex("parentAgencyId", q => q.eq("parentAgencyId", parentId))
  .collect();

// Get parent
const agency = await ctx.db.get(agencyId);
const parent = agency?.parentAgencyId 
  ? await ctx.db.get(agency.parentAgencyId) 
  : null;
```

### Create Internal Agency (New Department)
```typescript
await ctx.db.insert("implementingAgencies", {
  code: "FIN",
  name: "Finance Department",
  type: "internal",
  description: "Handles all financial matters",
  headUserId: userId,  // Internal agencies have headUserId
  contactEmail: "finance@example.com",
  contactPhone: "123-456-7890",
  parentAgencyId: null,  // Top-level department
  isActive: true,
  createdBy: userId,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

### Create External Agency
```typescript
await ctx.db.insert("implementingAgencies", {
  code: "EXT001",
  name: "Imperial Asia Construction",
  type: "external",
  description: "Construction contractor",
  contactPerson: "John Smith",  // External agencies have contactPerson
  contactEmail: "john@example.com",
  contactPhone: "098-765-4321",
  address: "123 Main St, City",
  isActive: true,
  createdBy: userId,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

---

## Validation Rules

| Rule | Level | Notes |
|------|-------|-------|
| `code` must be unique | DB/Application | Consider adding unique index |
| `type` ∈ {"internal", "external"} | DB (union type) | Enforced by Convex schema |
| `headUserId` only for internal | Application | Validate in mutations |
| `parentAgencyId` only for internal | Application | Validate in mutations |
| `contactPerson` for external | Application | Soft validation - allow null |
| `isSystemDefault` prevents delete | Application | Check before delete operation |

---

## Files Requiring Updates

### Schema Files
- ✅ `convex/schema/implementingAgencies.ts` - Replace with merged schema
- ⚠️ `convex/schema/users.ts` - Update `departmentId` references
- ⚠️ `convex/schema/budgets.ts` - Update `departmentId` references
- ⚠️ `convex/schema/projects.ts` - Update `departmentId` references
- ⚠️ Other schema files with `departmentId` references

### Query/Mutation Files
- ⚠️ `convex/departments.ts` - Migrate to use `implementingAgencies`
- ⚠️ `convex/implementingAgencies.ts` - Update for new schema
- ⚠️ `convex/users.ts` - Update department references
- ⚠️ `convex/budgetItems.ts` - Update department references
- ⚠️ `convex/projects.ts` - Update department references
- ⚠️ All other files referencing `departments` or `departmentId`

---

## Emergency Rollback

If migration fails, run the rollback mutation:

```typescript
// This removes all agencies created from department migration
await ctx.runMutation(
  "migrations/migrateDepartmentsToAgencies:rollbackMigration",
  { confirm: true }
);
```

**WARNING:** Rollback only works if no new references have been created to the migrated agencies.

---

*Quick Reference Version: 1.0*
*See full design doc: `docs/merged-agency-schema-design.md`*
