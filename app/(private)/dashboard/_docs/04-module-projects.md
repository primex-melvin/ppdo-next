# Module: Projects

> Complete documentation for the Projects module (Budget Items, Projects, Breakdowns)

---

## Overview

The Projects module is the most complex module in the PPDO Dashboard. It manages:
- **Budget Items** - Top-level budget allocations
- **Projects** - Individual projects under budget items
- **Breakdowns** - Detailed project breakdowns
- **Financial Tracking** - Allocated vs Utilized budgets
- **Inspections** - Project inspections and media

---

## Data Hierarchy

```
Fiscal Year (e.g., 2025)
│
├── Budget Item (e.g., "Road Infrastructure")
│   ├── Total Budget Allocated: ₱10,000,000
│   ├── Total Budget Utilized: ₱6,000,000
│   │
│   └── Project (e.g., "National Highway Rehabilitation")
│       ├── Category: "Infrastructure"
│       ├── Status: "ongoing"
│       │
│       └── Project Breakdown
│           ├── Breakdown Item 1
│           │   ├── Budget: ₱2,000,000
│           │   ├── Implementing Office: "DPWH"
│           │   └── Status Chain: 
│           │       ├── MOA: ✓
│           │       ├── PCIC: ✓
│           │       ├── Delivery: ⟳
│           │       └── Liquidation: ✗
│           │
│           └── Breakdown Item 2
│               └── ...
│
└── Another Budget Item...
```

---

## Route Structure

```
/dashboard/project                           # Fiscal years landing
/dashboard/project/[year]                    # Budget items for year
/dashboard/project/[year]/[particularId]     # Projects for budget item
/dashboard/project/[year]/[particularId]/[projectbreakdownId]
                                             # Breakdowns list
/dashboard/project/[year]/.../[projectId]    # Project detail with tabs
```

---

## Page: Fiscal Years Landing

**Route:** `/dashboard/project`  
**File:** `app/dashboard/project/page.tsx`

### Features
- Displays fiscal year cards
- Shows statistics per year (budget items, projects, breakdowns)
- Quick actions: Add year, Open latest, Delete year
- Expandable cards with detailed stats

### Stats Displayed
| Stat | Description |
|------|-------------|
| Budget Items | Count of budget items for year |
| Projects | Count of projects |
| Breakdowns | Count of breakdown items |
| Total Allocated | Sum of all budget allocations |
| Total Utilized | Sum of all utilized budgets |
| Utilization Rate | (Utilized / Allocated) × 100 |
| Project Status | Completed / Ongoing / Delayed counts |

### Components Used
```typescript
import {
  FiscalYearHeader,
  FiscalYearEmptyState,
  FiscalYearCard,
  FiscalYearDeleteDialog,
} from "@/components/ppdo/fiscal-years";
import { FiscalYearModal } from "@/components/ppdo/fiscal-years";
```

---

## Page: Budget Items (Year View)

**Route:** `/dashboard/project/[year]`  
**File:** `app/dashboard/project/[year]/page.tsx`

### Features
- Budget tracking table with CRUD operations
- Print preview functionality
- Bulk operations (toggle, delete)
- Spreadsheet-style data entry
- Real-time budget calculations

### Components Structure
```
[year]/
├── page.tsx
├── components/
│   ├── BudgetPageHeader.tsx
│   ├── BudgetTrackingTable.tsx
│   ├── BudgetStatistics.tsx
│   ├── BudgetModal.tsx
│   ├── BudgetExpandModal.tsx
│   ├── BudgetShareModal.tsx
│   ├── BudgetBulkToggleDialog.tsx
│   ├── BudgetConfirmationModal.tsx
│   ├── BudgetViolationModal.tsx
│   ├── table/
│   │   ├── BudgetTableHeader.tsx
│   │   ├── BudgetTableRow.tsx
│   │   ├── BudgetTableToolbar.tsx
│   │   ├── BudgetTableTotalsRow.tsx
│   │   ├── BudgetColumnVisibilityMenu.tsx
│   │   └── BudgetContextMenu.tsx
│   ├── form/
│   │   ├── BudgetItemForm.tsx
│   │   ├── AllocatedBudgetField.tsx
│   │   ├── ParticularField.tsx
│   │   └── ...
│   └── hooks/
│       ├── useBudgetData.ts
│       ├── useBudgetMutations.ts
│       ├── useBudgetTableState.ts
│       └── ...
```

### Table Features
- **Column Visibility**: Show/hide columns
- **Sorting**: Click headers to sort
- **Column Resize**: Drag to resize
- **Column Reorder**: Drag-drop columns
- **Row Selection**: Checkbox selection
- **Context Menu**: Right-click actions
- **Print Preview**: Generate printable view

### Budget Calculations
```typescript
// Auto-calculation from breakdowns
const calculatedAllocated = breakdowns.reduce(
  (sum, b) => sum + b.totalBreakdownCost, 
  0
);

// Utilization calculation
const utilizationRate = allocated > 0 
  ? (utilized / allocated) * 100 
  : 0;
```

---

## Page: Projects List

**Route:** `/dashboard/project/[year]/[particularId]`  
**File:** `.../page.tsx`

### Features
- Projects table for specific budget item
- Project CRUD operations
- Category filtering and grouping
- Bulk actions (delete, status change)
- Expandable project details

### Components Structure
```
[particularId]/
├── page.tsx
├── components/
│   ├── ParticularPageHeader.tsx
│   ├── ProjectsTable.tsx
│   ├── ProjectForm.tsx
│   ├── ProjectCategoryCombobox.tsx
│   ├── ProjectParticularCombobox.tsx
│   ├── ProjectExpandModal.tsx
│   ├── ProjectShareModal.tsx
│   ├── ProjectBulkToggleDialog.tsx
│   ├── ProjectSummaryStats.tsx
│   ├── StatusInfoCard.tsx
│   └── ProjectsTable/
│       ├── ProjectsTableHeader.tsx
│       ├── ProjectsTableBody.tsx
│       ├── ProjectsTableRow.tsx
│       ├── ProjectsTableToolbar.tsx
│       ├── ProjectBulkActions.tsx
│       ├── ProjectCategoryFilter.tsx
│       ├── ProjectCategoryGroup.tsx
│       ├── ProjectContextMenu.tsx
│       └── SortIcon.tsx
```

### Project Categories
- Infrastructure
- Social Services
- Economic Development
- Environment
- Administrative
- Others

### Project Status Values
- `draft` - Initial state
- `pending` - Pending approval
- `ongoing` - Active implementation
- `completed` - Finished
- `delayed` - Behind schedule
- `cancelled` - Cancelled

---

## Page: Breakdowns List

**Route:** `/dashboard/project/[year]/[particularId]/[projectbreakdownId]`  
**File:** `.../page.tsx`

### Features
- Breakdown items table
- Status chain tracking (MOA → PCIC → Delivery → Liquidation)
- Implementing office selection
- Budget allocation per breakdown
- History tracking

### Components Structure
```
[projectbreakdownId]/
├── page.tsx
├── components/
│   ├── BreakdownForm.tsx
│   ├── BreakdownHistoryTable.tsx
│   ├── EmptyState.tsx
│   ├── ImplementingOfficeSelector.tsx
│   ├── StatusChainCard.tsx
│   ├── TableHeader.tsx
│   ├── TableRow.tsx
│   ├── TableToolbar.tsx
│   └── TableTotalsRow.tsx
├── constants/
│   └── table.constants.ts
├── hooks/
│   ├── useColumnDragDrop.ts
│   ├── useTableResize.ts
│   └── useTableSettings.ts
├── types/
│   └── breakdown.types.ts
└── utils/
    ├── formatters.ts
    ├── helpers.ts
    ├── navigation.utils.ts
    └── page-helpers.ts
```

### Status Chain
Each breakdown has a status chain tracking progress:

| Status | Description | Icon |
|--------|-------------|------|
| MOA | Memorandum of Agreement | ✓/✗/⟳ |
| PCIC | Performance/Completion Inspection | ✓/✗/⟳ |
| Delivery | Goods/Services Delivery | ✓/✗/⟳ |
| Liquidation | Financial Liquidation | ✓/✗/⟳ |

Status values: `completed`, `pending`, `ongoing`, `not_started`

---

## Page: Project Detail

**Route:** `/dashboard/project/[year]/.../[projectId]`  
**File:** `.../page.tsx`

### Features
- Tabbed interface (Overview, Inspections, Analytics, Remarks)
- Financial breakdown display
- Inspection management with media
- Remarks/comments system
- Print export

### Tabs

#### 1. Overview Tab
- Project details
- Financial summary
- Status information
- Implementing agency details

#### 2. Inspections Tab
- Inspection records
- Photo gallery
- Document attachments
- Inspection types:
  - Pre-inspection
  - During implementation
  - Post-completion

#### 3. Analytics Tab
- Budget utilization charts
- Timeline visualization
- Status breakdown
- Comparative analysis

#### 4. Remarks Tab
- Comment threads
- User mentions
- Timestamped entries
- Attachment support

### Components Structure
```
[projectId]/
├── page.tsx
├── components/
│   ├── Card.tsx
│   ├── StatCard.tsx
│   ├── TransactionCard.tsx
│   ├── FinancialBreakdownCard.tsx
│   ├── FinancialBreakdownHeader.tsx
│   ├── FinancialBreakdownItemForm.tsx
│   ├── FinancialBreakdownMain.tsx
│   ├── FinancialBreakdownTable.tsx
│   ├── FinancialBreakdownTabs.tsx
│   ├── InspectionsDataTable.tsx
│   ├── InspectionGalleryModal.tsx
│   ├── InspectionContextMenu.tsx
│   ├── InspectionViewToggle.tsx
│   ├── RemarksSection.tsx
│   ├── tabs/
│   │   ├── OverviewContent.tsx
│   │   ├── InspectionContent.tsx
│   │   ├── AnalyticsContent.tsx
│   │   └── RemarksContent.tsx
│   └── modals/
│       ├── InspectionDetailsModal.tsx
│       ├── NewInspectionForm.tsx
│       └── NewRemarkModal.tsx
├── types/
│   └── inspection.ts
├── data.ts
├── utils.ts
└── components/
    └── types.ts
```

---

## Print Preview System

### Budget Table Print Preview
Located in: `app/dashboard/components/print/GenericPrintPreviewModal.tsx`

### Features
- Canvas-based rendering for precise layout
- Multiple page support
- PDF generation via jsPDF
- Draft saving/loading
- Print styling

### Print Flow
```
1. User clicks "Print" in budget table
2. GenericPrintPreviewModal opens
3. Data converted to print format via adapters
4. Canvas renders the table
5. User can: Print, Save PDF, or Cancel
```

### Print Adapters
```typescript
// app/dashboard/project/[year]/lib/print-adapters/
├── BudgetPrintAdapter.ts
```

---

## Key Hooks

### useBudgetData
```typescript
// Fetches and manages budget data for year
const {
  budgetItems,
  fiscalYear,
  isLoading,
  refetch,
} = useBudgetData(year);
```

### useBudgetMutations
```typescript
// CRUD operations for budget items
const {
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  bulkDelete,
  toggleStatus,
} = useBudgetMutations();
```

### useBudgetAccess
```typescript
// Permission checking
const {
  canAccess,
  canCreate,
  canEdit,
  canDelete,
  accessCheck,
} = useBudgetAccess();
```

---

## Types Reference

### Budget Item Type
```typescript
interface BudgetItem {
  _id: Id<"budgetItems">;
  _creationTime: number;
  year: number;
  particularId: Id<"budgetParticulars">;
  particularName?: string;
  totalBudgetAllocated: number;
  totalBudgetUtilized: number;
  isActive: boolean;
  createdBy: Id<"users">;
}
```

### Project Type
```typescript
interface GovtProject {
  _id: Id<"govtProjects">;
  _creationTime: number;
  year: number;
  particularId: Id<"budgetParticulars">;
  projectName: string;
  category: string;
  status: ProjectStatus;
  totalBudget: number;
  description?: string;
  remarks?: string;
}
```

### Breakdown Type
```typescript
interface GovtProjectBreakdown {
  _id: Id<"govtProjectBreakdowns">;
  _creationTime: number;
  projectId: Id<"govtProjects">;
  implementingOfficeId: Id<"implementingOffices">;
  totalBreakdownCost: number;
  moaStatus: StatusChainState;
  pcicStatus: StatusChainState;
  deliveryStatus: StatusChainState;
  liquidationStatus: StatusChainState;
}
```

---

## Related Documentation

- [Data Flow & Convex](./08-data-flow.md) - Backend integration
- [Access Control & RBAC](./09-access-control.md) - Permissions
- [Development Guide](./10-development-guide.md) - Coding patterns
