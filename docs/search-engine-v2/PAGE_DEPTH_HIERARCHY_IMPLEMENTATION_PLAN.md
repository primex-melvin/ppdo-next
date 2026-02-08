# Search Engine V2 - Page Depth Hierarchy Implementation Plan

## 📋 Overview

**Goal**: Implement a 3-level page depth hierarchy for search results to accurately reflect the application's navigation structure.

**Current State**: All entity types are mapped to 1st page.

**Target State**:
- **1st page**: Budget items, 20% DF, Trust Funds, SEF, SHF
- **2nd page**: Projects, breakdown items  
- **3rd page**: Govt project breakdowns

---

## 🎯 Requirements Analysis

### Understanding the Navigation Hierarchy

Based on the application routing structure:

```
1st PAGE (List Views)
├── /dashboard/project/[year] - Budget Items List
├── /dashboard/20_percent_df/[year] - 20% DF List
├── /dashboard/trust-funds/[year] - Trust Funds List
├── /dashboard/special-education-funds/[year] - SEF List
└── /dashboard/special-health-funds/[year] - SHF List

2nd PAGE (Detail Views)
├── /dashboard/project/[year]/[particularId] - Project Detail
├── /dashboard/20_percent_df/[year]/[slug] - 20% DF Detail
├── /dashboard/trust-funds/[year]/[slug] - Trust Fund Detail
├── /dashboard/special-education-funds/[year]/[slug] - SEF Detail
└── /dashboard/special-health-funds/[year]/[slug] - SHF Detail

3rd PAGE (Breakdown Views)
└── /dashboard/project/[year]/[particularId]/[breakdownId] - Govt Project Breakdown
```

### The Challenge

Currently, the search index only has ONE entity type per fund type:
- `project` - for all project-related items
- `twentyPercentDF` - for all 20% DF items
- `trustFund` - for all trust fund items
- `specialEducationFund` - for all SEF items
- `specialHealthFund` - for all SHF items

**Problem**: Budget items and Projects are both stored as `project` entity type, but they exist at different page levels (1st vs 2nd).

**Solution**: Need to distinguish between:
1. Budget Items (parent/container) - 1st page
2. Projects (child items) - 2nd page
3. Project Breakdowns (grandchild items) - 3rd page

---

## 🏗️ Architecture Design

### Option A: Add New Entity Types (RECOMMENDED)

Create new entity types to represent items at different hierarchy levels:

```typescript
// Current entity types
export type EntityType =
  | "project"           // Budget Items (1st page) - RENAME to "budgetItem"
  | "twentyPercentDF"   // 20% DF (1st page) - KEEP
  | "trustFund"         // Trust Funds (1st page) - KEEP
  | "specialEducationFund"  // SEF (1st page) - KEEP
  | "specialHealthFund"     // SHF (1st page) - KEEP
  | "department"
  | "agency"
  | "user";

// NEW entity types to add
  | "budgetItem"        // Budget Items (1st page) - WAS "project"
  | "projectItem"       // Project details (2nd page)
  | "projectBreakdown"  // Project breakdowns (3rd page)
  | "twentyPercentDFItem"      // 20% DF details (2nd page)
  | "trustFundItem"            // Trust Fund details (2nd page)
  | "specialEducationFundItem" // SEF details (2nd page)
  | "specialHealthFundItem"    // SHF details (2nd page)
```

**Page Depth Mapping:**
```typescript
export const ENTITY_PAGE_DEPTHS: Record<EntityType, number> = {
  // 1st page - List/Container views
  budgetItem: 1,
  twentyPercentDF: 1,
  trustFund: 1,
  specialEducationFund: 1,
  specialHealthFund: 1,
  department: 1,
  agency: 1,
  user: 1,
  
  // 2nd page - Detail views
  projectItem: 2,
  twentyPercentDFItem: 2,
  trustFundItem: 2,
  specialEducationFundItem: 2,
  specialHealthFundItem: 2,
  
  // 3rd page - Breakdown views
  projectBreakdown: 3,
};
```

---

## 📁 Phase 1: Schema & Type Updates

### 1.1 Update EntityType Definition
**File**: `convex/search/types.ts`

```typescript
export type EntityType =
  // 1st page - List/Container views
  | "budgetItem"        // WAS: "project" - Budget Items list
  | "twentyPercentDF"   // 20% Development Fund list
  | "trustFund"         // Trust Funds list
  | "specialEducationFund"  // SEF list
  | "specialHealthFund"     // SHF list
  | "department"
  | "agency"
  | "user"
  // 2nd page - Detail views
  | "projectItem"              // Project details
  | "twentyPercentDFItem"      // 20% DF details
  | "trustFundItem"            // Trust Fund details
  | "specialEducationFundItem" // SEF details
  | "specialHealthFundItem"    // SHF details
  // 3rd page - Breakdown views
  | "projectBreakdown";        // Project breakdowns
```

### 1.2 Update Page Depth Mapping
**File**: `convex/search/types.ts`

```typescript
export const ENTITY_PAGE_DEPTHS: Record<EntityType, number> = {
  // 1st page - List/Container views
  budgetItem: 1,
  twentyPercentDF: 1,
  trustFund: 1,
  specialEducationFund: 1,
  specialHealthFund: 1,
  department: 1,
  agency: 1,
  user: 1,
  
  // 2nd page - Detail views
  projectItem: 2,
  twentyPercentDFItem: 2,
  trustFundItem: 2,
  specialEducationFundItem: 2,
  specialHealthFundItem: 2,
  
  // 3rd page - Breakdown views
  projectBreakdown: 3,
};
```

### 1.3 Update Search Index Schema
**File**: `convex/schema/searchIndex.ts`

Update the `entityType` union to include new types:

```typescript
entityType: v.union(
  // 1st page
  v.literal("budgetItem"),
  v.literal("twentyPercentDF"),
  v.literal("trustFund"),
  v.literal("specialEducationFund"),
  v.literal("specialHealthFund"),
  v.literal("department"),
  v.literal("agency"),
  v.literal("user"),
  // 2nd page
  v.literal("projectItem"),
  v.literal("twentyPercentDFItem"),
  v.literal("trustFundItem"),
  v.literal("specialEducationFundItem"),
  v.literal("specialHealthFundItem"),
  // 3rd page
  v.literal("projectBreakdown"),
),
```

### 1.4 Update Entity Type Labels
**File**: `convex/search/types.ts`

```typescript
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  // 1st page
  budgetItem: "Budget Item",
  twentyPercentDF: "20% Development Fund",
  trustFund: "Trust Fund",
  specialEducationFund: "Special Education Fund",
  specialHealthFund: "Special Health Fund",
  department: "Department",
  agency: "Agency",
  user: "User",
  // 2nd page
  projectItem: "Project",
  twentyPercentDFItem: "20% DF",
  trustFundItem: "Trust Fund",
  specialEducationFundItem: "Special Education Fund",
  specialHealthFundItem: "Special Health Fund",
  // 3rd page
  projectBreakdown: "Project Breakdown",
};
```

### 1.5 Update Search API Mutation Args
**File**: `convex/search/index.ts`

Update `indexEntityMutation` args to include new entity types:

```typescript
export const indexEntityMutation = mutation({
  args: {
    entityType: v.union(
      // 1st page
      v.literal("budgetItem"),
      v.literal("twentyPercentDF"),
      v.literal("trustFund"),
      v.literal("specialEducationFund"),
      v.literal("specialHealthFund"),
      v.literal("department"),
      v.literal("agency"),
      v.literal("user"),
      // 2nd page
      v.literal("projectItem"),
      v.literal("twentyPercentDFItem"),
      v.literal("trustFundItem"),
      v.literal("specialEducationFundItem"),
      v.literal("specialHealthFundItem"),
      // 3rd page
      v.literal("projectBreakdown"),
    ),
    // ... rest of args
  },
  // ...
});
```

---

## 📁 Phase 2: Update Indexing Logic

### 2.1 Identify Where Items Are Indexed

Need to examine and update ALL places where entities are indexed:

1. **Budget Items** (1st page) - `convex/budgetItems.ts`
2. **Projects** (2nd page) - `convex/projects.ts`
3. **Project Breakdowns** (3rd page) - `convex/projectBreakdowns.ts`
4. **20% DF** - `convex/twentyPercentDF.ts`
5. **20% DF Breakdowns** - `convex/twentyPercentDFBreakdowns.ts`
6. **Trust Funds** - `convex/trustFunds.ts`
7. **Trust Fund Breakdowns** - `convex/trustFundBreakdowns.ts`
8. **SEF** - `convex/specialEducationFunds.ts`
9. **SEF Breakdowns** - `convex/specialEducationFundBreakdowns.ts`
10. **SHF** - `convex/specialHealthFunds.ts`
11. **SHF Breakdowns** - `convex/specialHealthFundBreakdowns.ts`
12. **Departments** - `convex/departments.ts`
13. **Agencies** - `convex/implementingAgencies.ts`
14. **Users** - `convex/userManagement.ts`

### 2.2 Update Budget Items Indexing (1st page)
**File**: `convex/budgetItems.ts`

Budget items should be indexed as `budgetItem` (1st page):

```typescript
await indexEntity(ctx, {
  entityType: "budgetItem", // WAS: "project"
  entityId: budgetItem._id,
  primaryText: budgetItem.description,
  // ...
});
```

### 2.3 Update Projects Indexing (2nd page)
**File**: `convex/projects.ts`

Projects should be indexed as `projectItem` (2nd page):

```typescript
await indexEntity(ctx, {
  entityType: "projectItem", // WAS: "project"
  entityId: project._id,
  primaryText: project.particulars,
  // ...
});
```

### 2.4 Update Project Breakdowns Indexing (3rd page)
**File**: `convex/projectBreakdowns.ts`

Breakdowns should be indexed as `projectBreakdown` (3rd page):

```typescript
await indexEntity(ctx, {
  entityType: "projectBreakdown", // NEW
  entityId: breakdown._id,
  primaryText: breakdown.description,
  // ...
});
```

### 2.5 Update Fund Indexing
**Files**: Various fund files

For funds, need to distinguish between:
- Fund container (1st page) - `trustFund`, `specialEducationFund`, etc.
- Fund items/details (2nd page) - `trustFundItem`, `specialEducationFundItem`, etc.

Example for Trust Funds:
```typescript
// In trustFunds.ts - main fund entries (1st page)
await indexEntity(ctx, {
  entityType: "trustFund",
  entityId: trustFund._id,
  primaryText: trustFund.projectTitle,
  // ...
});

// In trustFundBreakdowns.ts - breakdown items (2nd page)
await indexEntity(ctx, {
  entityType: "trustFundItem", // NEW
  entityId: breakdown._id,
  primaryText: breakdown.description,
  // ...
});
```

### 2.6 Update Reindex Functions
**File**: `convex/search/reindex.ts`

Update all reindex functions to use correct entity types:

```typescript
// Budget Items (1st page)
await indexEntity(ctx, {
  entityType: "budgetItem",
  // ...
});

// Projects (2nd page)
await indexEntity(ctx, {
  entityType: "projectItem",
  // ...
});
```

---

## 📁 Phase 3: Frontend Updates

### 3.1 Update Category Sidebar Labels
**File**: `components/search/CategorySidebar.tsx`

Update category labels to reflect new entity types:

```typescript
const categories: CategoryConfig[] = [
  {
    type: "budgetItem",
    label: "Budget Items",
    // ...
  },
  {
    type: "projectItem",
    label: "Projects (11 plans)",
    // ...
  },
  {
    type: "projectBreakdown",
    label: "Project Breakdowns",
    // ...
  },
  // ... other categories
];
```

### 3.2 Update SearchResultCard
**File**: `components/search/SearchResultCard.tsx`

Update `getEntityTypeLabel` to handle new entity types:

```typescript
function getEntityTypeLabel(entityType: EntityType): string {
  const labels: Record<EntityType, string> = {
    // 1st page
    budgetItem: "Budget Item",
    twentyPercentDF: "20% DF",
    trustFund: "Trust Fund",
    specialEducationFund: "Special Education Fund",
    specialHealthFund: "Special Health Fund",
    department: "Department",
    agency: "Agency",
    user: "User",
    // 2nd page
    projectItem: "Project",
    twentyPercentDFItem: "20% DF",
    trustFundItem: "Trust Fund",
    specialEducationFundItem: "Special Education Fund",
    specialHealthFundItem: "Special Health Fund",
    // 3rd page
    projectBreakdown: "Project Breakdown",
  };
  return labels[entityType] || entityType;
}
```

Update page depth display logic:

```typescript
// Only show page depth for items that have hierarchy
const ENTITY_TYPES_WITH_PAGE_DEPTH: EntityType[] = [
  // 1st page
  "budgetItem",
  "twentyPercentDF",
  "trustFund",
  "specialEducationFund",
  "specialHealthFund",
  // 2nd page
  "projectItem",
  "twentyPercentDFItem",
  "trustFundItem",
  "specialEducationFundItem",
  "specialHealthFundItem",
  // 3rd page
  "projectBreakdown",
];
```

---

## 📁 Phase 4: Data Migration

### 4.1 Clear and Rebuild Index

After updating all indexing logic, must perform full reindex:

1. Go to `/admin/search`
2. Click "Clear Index"
3. Click "Reindex All"

This will populate the search index with correct entity types and page depths.

### 4.2 Verification Steps

Verify page depths are correct:
- Budget items show "Found in 1st page"
- Projects show "Found in 2nd page"
- Project breakdowns show "Found in 3rd page"

---

## 📁 Phase 5: Testing Checklist

### Backend Tests
- [ ] Budget items indexed as `budgetItem` (1st page)
- [ ] Projects indexed as `projectItem` (2nd page)
- [ ] Project breakdowns indexed as `projectBreakdown` (3rd page)
- [ ] 20% DF indexed as `twentyPercentDF` (1st page) or `twentyPercentDFItem` (2nd page)
- [ ] Trust Funds indexed correctly by level
- [ ] SEF/SHF indexed correctly by level
- [ ] Reindexing works correctly

### Frontend Tests
- [ ] Category sidebar shows correct labels
- [ ] Search results show correct page depth text
- [ ] Page depth only shown for hierarchical items (not dept/agency/user)
- [ ] Card styling correct for all entity types

### Integration Tests
- [ ] Search works correctly after reindex
- [ ] Filtering by category works
- [ ] Navigation from search results works

---

## ⚠️ Critical Considerations

### Breaking Changes
This is a **BREAKING CHANGE** that requires:
1. Schema migration (new entity types)
2. Full reindex of all data
3. Frontend updates for new type names

### Data Consistency
During migration:
- Old index entries with `entityType: "project"` will need to be cleared
- New entries will use `budgetItem`, `projectItem`, `projectBreakdown`

### Rollback Plan
If issues occur:
1. Revert code changes
2. Clear search index
3. Reindex with old logic

---

## 📁 File Structure Changes

```
convex/
├── schema/
│   └── searchIndex.ts          # Update entityType union
├── search/
│   ├── types.ts                # Update EntityType, ENTITY_PAGE_DEPTHS, labels
│   ├── index.ts                # Update indexEntityMutation args
│   └── reindex.ts              # Update all reindex functions
├── budgetItems.ts              # Update indexing calls
├── projects.ts                 # Update indexing calls
├── projectBreakdowns.ts        # Update indexing calls (NEW if exists)
├── twentyPercentDF.ts          # Update indexing calls
├── twentyPercentDFBreakdowns.ts # Update indexing calls
├── trustFunds.ts               # Update indexing calls
├── trustFundBreakdowns.ts      # Update indexing calls
├── specialEducationFunds.ts    # Update indexing calls
├── specialEducationFundBreakdowns.ts # Update indexing calls
├── specialHealthFunds.ts       # Update indexing calls
├── specialHealthFundBreakdowns.ts # Update indexing calls
├── departments.ts              # No change (stays 1st page)
├── implementingAgencies.ts     # No change (stays 1st page)
└── userManagement.ts           # No change (stays 1st page)

components/
├── search/
│   ├── CategorySidebar.tsx     # Update category configs
│   └── SearchResultCard.tsx    # Update labels and page depth logic
└── layout/
    └── sidebar/
        └── config.tsx          # May need updates
```

---

## ⏱️ Estimated Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Schema & type updates | 45 min |
| 2 | Update all indexing logic | 3 hours |
| 3 | Frontend updates | 1 hour |
| 4 | Data migration | 30 min |
| 5 | Testing | 1.5 hours |
| **Total** | | **~6.5 hours** |

---

## ✅ Success Criteria

1. ✅ Budget items show "Found in 1st page"
2. ✅ Projects show "Found in 2nd page"
3. ✅ Project breakdowns show "Found in 3rd page"
4. ✅ 20% DF items show correct page depth (1st or 2nd)
5. ✅ Trust Funds show correct page depth
6. ✅ SEF/SHF show correct page depth
7. ✅ Departments, Agencies, Users show NO page depth
8. ✅ All search functionality works correctly
9. ✅ Category filtering works

---

## 🚦 Implementation Order

1. **Schema updates first** (convex/schema/searchIndex.ts)
2. **Type definitions** (convex/search/types.ts)
3. **Update indexing calls** (all convex/*.ts files)
4. **Update reindex functions** (convex/search/reindex.ts)
5. **Frontend updates** (components/search/*.tsx)
6. **Build and test**
7. **Deploy and reindex**

---

**Status**: Ready for implementation
**Next Step**: Await GO signal from product owner
**Assigned to**: Next AI agent
**Priority**: Medium (enhancement)
**Risk Level**: Medium (requires full reindex)
