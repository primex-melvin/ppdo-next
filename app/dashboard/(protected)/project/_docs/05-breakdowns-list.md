# Breakdowns List

> Level 3: Managing project breakdowns with status chain

---

## Overview

The Breakdowns page displays detailed breakdown items for a specific project. Each breakdown tracks budget allocation and a status chain (MOA → PCIC → Delivery → Liquidation).

**Route:** `/dashboard/project/[year]/[particularId]/[projectbreakdownId]`  
**File:** `app/dashboard/project/[year]/[particularId]/[projectbreakdownId]/page.tsx`

---

## Features

### 1. Breakdown History Table

**BreakdownHistoryTable Component**

Features:
- Column resize (drag borders)
- Column reorder (drag-drop)
- Row selection
- Sortable columns
- Totals row

**Columns:**
- Project Title
- Implementing Office
- Total Breakdown Cost
- Obligated Amount
- Utilized Amount
- Status Chain (MOA, PCIC, Delivery, Liquidation)
- Location (Province/City)
- Dates
- Remarks

### 2. Status Chain Card

**StatusChainCard Component**

Visual representation of the status chain:

```
[MOA] → [PCIC] → [Delivery] → [Liquidation]

Statuses:
- ✓ Completed (green)
- ⟳ Ongoing (blue)
- ✗ Not Started (gray)
- N/A (strikethrough)
```

**Status Chain States:**
| Stage | Description |
|-------|-------------|
| MOA | Memorandum of Agreement signed |
| PCIC | Pre-construction/inspection complete |
| Delivery | Goods/Services delivered |
| Liquidation | Financial liquidation complete |

### 3. Breakdown Form

**BreakdownForm Component**

Fields:
- Project Title
- Implementing Office (selector)
- Total Breakdown Cost
- Obligated Amount
- Utilized Amount
- Status Chain (4 stages)
- Location (Province, City, Municipality, Barangay)
- Dates (Start, End)
- Accomplishment
- Remarks

### 4. Budget Tracking

Each breakdown tracks:
- **Total Breakdown Cost**: Budget allocated
- **Obligated Amount**: Committed/spoken for
- **Utilized Amount**: Actually spent
- **Balance**: Cost - Utilized

---

## Component Structure

```
BreakdownPage
│
├── BreakdownHeader
│   ├── Breadcrumbs
│   ├── Project name
│   └── Actions
│
├── EntityOverviewCards
│   ├── Project info
│   └── Budget summary
│
├── BreakdownStatsAccordion
│   ├── Total Allocated
│   ├── Total Utilized
│   └── Breakdown count
│
├── BreakdownHistoryTable
│   ├── TableToolbar
│   │   ├── Add Breakdown button
│   │   ├── Search
│   │   └── Column visibility
│   ├── TableHeader
│   ├── TableRow (many)
│   │   ├── StatusChainCell
│   │   └── Action buttons
│   └── TableTotalsRow
│
└── BreakdownForm (modal)
    ├── Form fields
    ├── Status Chain selector
    └── Submit/Cancel
```

---

## Status Chain System

### Status Values

```typescript
type StatusChainState = 
  | "not_started"   // Gray, empty circle
  | "ongoing"       // Blue, half circle
  | "completed"     // Green, checkmark
  | "na";           // Strikethrough, not applicable
```

### Status Chain Flow

```
Initial: All "not_started"

Progression:
not_started → ongoing → completed

Or:
not_started → na (skip)
```

### UI Representation

```tsx
<StatusChainCard
  moaStatus="completed"
  pcicStatus="ongoing"
  deliveryStatus="not_started"
  liquidationStatus="not_started"
/>

// Visual:
// [✓ MOA] → [⟳ PCIC] → [○ Delivery] → [○ Liquidation]
```

---

## Hooks

### useTableSettings

Manages table configuration.

```typescript
const {
  settings,
  updateColumnWidth,
  updateColumnOrder,
  toggleColumnVisibility,
  resetSettings,
  saveToStorage,
  loadFromStorage,
} = useTableSettings();
```

### useTableResize

Column resize functionality.

```typescript
const {
  columnWidths,
  startResize,
  stopResize,
  isResizing,
} = useTableResize({
  initialWidths,
  minWidth: 80,
  onResize,
});
```

### useColumnDragDrop

Column reordering.

```typescript
const {
  draggedColumn,
  dragOverColumn,
  handleDragStart,
  handleDragOver,
  handleDrop,
} = useColumnDragDrop({
  columns,
  onReorder,
});
```

---

## Types

```typescript
// _types/breakdown.types.ts

interface GovtProjectBreakdown {
  _id: Id<"govtProjectBreakdowns">;
  _creationTime: number;
  projectId: Id<"govtProjects">;
  implementingOfficeId: Id<"implementingOffices">;
  projectTitle: string;
  totalBreakdownCost: number;
  obligatedAmount: number;
  utilizedAmount: number;
  accomplishment: string;
  status: BreakdownStatus;
  moaStatus: StatusChainState;
  pcicStatus: StatusChainState;
  deliveryStatus: StatusChainState;
  liquidationStatus: StatusChainState;
  province?: string;
  city?: string;
  municipality?: string;
  barangay?: string;
  startDate?: number;
  endDate?: number;
  remarks?: string;
}

type BreakdownStatus = 
  | "not_started"
  | "ongoing"
  | "completed"
  | "delayed"
  | "cancelled";

type StatusChainState =
  | "not_started"
  | "ongoing"
  | "completed"
  | "na";
```

---

## Utilities

```typescript
// _lib/formatters.ts

formatCurrency(1000000);     // "₱1,000,000.00"
formatDate(1704067200000);   // "Jan 1, 2024"
formatPercentage(75.5);      // "75.5%"
formatLocation({             // "Cebu City, Cebu"
  province: "Cebu",
  city: "Cebu City"
});

// _lib/helpers.ts

calculateColumnTotals(breakdowns, columns);
filterBreakdowns(breakdowns, filters);
generateGridTemplate(columns);

// _lib/navigation.utils.ts

buildBreakdownDetailPath(breakdownId);
logBreakdownNavigation(breakdownId, action);
```

---

## Constants

```typescript
// constants/table.constants.ts

export const TABLE_IDENTIFIER = "breakdown-table";
export const DEFAULT_ROW_HEIGHT = 48;
export const MIN_COLUMN_WIDTH = 80;
export const MIN_ROW_HEIGHT = 40;
export const TABLE_HEIGHT = 600;

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "projectTitle", label: "Project Title", type: "text", ... },
  { id: "implementingOffice", label: "Office", type: "text", ... },
  { id: "totalBreakdownCost", label: "Budget", type: "currency", ... },
  { id: "moaStatus", label: "MOA", type: "status", ... },
  { id: "pcicStatus", label: "PCIC", type: "status", ... },
  { id: "deliveryStatus", label: "Delivery", type: "status", ... },
  { id: "liquidationStatus", label: "Liquidation", type: "status", ... },
  { id: "actions", label: "Actions", type: "actions", ... },
];
```

---

## Usage Example

```tsx
"use client";

export default function BreakdownPage() {
  const params = useParams();
  const projectId = params.projectbreakdownId as string;
  
  const project = useQuery(api.projects.getById, { id: projectId });
  const breakdowns = useQuery(api.breakdowns.getByProject, { projectId });
  
  const tableSettings = useTableSettings();
  const [showForm, setShowForm] = useState(false);
  
  if (!project || !breakdowns) return <LoadingState />;
  
  return (
    <div className="space-y-6">
      <BreakdownHeader
        title="Project Breakdowns"
        project={project}
      />
      
      <EntityOverviewCards entity={project} />
      
      <BreakdownStatsAccordion
        budgetAllocated={project.totalBudget}
        budgetUtilized={breakdowns.reduce((s, b) => s + b.utilizedAmount, 0)}
        breakdownsCount={breakdowns.length}
      />
      
      <BreakdownHistoryTable
        breakdowns={breakdowns}
        settings={tableSettings}
      />
      
      <Button onClick={() => setShowForm(true)}>
        Add Breakdown
      </Button>
      
      {showForm && (
        <BreakdownForm
          projectId={projectId}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
```

---

## Related Documentation

- [Projects List](./04-projects-list.md)
- [Project Detail](./06-project-detail.md)
