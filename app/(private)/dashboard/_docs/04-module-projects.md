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
â”‚
â”œâ”€â”€ Budget Item (e.g., "Road Infrastructure")
â”‚   â”œâ”€â”€ Total Budget Allocated: â‚±10,000,000
â”‚   â”œâ”€â”€ Total Budget Utilized: â‚±6,000,000
â”‚   â”‚
â”‚   â””â”€â”€ Project (e.g., "National Highway Rehabilitation")
â”‚       â”œâ”€â”€ Category: "Infrastructure"
â”‚       â”œâ”€â”€ Status: "ongoing"
â”‚       â”‚
â”‚       â””â”€â”€ Project Breakdown
â”‚           â”œâ”€â”€ Breakdown Item 1
â”‚           â”‚   â”œâ”€â”€ Budget: â‚±2,000,000
â”‚           â”‚   â”œâ”€â”€ Implementing Office: "DPWH"
â”‚           â”‚   â””â”€â”€ Status Chain: 
â”‚           â”‚       â”œâ”€â”€ MOA: âœ“
â”‚           â”‚       â”œâ”€â”€ PCIC: âœ“
â”‚           â”‚       â”œâ”€â”€ Delivery: âŸ³
â”‚           â”‚       â””â”€â”€ Liquidation: âœ—
â”‚           â”‚
â”‚           â””â”€â”€ Breakdown Item 2
â”‚               â””â”€â”€ ...
â”‚
â””â”€â”€ Another Budget Item...
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
| Utilization Rate | (Utilized / Allocated) Ã— 100 |
| Project Status | Completed / Ongoing / Delayed counts |

### Components Used
```typescript
import {
  FiscalYearHeader,
  FiscalYearEmptyState,
  FiscalYearCard,
  FiscalYearDeleteDialog,
} from "@/components/features/ppdo/fiscal-years";
import { FiscalYearModal } from "@/components/features/ppdo/fiscal-years";
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
â”œâ”€â”€ page.tsx
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ BudgetPageHeader.tsx
â”‚   â”œâ”€â”€ BudgetTrackingTable.tsx
â”‚   â”œâ”€â”€ BudgetStatistics.tsx
â”‚   â”œâ”€â”€ BudgetModal.tsx
â”‚   â”œâ”€â”€ BudgetExpandModal.tsx
â”‚   â”œâ”€â”€ BudgetShareModal.tsx
â”‚   â”œâ”€â”€ BudgetBulkToggleDialog.tsx
â”‚   â”œâ”€â”€ BudgetConfirmationModal.tsx
â”‚   â”œâ”€â”€ BudgetViolationModal.tsx
â”‚   â”œâ”€â”€ table/
â”‚   â”‚   â”œâ”€â”€ BudgetTableHeader.tsx
â”‚   â”‚   â”œâ”€â”€ BudgetTableRow.tsx
â”‚   â”‚   â”œâ”€â”€ BudgetTableToolbar.tsx
â”‚   â”‚   â”œâ”€â”€ BudgetTableTotalsRow.tsx
â”‚   â”‚   â”œâ”€â”€ BudgetColumnVisibilityMenu.tsx
â”‚   â”‚   â””â”€â”€ BudgetContextMenu.tsx
â”‚   â”œâ”€â”€ form/
â”‚   â”‚   â”œâ”€â”€ BudgetItemForm.tsx
â”‚   â”‚   â”œâ”€â”€ AllocatedBudgetField.tsx
â”‚   â”‚   â”œâ”€â”€ ParticularField.tsx
â”‚   â”‚   â””â”€â”€ ...
â”‚   â””â”€â”€ hooks/
â”‚       â”œâ”€â”€ useBudgetData.ts
â”‚       â”œâ”€â”€ useBudgetMutations.ts
â”‚       â”œâ”€â”€ useBudgetTableState.ts
â”‚       â””â”€â”€ ...
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
â”œâ”€â”€ page.tsx
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ ParticularPageHeader.tsx
â”‚   â”œâ”€â”€ ProjectsTable.tsx
â”‚   â”œâ”€â”€ ProjectForm.tsx
â”‚   â”œâ”€â”€ ProjectCategoryCombobox.tsx
â”‚   â”œâ”€â”€ ProjectParticularCombobox.tsx
â”‚   â”œâ”€â”€ ProjectExpandModal.tsx
â”‚   â”œâ”€â”€ ProjectShareModal.tsx
â”‚   â”œâ”€â”€ ProjectBulkToggleDialog.tsx
â”‚   â”œâ”€â”€ ProjectSummaryStats.tsx
â”‚   â”œâ”€â”€ StatusInfoCard.tsx
â”‚   â””â”€â”€ ProjectsTable/
â”‚       â”œâ”€â”€ ProjectsTableHeader.tsx
â”‚       â”œâ”€â”€ ProjectsTableBody.tsx
â”‚       â”œâ”€â”€ ProjectsTableRow.tsx
â”‚       â”œâ”€â”€ ProjectsTableToolbar.tsx
â”‚       â”œâ”€â”€ ProjectBulkActions.tsx
â”‚       â”œâ”€â”€ ProjectCategoryFilter.tsx
â”‚       â”œâ”€â”€ ProjectCategoryGroup.tsx
â”‚       â”œâ”€â”€ ProjectContextMenu.tsx
â”‚       â””â”€â”€ SortIcon.tsx
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
- Status chain tracking (MOA â†’ PCIC â†’ Delivery â†’ Liquidation)
- Implementing office selection
- Budget allocation per breakdown
- History tracking

### Components Structure
```
[projectbreakdownId]/
â”œâ”€â”€ page.tsx
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ BreakdownForm.tsx
â”‚   â”œâ”€â”€ BreakdownHistoryTable.tsx
â”‚   â”œâ”€â”€ EmptyState.tsx
â”‚   â”œâ”€â”€ ImplementingOfficeSelector.tsx
â”‚   â”œâ”€â”€ StatusChainCard.tsx
â”‚   â”œâ”€â”€ TableHeader.tsx
â”‚   â”œâ”€â”€ TableRow.tsx
â”‚   â”œâ”€â”€ TableToolbar.tsx
â”‚   â””â”€â”€ TableTotalsRow.tsx
â”œâ”€â”€ constants/
â”‚   â””â”€â”€ table.constants.ts
â”œâ”€â”€ hooks/
â”‚   â”œâ”€â”€ useColumnDragDrop.ts
â”‚   â”œâ”€â”€ useTableResize.ts
â”‚   â””â”€â”€ useTableSettings.ts
â”œâ”€â”€ types/
â”‚   â””â”€â”€ breakdown.types.ts
â””â”€â”€ utils/
    â”œâ”€â”€ formatters.ts
    â”œâ”€â”€ helpers.ts
    â”œâ”€â”€ navigation.utils.ts
    â””â”€â”€ page-helpers.ts
```

### Status Chain
Each breakdown has a status chain tracking progress:

| Status | Description | Icon |
|--------|-------------|------|
| MOA | Memorandum of Agreement | âœ“/âœ—/âŸ³ |
| PCIC | Performance/Completion Inspection | âœ“/âœ—/âŸ³ |
| Delivery | Goods/Services Delivery | âœ“/âœ—/âŸ³ |
| Liquidation | Financial Liquidation | âœ“/âœ—/âŸ³ |

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
â”œâ”€â”€ page.tsx
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ Card.tsx
â”‚   â”œâ”€â”€ StatCard.tsx
â”‚   â”œâ”€â”€ TransactionCard.tsx
â”‚   â”œâ”€â”€ FinancialBreakdownCard.tsx
â”‚   â”œâ”€â”€ FinancialBreakdownHeader.tsx
â”‚   â”œâ”€â”€ FinancialBreakdownItemForm.tsx
â”‚   â”œâ”€â”€ FinancialBreakdownMain.tsx
â”‚   â”œâ”€â”€ FinancialBreakdownTable.tsx
â”‚   â”œâ”€â”€ FinancialBreakdownTabs.tsx
â”‚   â”œâ”€â”€ InspectionsDataTable.tsx
â”‚   â”œâ”€â”€ InspectionGalleryModal.tsx
â”‚   â”œâ”€â”€ InspectionContextMenu.tsx
â”‚   â”œâ”€â”€ InspectionViewToggle.tsx
â”‚   â”œâ”€â”€ RemarksSection.tsx
â”‚   â”œâ”€â”€ tabs/
â”‚   â”‚   â”œâ”€â”€ OverviewContent.tsx
â”‚   â”‚   â”œâ”€â”€ InspectionContent.tsx
â”‚   â”‚   â”œâ”€â”€ AnalyticsContent.tsx
â”‚   â”‚   â””â”€â”€ RemarksContent.tsx
â”‚   â””â”€â”€ modals/
â”‚       â”œâ”€â”€ InspectionDetailsModal.tsx
â”‚       â”œâ”€â”€ NewInspectionForm.tsx
â”‚       â””â”€â”€ NewRemarkModal.tsx
â”œâ”€â”€ types/
â”‚   â””â”€â”€ inspection.ts
â”œâ”€â”€ data.ts
â”œâ”€â”€ utils.ts
â””â”€â”€ components/
    â””â”€â”€ types.ts
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
â”œâ”€â”€ BudgetPrintAdapter.ts
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