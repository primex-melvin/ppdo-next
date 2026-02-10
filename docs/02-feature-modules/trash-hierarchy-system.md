# Trash/Recycle Bin Hierarchy System Documentation

## Overview

This document describes the complete trash/recycle bin system for the PPDO project hierarchy, including all cascade behaviors, edge cases, and restoration logic.

## Table of Contents

1. [Hierarchy Structure](#hierarchy-structure)
2. [Entity Relationships](#entity-relationships)
3. [Move to Trash Scenarios](#move-to-trash-scenarios)
4. [Restore from Trash Scenarios](#restore-from-trash-scenarios)
5. [Edge Cases & Special Scenarios](#edge-cases--special-scenarios)
6. [Backend Implementation Guide](#backend-implementation-guide)
7. [Frontend Considerations](#frontend-considerations)

---

## Hierarchy Structure

```
Level 1: budgetItems (11 Project Plans / Budget)
    ├── isDeleted, deletedAt, deletedBy (Soft Delete Fields)
    ├── autoCalculateBudgetUtilized: boolean
    └── Child Link: projects.budgetItemId

Level 2: projects
    ├── isDeleted, deletedAt, deletedBy (Soft Delete Fields)
    ├── autoCalculateBudgetUtilized: boolean
    ├── Parent Link: budgetItemId (optional)
    └── Child Links: 
        ├── govtProjectBreakdowns.projectId
        └── inspections.projectId (NO SOFT DELETE)

Level 3: govtProjectBreakdowns
    ├── isDeleted, deletedAt, deletedBy (Soft Delete Fields - from baseBreakdownSchema)
    ├── Parent Link: projectId (optional)
    └── Children: None (leaf node for this hierarchy)

Level 4: inspections
    ├── NO SOFT DELETE FIELDS
    ├── Parent Link: projectId (required)
    └── Children: None
```

---

## Entity Relationships

### Relationship Types

| Parent | Child | Link Field | Cascade Delete | Notes |
|--------|-------|------------|----------------|-------|
| budgetItems | projects | `budgetItemId` | Yes | Parent deletion cascades to all children |
| projects | govtProjectBreakdowns | `projectId` | Yes | Parent deletion cascades to all children |
| projects | inspections | `projectId` | **No** | Inspections have no soft delete; independent lifecycle |

### Key Indexes for Trash Queries

```typescript
// budgetItems
.index("isDeleted", ["isDeleted"])
.index("budgetItemId", ["budgetItemId"]) // projects table
.index("budgetItemAndStatus", ["budgetItemId", "status"])

// projects
.index("isDeleted", ["isDeleted"])
.index("budgetItemId", ["budgetItemId"])
.index("projectId", ["projectId"]) // breakdowns table

// govtProjectBreakdowns
.index("isDeleted", ["isDeleted"])
.index("projectId", ["projectId"])
.index("projectIdAndStatus", ["projectId", "status"])
```

---

## Move to Trash Scenarios

### Scenario A: Grandparent Deletion (Top-Down Cascade)

**Action:** Move `budgetItem` to trash

**Behavior:** Full Cascade Down - All descendants marked as deleted

```
budgetItem (isDeleted: true)
└── projects (isDeleted: true) [CASCADE]
    ├── govtProjectBreakdowns (isDeleted: true) [CASCADE]
    └── inspections (UNCHANGED - no soft delete)
```

**Implementation Steps:**
1. Set `budgetItem.isDeleted = true`
2. Find all `projects` where `budgetItemId = targetId`
3. For each project:
   - Set `project.isDeleted = true`
   - Find all `govtProjectBreakdowns` where `projectId = project._id`
   - Set each `breakdown.isDeleted = true`
   - **Note:** Inspections are NOT affected

**Backend Logic:**
```typescript
// 1. Trash Budget Item
await ctx.db.patch(budgetItemId, {
  isDeleted: true,
  deletedAt: now,
  deletedBy: userId,
});

// 2. Cascade to Projects
const projects = await ctx.db
  .query("projects")
  .withIndex("budgetItemId", q => q.eq("budgetItemId", budgetItemId))
  .collect();

for (const project of projects) {
  await ctx.db.patch(project._id, {
    isDeleted: true,
    deletedAt: now,
    deletedBy: userId,
  });
  
  // 3. Cascade to Breakdowns
  const breakdowns = await ctx.db
    .query("govtProjectBreakdowns")
    .withIndex("projectId", q => q.eq("projectId", project._id))
    .collect();
    
  for (const breakdown of breakdowns) {
    await ctx.db.patch(breakdown._id, {
      isDeleted: true,
      deletedAt: now,
      deletedBy: userId,
    });
  }
}
```

---

### Scenario B: Parent Deletion (Mid-Level Cascade)

**Action:** Move `project` to trash

**Behavior:** Cascade to direct children only

```
budgetItem (UNCHANGED)
└── project (isDeleted: true) [TARGET]
    ├── govtProjectBreakdowns (isDeleted: true) [CASCADE]
    └── inspections (UNCHANGED - no soft delete)
```

**Impact on Parent:**
- Budget item metrics are recalculated (excludes deleted project values)
- Budget item itself remains active

**Implementation Steps:**
1. Set `project.isDeleted = true`
2. Find all `govtProjectBreakdowns` where `projectId = targetId`
3. Set each `breakdown.isDeleted = true`
4. Recalculate parent `budgetItem` metrics

**Backend Logic:**
```typescript
// 1. Trash Project
await ctx.db.patch(projectId, {
  isDeleted: true,
  deletedAt: now,
  deletedBy: userId,
});

// 2. Cascade to Breakdowns
const breakdowns = await ctx.db
  .query("govtProjectBreakdowns")
  .withIndex("projectId", q => q.eq("projectId", projectId))
  .collect();

for (const breakdown of breakdowns) {
  await ctx.db.patch(breakdown._id, {
    isDeleted: true,
    deletedAt: now,
    deletedBy: userId,
  });
}

// 3. Recalculate Parent Budget Item
if (project.budgetItemId) {
  await recalculateBudgetItemMetrics(ctx, project.budgetItemId, userId);
}
```

---

### Scenario C: Child Deletion (Leaf Node)

**Action:** Move `govtProjectBreakdown` to trash

**Behavior:** No cascade - only target affected

```
budgetItem (UNCHANGED)
└── project (UNCHANGED)
    ├── govtProjectBreakdown (isDeleted: true) [TARGET]
    └── other breakdowns (UNCHANGED)
```

**Impact on Parent:**
- Project metrics are recalculated (excludes deleted breakdown values)
- Budget item metrics are also recalculated (cascade up)

**Implementation Steps:**
1. Set `breakdown.isDeleted = true`
2. Recalculate parent `project` metrics
3. Recalculate grandparent `budgetItem` metrics

**Backend Logic:**
```typescript
// 1. Trash Breakdown
await ctx.db.patch(breakdownId, {
  isDeleted: true,
  deletedAt: now,
  deletedBy: userId,
});

// 2. Recalculate Parent Project
if (breakdown.projectId) {
  await recalculateProjectMetrics(ctx, breakdown.projectId, userId);
}
```

---

### Scenario D: Bulk Deletion (Multiple Items)

**Action:** Move multiple items to trash simultaneously

**Behavior:** Each item follows individual rules + optimization

**Considerations:**
- Duplicate parent recalculation should be batched
- Only unique parents should trigger recalculation
- Error handling per item (don't stop on single failure)

**Backend Pattern:**
```typescript
const affectedBudgetItems = new Set<Id<"budgetItems">>();
const affectedProjects = new Set<Id<"projects">>();

for (const id of ids) {
  try {
    // Move to trash logic
    // ... cascade down
    
    // Track affected parents
    if (item.budgetItemId) affectedBudgetItems.add(item.budgetItemId);
    if (item.projectId) affectedProjects.add(item.projectId);
  } catch (error) {
    // Log error but continue with other items
    errors.push({ id, error: error.message });
  }
}

// Batch recalculate unique parents
for (const budgetItemId of affectedBudgetItems) {
  await recalculateBudgetItemMetrics(ctx, budgetItemId, userId);
}

for (const projectId of affectedProjects) {
  await recalculateProjectMetrics(ctx, projectId, userId);
}
```

---

## Restore from Trash Scenarios

### Scenario E: Grandparent Restore (Top-Down Restoration)

**Action:** Restore `budgetItem` from trash

**Behavior:** Cascade restore - All descendants restored

```
budgetItem (isDeleted: false) [RESTORED]
└── projects (isDeleted: false) [CASCADE RESTORE]
    ├── govtProjectBreakdowns (isDeleted: false) [CASCADE RESTORE]
    └── inspections (UNCHANGED)
```

**Implementation Steps:**
1. Set `budgetItem.isDeleted = false`
2. Find all `projects` where `budgetItemId = targetId` AND `isDeleted = true`
3. For each project:
   - Set `project.isDeleted = false`
   - Find all `govtProjectBreakdowns` where `projectId = project._id` AND `isDeleted = true`
   - Set each `breakdown.isDeleted = false`
4. Recalculate budget item metrics

**Backend Logic:**
```typescript
// 1. Restore Budget Item
await ctx.db.patch(budgetItemId, {
  isDeleted: false,
  deletedAt: undefined,
  deletedBy: undefined,
});

// 2. Restore Projects (only if they were deleted via cascade)
const projects = await ctx.db
  .query("projects")
  .withIndex("budgetItemId", q => q.eq("budgetItemId", budgetItemId))
  .collect();

for (const project of projects) {
  if (project.isDeleted) {
    await ctx.db.patch(project._id, {
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
    });
    
    // 3. Restore Breakdowns
    const breakdowns = await ctx.db
      .query("govtProjectBreakdowns")
      .withIndex("projectId", q => q.eq("projectId", project._id))
      .collect();
      
    for (const breakdown of breakdowns) {
      if (breakdown.isDeleted) {
        await ctx.db.patch(breakdown._id, {
          isDeleted: false,
          deletedAt: undefined,
          deletedBy: undefined,
        });
      }
    }
  }
}

// 4. Recalculate Budget Item
await recalculateBudgetItemMetrics(ctx, budgetItemId, userId);
```

---

### Scenario F: Parent Restore (Selective Restoration)

**Action:** Restore `project` from trash

**Behavior:** Project restored, children conditionally restored

```
budgetItem (UNCHANGED or recalculated)
└── project (isDeleted: false) [RESTORED]
    ├── govtProjectBreakdowns (isDeleted: false) [CASCADE RESTORE]
    └── inspections (UNCHANGED)
```

**Important Consideration:**
When a project was deleted as part of a budget item cascade, restoring just the project creates an "orphaned" active project under a deleted budget item.

**Two Approaches:**

**Approach 1: Simple Cascade (Current Implementation)**
- Restore project and all its children
- Project becomes active even if parent budget item is deleted
- User can later restore budget item or reassign project

**Approach 2: Validation Check**
- Check if parent budget item is deleted
- If yes: warn user or prevent restore until parent is restored
- If no: proceed with cascade restore

**Current Implementation:**
```typescript
// 1. Restore Project
await ctx.db.patch(projectId, {
  isDeleted: false,
  deletedAt: undefined,
  deletedBy: undefined,
});

// 2. Restore Breakdowns
const breakdowns = await ctx.db
  .query("govtProjectBreakdowns")
  .withIndex("projectId", q => q.eq("projectId", projectId))
  .collect();

for (const breakdown of breakdowns) {
  if (breakdown.isDeleted) {
    await ctx.db.patch(breakdown._id, {
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
    });
  }
}

// 3. Recalculate Metrics
const project = await ctx.db.get(projectId);
if (project?.budgetItemId) {
  await recalculateBudgetItemMetrics(ctx, project.budgetItemId, userId);
}
```

---

### Scenario G: Child Restore (Leaf Node)

**Action:** Restore `govtProjectBreakdown` from trash

**Behavior:** Single item restored, parents recalculated

```
budgetItem (metrics recalculated)
└── project (metrics recalculated)
    └── govtProjectBreakdown (isDeleted: false) [RESTORED]
```

**Implementation Steps:**
1. Set `breakdown.isDeleted = false`
2. Recalculate parent `project` metrics
3. Recalculate grandparent `budgetItem` metrics

**Backend Logic:**
```typescript
// 1. Restore Breakdown
await ctx.db.patch(breakdownId, {
  isDeleted: false,
  deletedAt: undefined,
  deletedBy: undefined,
});

// 2. Get breakdown to find parent
const breakdown = await ctx.db.get(breakdownId);

// 3. Recalculate Project
if (breakdown?.projectId) {
  await recalculateProjectMetrics(ctx, breakdown.projectId, userId);
  
  // 4. Recalculate Budget Item (via project)
  const project = await ctx.db.get(breakdown.projectId);
  if (project?.budgetItemId) {
    await recalculateBudgetItemMetrics(ctx, project.budgetItemId, userId);
  }
}
```

---

## Edge Cases & Special Scenarios

### Scenario H: Orphaned Children (Parent Deleted, Child Active)

**Situation:** A project is deleted, but user manually creates a new breakdown for it

**Possible?** No - queries filter by `isDeleted: true`, so deleted projects don't show up in selection

**Prevention:** All queries for parent selection should exclude deleted items:
```typescript
const projects = await ctx.db
  .query("projects")
  .withIndex("budgetItemId", q => q.eq("budgetItemId", budgetItemId))
  .filter(q => q.neq(q.field("isDeleted"), true)) // Exclude deleted
  .collect();
```

---

### Scenario I: Partial Cascade (Mixed Deletion States)

**Situation:** Budget item has 3 projects
- Project A: Active
- Project B: Deleted (with deleted breakdowns)
- Project C: Deleted (with active breakdowns - shouldn't happen)

**Handling:**
- This shouldn't occur if cascade logic is consistent
- If found, indicates data integrity issue
- Repair: Run recalculation on all parents

---

### Scenario J: Double Delete (Idempotency)

**Situation:** User clicks "Move to Trash" twice

**Expected Behavior:** 
- First click: Item moved to trash
- Second click: No error, no change (idempotent)

**Implementation:**
```typescript
// Check if already deleted
if (item.isDeleted) {
  return { success: true, message: "Already in trash" };
}
```

---

### Scenario K: Restore Non-Deleted Item

**Situation:** User tries to restore an active item

**Expected Behavior:**
- No error
- Return success with message "Item is already active"

**Implementation:**
```typescript
// Check if already active
if (!item.isDeleted) {
  return { success: true, message: "Item is already active" };
}
```

---

### Scenario L: Child of Deleted Parent (Restoration Conflict)

**Situation:**
1. Budget Item A deleted (cascades to Project X)
2. User tries to restore Project X without restoring Budget Item A

**Options:**

**Option 1: Allow Orphan (Current)**
- Project X becomes active
- Project X's budgetItemId still points to deleted Budget Item A
- User can later reassign or restore parent

**Option 2: Prevent Restoration**
```typescript
const project = await ctx.db.get(projectId);
if (project?.budgetItemId) {
  const budgetItem = await ctx.db.get(project.budgetItemId);
  if (budgetItem?.isDeleted) {
    throw new Error("Cannot restore: Parent budget item is deleted. Restore parent first.");
  }
}
```

**Option 3: Auto-Restore Parent**
- Restore Budget Item A automatically
- Cascade restore Project X

**Recommendation:** Option 1 or 2 depending on business requirements

---

### Scenario M: Inspections with Deleted Parents

**Situation:** Project is deleted, but inspections have no soft delete

**Behavior:**
- Inspections remain active with `projectId` pointing to deleted project
- This is intentional - inspections are independent records
- User can reassign inspections to different projects

**Query Considerations:**
When fetching inspections for a project, always check if project exists:
```typescript
// Get inspections with project validation
const inspections = await ctx.db
  .query("inspections")
  .withIndex("projectId", q => q.eq("projectId", projectId))
  .collect();

const project = await ctx.db.get(projectId);
if (!project || project.isDeleted) {
  // Handle orphaned inspections
}
```

---

## Backend Implementation Guide

### Standard Trash Functions Template

```typescript
// Get Trash Items
export const getTrash = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.db
      .query("tableName")
      .withIndex("isDeleted", q => q.eq("isDeleted", true))
      .order("desc")
      .collect();
  },
});

// Move to Trash
export const moveToTrash = mutation({
  args: {
    id: v.id("tableName"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    if (item.isDeleted) return { success: true, message: "Already in trash" };
    
    const now = Date.now();
    
    // 1. Mark item as deleted
    await ctx.db.patch(args.id, {
      isDeleted: true,
      deletedAt: now,
      deletedBy: userId,
    });
    
    // 2. Cascade to children (if applicable)
    // ... cascade logic
    
    // 3. Recalculate parent metrics (if applicable)
    // ... recalculation logic
    
    return { success: true };
  },
});

// Restore from Trash
export const restoreFromTrash = mutation({
  args: {
    id: v.id("tableName"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");
    if (!item.isDeleted) return { success: true, message: "Already active" };
    
    // 1. Restore item
    await ctx.db.patch(args.id, {
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
    });
    
    // 2. Cascade restore children (if applicable)
    // ... cascade logic
    
    // 3. Recalculate parent metrics
    // ... recalculation logic
    
    return { success: true };
  },
});
```

---

## Frontend Considerations

### Trash Bin UI Components

1. **Trash Bin Table**
   - Show deleted items with restore button
   - Group by entity type (Budget Items, Projects, Breakdowns)
   - Show deletion date and user

2. **Cascade Warning Modal**
   - When deleting parent, show count of affected children
   - "This will also delete 5 projects and 23 breakdowns"

3. **Restore Options**
   - Simple Restore: Restore just this item
   - Cascade Restore: Restore this item and all descendants
   - Show warning if parent is deleted

### Query Filters

Always filter out deleted items in regular queries:

```typescript
// Regular list - exclude deleted
const items = await ctx.db
  .query("tableName")
  .filter(q => q.neq(q.field("isDeleted"), true))
  .collect();

// Trash view - only deleted
const trashed = await ctx.db
  .query("tableName")
  .withIndex("isDeleted", q => q.eq("isDeleted", true))
  .collect();
```

---

## Summary Matrix

| Action | Level | Cascades Down | Affects Parent | Recalculates Metrics |
|--------|-------|---------------|----------------|---------------------|
| Delete Budget Item | 1 | Yes (Projects → Breakdowns) | No | Yes (excludes deleted) |
| Delete Project | 2 | Yes (Breakdowns) | Yes (Budget Item) | Yes |
| Delete Breakdown | 3 | No | Yes (Project → Budget Item) | Yes |
| Restore Budget Item | 1 | Yes (Full cascade) | No | Yes |
| Restore Project | 2 | Yes (Breakdowns) | Yes | Yes |
| Restore Breakdown | 3 | No | Yes | Yes |

---

## Future Considerations

1. **Inspections Soft Delete**: Consider adding `isDeleted` to inspections for consistency
2. **Trash Retention Policy**: Auto-permanent-delete after 30 days
3. **Trash History**: Log who deleted/restored and when
4. **Bulk Operations**: Select multiple items for restore/delete
5. **Search in Trash**: Find deleted items by name/particulars

---

*Document Version: 1.0*
*Last Updated: 2024*
*Author: PPDO Development Team*
