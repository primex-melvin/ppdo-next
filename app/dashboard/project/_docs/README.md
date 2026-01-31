# Projects Module Documentation

> Complete documentation for the Projects module (Budget Items → Projects → Breakdowns → Project Details)

---

## Table of Contents

1. [Architecture Overview](./01-architecture-overview.md)
2. [Route Structure](./02-route-structure.md)
3. [Budget Items (Year View)](./03-budget-items.md)
4. [Projects (Particular View)](./04-projects-list.md)
5. [Breakdowns List](./05-breakdowns-list.md)
6. [Project Detail](./06-project-detail.md)
7. [Hooks & Data Flow](./07-hooks-data-flow.md)
8. [Print System](./08-print-system.md)
9. [Folder Conventions](./09-folder-conventions.md)

---

## Quick Overview

The Projects module is a 4-level hierarchy managing the complete project lifecycle:

```
Level 1: BUDGET ITEMS (Year View)
/dashboard/project/[year]
├── Budget items for the fiscal year
├── Statistics: Total Allocated, Utilized, Obligated
└── Actions: Add, Edit, Delete, Bulk operations

Level 2: PROJECTS (Particular View)
/dashboard/project/[year]/[particularId]
├── Projects under a budget item
├── Category grouping
└── Actions: Add, Edit, Delete projects

Level 3: BREAKDOWNS
/dashboard/project/[year]/[particularId]/[projectbreakdownId]
├── Breakdown items for a project
├── Status chain (MOA → PCIC → Delivery → Liquidation)
└── Actions: Add, Edit breakdowns

Level 4: PROJECT DETAIL
/dashboard/project/[year]/.../[projectId]
├── Tabbed interface
├── Inspections with media
├── Financial breakdown
├── Remarks/comments
└── Analytics
```

---

## File Structure

> **Note:** This module uses **private folders** (prefixed with `_`) for non-routable files. See [Folder Conventions](./09-folder-conventions.md).

```
app/dashboard/project/
│
├── page.tsx                          # Level 0: Fiscal years landing
│
├── _components/                      # Private: Shared components
│   └── FiscalYearModal.tsx
│
├── _docs/                            # Private: Documentation
│   └── *.md
│
└── [year]/                           # Level 1: Budget Items
    ├── page.tsx
    └── [particularId]/               # Level 2: Projects
        ├── page.tsx
        └── [projectbreakdownId]/     # Level 3: Breakdowns
            ├── page.tsx
            ├── _components/          # Private: Page-specific components
            │   └── StatusChainCard.tsx
            ├── _lib/                 # Private: Utilities
            │   └── page-helpers.ts
            └── [inspectionId]/       # Level 4: Project Detail
                ├── page.tsx
                ├── _lib/             # Private: Data & utils
                │   ├── data.ts
                │   └── utils.ts
                └── _types/           # Private: TypeScript types
                    └── inspection.ts
```

### Key Conventions

| Pattern | Purpose | Routable? |
|---------|---------|-----------|
| `[param]/` | Dynamic route segment | ✅ Yes |
| `_folder/` | Private folder (components, utils, types) | ❌ No |
| `page.tsx` | Route page component | ✅ Yes |
| `layout.tsx` | Route layout component | ✅ Yes |

---

## Key Concepts

### Budget Hierarchy

| Level | Entity | Description |
|-------|--------|-------------|
| 1 | Budget Item | Top-level budget allocation under a particular |
| 2 | Project | Individual project under a budget item |
| 3 | Breakdown | Detailed breakdown with status tracking |
| 4 | Inspection | Media and remarks for breakdowns |

### Budget Calculations

```
Budget Item:
├── totalBudgetAllocated      (Manual or auto-calculated)
├── totalBudgetUtilized       (Sum of breakdown utilized)
├── obligatedBudget          (Sum of breakdown obligated)
└── utilizationRate          (Utilized / Allocated × 100)

Project:
├── totalBudget              (Allocated to project)
└── status                   (draft, ongoing, completed, etc.)

Breakdown:
├── totalBreakdownCost       (Budget for this breakdown)
├── obligatedAmount          (Committed amount)
├── utilizedAmount           (Spent amount)
└── statusChain              (MOA → PCIC → Delivery → Liquidation)
```

---

## Related Documentation

- [Dashboard Docs](../../docs/README.md)
- [PPDO Components](../../../components/ppdo/docs/README.md)
