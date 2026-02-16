# Schema Changes Summary: Departments → Implementing Agencies Migration

## Overview

This document summarizes all schema file changes required to complete the migration from Departments to Implementing Agencies.

---

## Files to Modify

### 1. `convex/schema/implementingAgencies.ts` ✅ (UPDATED)

**Changes:**
- Changed type union: `"department" | "external"` → `"internal" | "external"`
- Added `parentAgencyId: v.optional(v.id("implementingAgencies"))` (hierarchical structure)
- Added `headUserId: v.optional(v.id("users"))` (department leadership)
- Removed `departmentId` field (no longer needed - departments ARE agencies now)
- Added indexes: `parentAgencyId`, `headUserId`

### 2. `convex/schema/departments.ts` ❌ (REMOVE AFTER MIGRATION)

This file should be removed after successful migration.

### 3. `convex/schema/users.ts`

**Change:**
```typescript
// FROM:
departmentId: v.optional(v.id("departments")),

// TO:
departmentId: v.optional(v.id("implementingAgencies")),
```

**Indexes:** Update index references (they use field names, so no change needed).

### 4. `convex/schema/projects.ts`

**Change:**
```typescript
// FROM:
departmentId: v.optional(v.id("departments")),

// TO:
departmentId: v.optional(v.id("implementingAgencies")),
```

### 5. `convex/schema/budgets.ts`

**Change:**
```typescript
// FROM:
departmentId: v.optional(v.id("departments")),

// TO:
departmentId: v.optional(v.id("implementingAgencies")),
```

### 6. `convex/schema/twentyPercentDF.ts`

**Change:**
```typescript
// FROM:
departmentId: v.optional(v.id("departments")),

// TO:
departmentId: v.optional(v.id("implementingAgencies")),
```

### 7. `convex/schema/trustFunds.ts`

**Change:**
```typescript
// FROM:
departmentId: v.optional(v.id("departments")),

// TO:
departmentId: v.optional(v.id("implementingAgencies")),
```

### 8. `convex/schema/specialHealthFunds.ts`

**Change:**
```typescript
// FROM:
departmentId: v.optional(v.id("departments")),

// TO:
departmentId: v.optional(v.id("implementingAgencies")),
```

### 9. `convex/schema/specialEducationFunds.ts`

**Change:**
```typescript
// FROM:
departmentId: v.optional(v.id("departments")),

// TO:
departmentId: v.optional(v.id("implementingAgencies")),
```

### 10. `convex/schema/accessRequests.ts`

**Change:**
```typescript
// FROM:
departmentId: v.optional(v.id("departments")),

// TO:
departmentId: v.optional(v.id("implementingAgencies")),
```

### 11. `convex/schema/budgetItemActivities.ts`

**Change:**
```typescript
// FROM:
departmentId: v.optional(v.id("departments")),

// TO:
departmentId: v.optional(v.id("implementingAgencies")),
```

### 12. `convex/schema/searchIndex.ts`

**No change needed** - departmentId is already stored as string for polymorphic use.

However, update the entityType union if needed:
```typescript
// Consider adding:
entityType: v.union(
  // ... existing types
  v.literal("internal_agency"),  // Was "department"
  v.literal("external_agency"),  // Was "agency"
  // ...
),
```

### 13. `convex/schema.ts`

**Change:**
```typescript
// REMOVE after migration:
import { departmentTables } from "./schema/departments";

// FROM:
export default defineSchema({
  ...departmentTables,
  ...
});

// TO:
export default defineSchema({
  // ...departmentTables,  // REMOVED
  ...
});
```

---

## Migration Script Files

### New Files:

1. **`convex/migrations/migrateDepartmentsToAgencies.ts`** ✅ (CREATED)
   - Main migration script
   - Includes `getMigrationPreview`, `migrateDepartmentsToAgencies`, `verifyMigration`

### Files to Update After Migration:

1. **`convex/departments.ts`** - Update or remove
   - Option A: Remove file entirely (recommended)
   - Option B: Keep as wrapper that calls implementingAgencies queries with `type: "internal"` filter

2. **`convex/implementingAgencies.ts`** - Update queries/mutations
   - Update `list` query to handle `type: "internal"` instead of `"department"`
   - Add `getHierarchy` query using `parentAgencyId`
   - Update `create` mutation to remove `departmentId` parameter
   - Update any code that references `agency.type === "department"`

3. **`convex/search/index.ts`** - Update search indexing
   - Change entity type from `"department"` to `"internal_agency"`

---

## Type Safety Updates

### Generated Types

After schema changes, run:
```bash
npx convex dev
```

This will regenerate `convex/_generated/dataModel.d.ts` with updated types.

### Manual Type Updates

Check for any manual type definitions that reference `Id<"departments">`:

```bash
grep -r "Id<\"departments\">" convex/
grep -r "id(\"departments\")" convex/
```

Update all occurrences to `Id<"implementingAgencies">` or `id("implementingAgencies")`.

---

## Application Code Updates

### Components to Review:

1. **Department Management UI**
   - `app/admin/departments/**`
   - `components/departments/**`
   - Update to use `implementingAgencies` queries
   - Update type filters from `"department"` to `"internal"`

2. **User Management**
   - Update department selection dropdowns
   - Use `type: "internal"` filter for internal departments only

3. **Project Forms**
   - Office/Agency selection already uses implementing agencies
   - Department filter needs updating

4. **Search/Filtering**
   - Update entity type filters
   - Update department-based filtering

---

## Execution Order

### Phase 1: Schema Preparation
1. ✅ Create migration script
2. Update `convex/schema/implementingAgencies.ts`
3. Update all referencing schema files
4. Run `npx convex dev` to generate types

### Phase 2: Data Migration
5. Run `getMigrationPreview` to assess impact
6. Run `migrateDepartmentsToAgencies` with `dryRun: true`
7. Review results and fix any issues
8. Run `migrateDepartmentsToAgencies` with `dryRun: false`
9. Run `verifyMigration` to confirm success

### Phase 3: Application Updates
10. Update `convex/departments.ts` (or remove)
11. Update `convex/implementingAgencies.ts`
12. Update all components referencing departments
13. Update search indexing

### Phase 4: Cleanup
14. Remove `convex/schema/departments.ts`
15. Remove `convex/departments.ts`
16. Update `convex/schema.ts` to remove departmentTables import
17. Run final verification

---

## Rollback Plan

If issues occur:

1. **Before Cleanup**: Can partially rollback using `rollbackReferences` mutation
2. **After Cleanup**: Requires database restore from backup
3. **Always**: Maintain full database backup before migration

---

## Verification Checklist

- [ ] All departments migrated to agencies
- [ ] Type field changed from "department" to "internal"
- [ ] parentAgencyId set for hierarchical structure
- [ ] headUserId preserved from departments
- [ ] All departmentId references updated
- [ ] Application queries work correctly
- [ ] Search indexing functional
- [ ] No errors in console
- [ ] User testing completed
