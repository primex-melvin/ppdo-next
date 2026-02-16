# Departments → Implementing Agencies Migration Plan

## Executive Summary

This document outlines the safe migration path from the dual "Departments" + "Implementing Agencies" system to a unified "Implementing Agencies" system with "internal"/"external" classification.

**Current State:** 81+ TypeScript errors after schema changes
**Goal:** Zero-downtime migration with full rollback capability
**Timeline:** 1-2 weeks (phased approach)

---

## Architecture Decision

### The Problem with Current Approach
We tried to change everything at once:
- ✅ Schema updated (new fields added)
- ✅ References changed (departmentId → implementingAgencies)
- ❌ 81 TypeScript errors from breaking changes
- ❌ Codebase won't compile

### The Solution: Expand-Contract Pattern

```
Week 1: EXPAND (Add new, keep old working)
Week 2: MIGRATE (Data migration, dual-write)
Week 3: CONTRACT (Switch to new, deprecate old)
Week 4: CLEANUP (Remove old)
```

---

## Phase 1: EXPAND (Current Priority)

### Goal
Make the code COMPILE and RUN while supporting BOTH systems simultaneously.

### Tasks

#### 1.1 Restore Backward Compatibility (URGENT)

**File: `convex/schema/implementingAgencies.ts`**
```typescript
// Add back the departmentId field temporarily (lines 62-67)
/**
 * DEPRECATED: Legacy link to departments table
 * Only used during migration period
 * @deprecated Will be removed after migration
 */
departmentId: v.optional(v.id("departments")),
```

**File: `convex/schema.ts`**
- Keep `departmentTables` imported (already done)
- Keep `...departmentTables` in schema export (already done)

#### 1.2 Fix Critical TypeScript Errors

**Category A: Field Name Changes**
Files referencing `agency.name` → change to `agency.fullName`:
- `convex/accessRequests.ts` (lines 33, 343, 433)
- `convex/breakdownSharedAccess.ts` (line 189)
- `convex/budgetAccess.ts` (line 87)
- `convex/budgetParticularAccess.ts` (line 139)
- `convex/budgetSharedAccess.ts` (line 153)
- `convex/lib/govtProjectActivityLogger.ts` (line 56)
- `convex/lib/specialEducationFundBreakdownActivityLogger.ts` (line 83)
- `convex/lib/specialHealthFundBreakdownActivityLogger.ts` (line 76)
- `convex/lib/trustFundBreakdownActivityLogger.ts` (line 76)
- `convex/specialEducationFundAccess.ts` (line 85)
- `convex/specialEducationFundSharedAccess.ts` (line 153)
- `convex/specialHealthFundAccess.ts` (line 85)
- `convex/specialHealthFundSharedAccess.ts` (line 153)
- `convex/trustFundAccess.ts` (line 85)
- `convex/trustFundSharedAccess.ts` (line 153)

**Pattern:**
```typescript
// Before:
const dept = await ctx.db.get(user.departmentId);
const deptName = dept?.name;

// After:
const agency = await ctx.db.get(user.departmentId);
const agencyName = agency?.fullName;
```

**Category B: Removed departmentId from Agency Type**
Files accessing `agency.departmentId`:
- `convex/dashboard.ts` (line 536)
- `convex/projects.ts` (lines 463, 648)
- `convex/search/reindex.ts` (line 725)
- `convex/specialEducationFunds.ts` (lines 156, 279)
- `convex/specialHealthFunds.ts` (lines 156, 279)
- `convex/trustFunds.ts` (lines 156, 279)

**Solution:** These files were linking agencies back to departments. Since agencies ARE now departments (for internal type), this circular reference is no longer needed. 

**Fix:** Remove the departmentId lookup and use the agency directly:
```typescript
// Before:
const agency = await ctx.db.get(agencyId);
const deptId = agency.departmentId;
const dept = await ctx.db.get(deptId);

// After:
const agency = await ctx.db.get(agencyId);
// Use agency directly - it's now the department
```

**Category C: Activity Logger Type Mismatches**
Files: Various activity loggers in `convex/lib/`

**Issue:** `performedByDepartmentId` expects `Id<"departments">` but user now has `Id<"implementingAgencies">`

**Solution:** Update the activity log schema to use `Id<"implementingAgencies">`:
```typescript
// In activity logger schema files
performedByDepartmentId: v.optional(v.id("implementingAgencies")),
```

**Category D: Seed Data Type Mismatches**
Files: `convex/seedData.ts`, `convex/init/seedMockData.ts`, `convex/init/seedLocalData.ts`

**Issue:** These insert records with `departmentId: Id<"departments">` but schema expects `Id<"implementingAgencies">`

**Solution:** After data migration, update seed scripts to use agency IDs instead of department IDs.

#### 1.3 Create Dual-Write Layer

**File: `convex/departments.ts`**

Modify create/update mutations to also create/update implementing agencies:

```typescript
// In departments.ts create mutation
const departmentId = await ctx.db.insert("departments", { ... });

// Also create as implementing agency
await ctx.db.insert("implementingAgencies", {
  code: args.code,
  fullName: args.name,
  type: "internal",
  description: args.description,
  headUserId: args.headUserId,
  contactEmail: args.email,
  contactPhone: args.phone,
  address: args.location,
  isActive: args.isActive,
  displayOrder: args.displayOrder,
  createdBy: userId,
  createdAt: now,
  updatedAt: now,
});
```

### Verification for Phase 1
- [ ] `npx convex codegen` passes without errors
- [ ] App compiles and runs
- [ ] Can create departments (creates both department + agency)
- [ ] Can view departments list
- [ ] Can view agencies list

---

## Phase 2: MIGRATE (After Phase 1 Complete)

### Goal
Migrate existing data from departments to agencies.

### Prerequisites
- Phase 1 complete (code compiles and runs)
- Database backup created
- Migration script tested in staging

### Tasks

#### 2.1 Run Migration Preview
```typescript
// In Convex dashboard or via API call
api.migrations.migrateDepartmentsToAgencies.getMigrationPreview()
```

Review:
- Number of departments to migrate
- Any code conflicts
- User/project counts

#### 2.2 Dry Run Migration
```typescript
api.migrations.migrateDepartmentsToAgencies({
  dryRun: true
})
```

Verify no errors in dry run.

#### 2.3 Execute Migration
```typescript
api.migrations.migrateDepartmentsToAgencies({
  dryRun: false
})
```

#### 2.4 Verify Migration
```typescript
api.migrations.migrateDepartmentsToAgencies.verifyMigration()
```

### Rollback Plan
If migration fails:
1. Restore from backup
2. Or run rollback script (to be created)

---

## Phase 3: CONTRACT (Switch to New System)

### Goal
Switch all reads to use implementingAgencies, deprecate departments.

### Tasks

#### 3.1 Update UI Components (Priority Order)

**High Priority:**
1. User management (department assignment)
2. Project forms (implementing office selection)
3. Dashboard filters

**Medium Priority:**
4. Analytics components
5. Search components

**Low Priority:**
6. Settings pages
7. Profile pages

#### 3.2 Update Queries

Change all `api.departments.*` calls to `api.implementingAgencies.*` with appropriate filters:

```typescript
// Before:
const departments = await api.departments.list();

// After:
const internalAgencies = await api.implementingAgencies.list({ 
  type: "internal" 
});
```

#### 3.3 Update Types

Update TypeScript interfaces:
- `Department` → `ImplementingAgency` (for internal agencies)
- Add `type: "internal" | "external"` discriminant

---

## Phase 4: CLEANUP (Final)

### Goal
Remove old code and complete migration.

### Tasks

#### 4.1 Remove departments.ts
- Delete `convex/departments.ts`
- Remove from `convex/schema.ts`

#### 4.2 Remove departments table
- Comment out or remove `convex/schema/departments.ts`
- Remove from schema export

#### 4.3 Clean up deprecated fields
- Remove `departmentId` from implementingAgencies (after confirming no code uses it)

#### 4.4 Final Verification
- Full test suite passes
- No references to "departments" in code (except historical references)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data Loss | Full backup before migration; dry-run testing |
| Downtime | Expand-contract pattern ensures zero downtime |
| Partial Failure | Each phase is independently reversible |
| User Impact | Gradual UI updates; feature flags if needed |
| Team Coordination | Clear phase boundaries; parallel work possible |

---

## Quick Reference: Type Changes

| Old | New |
|-----|-----|
| `Id<"departments">` | `Id<"implementingAgencies">` |
| `department.name` | `agency.fullName` |
| `department.code` | `agency.code` |
| `department.parentDepartmentId` | `agency.parentAgencyId` |
| `department.headUserId` | `agency.headUserId` |
| `department.email` | `agency.contactEmail` |
| `department.phone` | `agency.contactPhone` |
| `department.location` | `agency.address` |
| Type `"department"` | Type `"internal"` |
| `api.departments.list()` | `api.implementingAgencies.list({ type: "internal" })` |

---

## Team Assignments

| Phase | Owner | Estimated Time |
|-------|-------|----------------|
| 1.1 Restore Compatibility | Backend Lead | 1 day |
| 1.2 Fix TypeScript Errors | Full Team | 2-3 days |
| 1.3 Dual-Write Layer | Backend Lead | 1 day |
| 2. Data Migration | DevOps + Backend | 1 day |
| 3. UI Updates | Frontend Team | 3-5 days |
| 4. Cleanup | Backend Lead | 1 day |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-16 | Use Expand-Contract pattern | Safest approach for production data |
| 2026-02-16 | Keep departments table during transition | Enables rollback if needed |
| 2026-02-16 | Rename "department" type to "internal" | Clearer semantic meaning |
| 2026-02-16 | Map name→fullName, email→contactEmail, etc. | Aligns with agency domain language |

---

## Next Steps (Immediate)

1. **Decision:** Approve this migration plan
2. **Action:** Assign Phase 1.1 to backend lead
3. **Action:** Create feature branch for migration work
4. **Action:** Set up staging environment for testing
5. **Schedule:** Migration execution window (off-peak hours)

---

*Document Version: 1.0*
*Last Updated: 2026-02-16*
