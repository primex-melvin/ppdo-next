# Breakdown Components

> Comprehensive documentation for the Breakdown module

---

## Overview

The Breakdown module provides components for managing project and fund breakdown items. It's one of the most complex modules with table, form, kanban, and print capabilities.

**Used in:**
- Project breakdown pages
- Trust Fund breakdown pages
- SEF/SHF breakdown pages

---

## Component Inventory

### Shared Components (`breakdown/shared/`)

#### BreakdownHeader
Page header with breadcrumb navigation and actions.

```typescript
interface BreakdownHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs: BreadcrumbItem[];
  actions?: React.ReactNode;
  onBack?: () => void;
}
```

**Usage:**
```tsx
<BreakdownHeader
  title="Project Breakdowns"
  subtitle="Road Infrastructure Project"
  breadcrumbs={[
    { label: "Dashboard", href: "/dashboard" },
    { label: "Projects", href: "/dashboard/project" },
    { label: "2025", href: "/dashboard/project/2025" },
    { label: "Breakdowns" },
  ]}
  actions={<Button>Add Breakdown</Button>}
/>
```

---

#### EntityOverviewCards
Displays summary cards for parent entity (project/fund).

```typescript
interface EntityOverviewCardsProps {
  entity: {
    name: string;
    code?: string;
    description?: string;
    totalBudget: number;
    utilizedBudget: number;
    status: string;
  };
  stats: {
    breakdownCount: number;
    completedCount: number;
    pendingCount: number;
  };
}
```

---

#### BreakdownStatsAccordion
Expandable statistics panel.

```typescript
interface BreakdownStatsAccordionProps {
  budgetAllocated: number;
  budgetUtilized: number;
  breakdownsCount: number;
  defaultOpen?: boolean;
}
```

---

### Table Components (`breakdown/table/`)

#### BreakdownHistoryTable
Main table component for breakdown items.

```typescript
interface BreakdownHistoryTableProps {
  breakdowns: Breakdown[];
  settings: TableSettings;
  onEdit?: (breakdown: Breakdown) => void;
  onDelete?: (id: string) => void;
  onRowClick?: (breakdown: Breakdown) => void;
}
```

**Features:**
- Column resize
- Column reorder (drag-drop)
- Row selection
- Sorting
- Totals row
- Empty state

---

#### TableRow
Individual table row with interactive elements.

```typescript
interface TableRowProps {
  breakdown: Breakdown;
  columns: ColumnConfig[];
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (breakdown: Breakdown) => void;
  onDelete?: (id: string) => void;
}
```

---

#### TableTotalsRow
Summary row at bottom of table.

```typescript
interface TableTotalsRowProps {
  breakdowns: Breakdown[];
  columns: ColumnConfig[];
}
```

---

### Form Components (`breakdown/form/`)

#### BreakdownForm
Main form for creating/editing breakdowns.

```typescript
interface BreakdownFormProps {
  initialData?: Partial<Breakdown>;
  budgetLimit: number;           // Max available budget
  onSubmit: (data: BreakdownFormValues) => Promise<void>;
  onCancel?: () => void;
}
```

**Features:**
- React Hook Form
- Zod validation
- Budget validation
- Auto-calculation
- Field-level validation

---

#### Form Fields

| Component | Purpose |
|-----------|---------|
| `ProjectTitleField` | Project name input |
| `ImplementingOfficeField` | Office selector |
| `AllocatedBudgetField` | Budget allocation |
| `ObligatedBudgetField` | Obligated amount |
| `UtilizedBudgetField` | Utilized amount |
| `AccomplishmentField` | Progress/achievement |
| `StatusField` | Status dropdown |
| `RemarksField` | Notes/comments |
| `LocationFields` | Province/City/Municipality |
| `DateFields` | Start/End dates |

---

#### BudgetOverviewCard
Displays budget summary during form entry.

```typescript
interface BudgetOverviewCardProps {
  totalBudget: number;
  allocatedAmount: number;
  remainingBudget: number;
  utilizationRate: number;
}
```

---

#### BudgetWarningAlert
Shows warnings when budget constraints are violated.

```typescript
interface BudgetWarningAlertProps {
  warning: BudgetWarning | null;
  onDismiss?: () => void;
}
```

---

### Kanban Components (`breakdown/kanban/`)

#### BreakdownKanban
Kanban board view for breakdowns.

```typescript
interface BreakdownKanbanProps {
  breakdowns: Breakdown[];
  columns: KanbanColumnConfig[];
  onMove: (breakdownId: string, targetColumn: string) => void;
}
```

**Features:**
- Drag-drop cards
- Column configuration
- Status-based columns
- Field visibility toggle

---

## Hooks

### useTableSettings
Manages table configuration (columns, sizes, visibility).

```typescript
const {
  settings,
  updateColumnWidth,
  updateColumnOrder,
  toggleColumnVisibility,
  resetSettings,
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
  minWidth: 100,
  onResize,
});
```

### useColumnDragDrop
Column reordering via drag-drop.

```typescript
const {
  draggedColumn,
  dragOverColumn,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
} = useColumnDragDrop({
  columns,
  onReorder,
});
```

---

## Types

### Core Types

```typescript
// breakdown.types.ts

interface Breakdown {
  _id: string;
  projectId: string;
  implementingOfficeId: string;
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
  | "na";  // Not Applicable

interface ColumnConfig {
  id: string;
  label: string;
  type: ColumnType;
  align: ColumnAlign;
  width: number;
  visible: boolean;
  sortable: boolean;
}
```

---

## Utilities

### Formatters

```typescript
// Format currency
formatCurrency(1000000);  // "â‚±1,000,000.00"

// Format date
formatDate(1704067200000);  // "Jan 1, 2024"

// Format percentage
formatPercentage(75.5);  // "75.5%"

// Format location
formatLocation({ province: "Cebu", city: "Cebu City" });
// "Cebu City, Cebu"
```

### Helpers

```typescript
// Calculate column totals
calculateColumnTotals(breakdowns, columns);

// Filter breakdowns
filterBreakdowns(breakdowns, {
  status: "ongoing",
  implementingOfficeId: "office-123",
});

// Navigation helpers
buildBreakdownDetailPath(breakdownId);
// "/dashboard/project/2025/particular-123/breakdown-456"
```

### Form Validation

```typescript
// Schema
const breakdownSchema = z.object({
  projectTitle: z.string().min(2),
  implementingOfficeId: z.string(),
  totalBreakdownCost: z.number().min(0),
  obligatedAmount: z.number().min(0),
  utilizedAmount: z.number().min(0),
  status: z.enum(["not_started", "ongoing", "completed", "delayed"]),
});

// Budget validation
calculateBudgetAvailability({
  totalBudget: 1000000,
  allocatedBreakdowns: 600000,
  currentAllocation: 200000,
});
// Returns: { available: 200000, exceeded: false }
```

---

## Print Adapter

### BreakdownPrintAdapter

Converts breakdown data to print format.

```typescript
const adapter = new BreakdownPrintAdapter({
  breakdowns,
  columns,
  title: "Project Breakdowns 2025",
  subtitle: "Road Infrastructure",
});

const printData = adapter.toPrintFormat();
// Returns structured data for PrintPreviewModal
```

---

## Usage Example

### Complete Breakdown Page

```tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  BreakdownHeader,
  EntityOverviewCards,
  BreakdownStatsAccordion,
  BreakdownHistoryTable,
  BreakdownForm,
  useTableSettings,
  BreakdownKanban,
} from "@/components/features/ppdo/breakdown";
import { useState } from "react";

export default function BreakdownPage({
  params,
}: {
  params: { year: string; projectId: string };
}) {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [showForm, setShowForm] = useState(false);
  const tableSettings = useTableSettings();
  
  const project = useQuery(api.projects.getById, {
    id: params.projectId,
  });
  
  const breakdowns = useQuery(api.breakdowns.getByProject, {
    projectId: params.projectId,
  });
  
  const createBreakdown = useMutation(api.breakdowns.create);
  
  const handleSubmit = async (data: BreakdownFormValues) => {
    await createBreakdown({
      ...data,
      projectId: params.projectId,
    });
    setShowForm(false);
  };
  
  if (!project || !breakdowns) return <LoadingState />;
  
  return (
    <div className="space-y-6">
      <BreakdownHeader
        title="Project Breakdowns"
        subtitle={project.projectName}
        breadcrumbs={[...]}
        actions={
          <Button onClick={() => setShowForm(true)}>
            Add Breakdown
          </Button>
        }
      />
      
      <EntityOverviewCards
        entity={project}
        stats={{
          breakdownCount: breakdowns.length,
          completedCount: breakdowns.filter(b => b.status === "completed").length,
          pendingCount: breakdowns.filter(b => b.status === "ongoing").length,
        }}
      />
      
      <BreakdownStatsAccordion
        budgetAllocated={project.totalBudget}
        budgetUtilized={breakdowns.reduce((s, b) => s + b.utilizedAmount, 0)}
        breakdownsCount={breakdowns.length}
      />
      
      {viewMode === "table" ? (
        <BreakdownHistoryTable
          breakdowns={breakdowns}
          settings={tableSettings}
        />
      ) : (
        <BreakdownKanban
          breakdowns={breakdowns}
          onMove={handleMove}
        />
      )}
      
      {showForm && (
        <BreakdownForm
          budgetLimit={remainingBudget}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
```

---

## Constants

```typescript
// table.constants.ts

export const TABLE_IDENTIFIER = "breakdown-table";
export const DEFAULT_ROW_HEIGHT = 48;
export const MIN_COLUMN_WIDTH = 80;
export const MIN_ROW_HEIGHT = 40;
export const TABLE_HEIGHT = 600;

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: "projectTitle", label: "Project Title", type: "text", ... },
  { id: "implementingOffice", label: "Office", type: "text", ... },
  { id: "totalBreakdownCost", label: "Budget", type: "currency", ... },
  { id: "status", label: "Status", type: "status", ... },
  // ...
];

export const CURRENCY_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
};
```

---

## Related Documentation

- [Table Components](./06-table-components.md)
- [Component Patterns](./09-component-patterns.md)