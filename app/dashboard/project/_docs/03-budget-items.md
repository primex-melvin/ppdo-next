# Budget Items (Year View)

> Level 1: Managing budget items for a fiscal year

---

## Overview

The Budget Items page displays all budget allocations for a specific fiscal year. It's the entry point for project management.

**Route:** `/dashboard/project/[year]`  
**File:** `app/dashboard/project/[year]/page.tsx`

---

## Features

### 1. Statistics Display

**BudgetStatistics Component**

Shows summary cards:
- **Total Allocated**: Sum of all budget item allocations
- **Total Utilized**: Sum of all utilized budgets
- **Total Obligated**: Sum of all obligated amounts
- **Average Utilization Rate**: Average across all items
- **Total Projects**: Count of budget items

```typescript
interface BudgetStatisticsProps {
  totalAllocated: number;
  totalUtilized: number;
  totalObligated: number;
  averageUtilizationRate: number;
  totalProjects: number;
}
```

### 2. Budget Tracking Table

**BudgetTrackingTable Component**

Main data table with features:

| Feature | Description |
|---------|-------------|
| Column Sorting | Click headers to sort |
| Column Resize | Drag column borders |
| Column Reorder | Drag-drop headers |
| Row Selection | Checkbox selection |
| Bulk Actions | Delete, toggle status |
| Context Menu | Right-click actions |
| Print Preview | Generate printable view |

**Table Columns:**
- Particular (with code)
- Total Budget Allocated
- Total Budget Utilized
- Obligated Budget
- Utilization Rate
- Status (Active/Inactive)
- Actions

### 3. Budget Item Form

**BudgetItemForm Component**

Form for creating/editing budget items:

```typescript
interface BudgetItemFormProps {
  initialData?: Partial<BudgetItem>;
  year: number;
  onSubmit: (data: BudgetFormValues) => Promise<void>;
  onCancel?: () => void;
}
```

**Form Fields:**
- **Year**: Fiscal year (read-only if editing)
- **Particular**: Dropdown of budget particulars
- **Allocated Budget**: Manual input or auto-calculate
- **Auto-calculate**: Toggle to calculate from projects

### 4. Modals

| Modal | Purpose |
|-------|---------|
| BudgetModal | Wrapper for add/edit form |
| BudgetExpandModal | Full-screen table view |
| BudgetShareModal | Share via link/email |
| BudgetViolationModal | Warning for budget issues |
| BudgetConfirmationModal | Confirm actions |
| BudgetBulkToggleDialog | Bulk status change |

---

## Component Structure

```
YearBudgetPage
│
├── YearBudgetPageHeader
│   ├── Title: "Budget Items 2025"
│   ├── Back button
│   ├── Add Budget Item button
│   └── Action menu
│
├── BudgetStatistics (5 cards)
│
├── BudgetTrackingTable
│   ├── BudgetTableToolbar
│   │   ├── Search input
│   │   ├── ColumnVisibilityMenu
│   │   ├── BulkActions (when selected)
│   │   └── Print button
│   ├── BudgetTableHeader
│   │   └── Sortable columns
│   ├── BudgetTableBody
│   │   └── BudgetTableRow (selectable)
│   └── BudgetTableTotalsRow
│
└── BudgetModal (conditional)
    └── BudgetItemForm
```

---

## Hooks

### useBudgetData

Fetches budget data for the year.

```typescript
const {
  budgetItems,
  statistics,
  isLoading,
  error,
  refetch,
} = useBudgetData(year);
```

### useBudgetMutations

CRUD operations for budget items.

```typescript
const {
  handleAdd,
  handleEdit,
  handleDelete,
  handleBulkDelete,
  handleBulkToggle,
  isSubmitting,
} = useBudgetMutations();
```

### useBudgetAccess

Permission checking.

```typescript
const {
  canAccess,
  canCreate,
  canEdit,
  canDelete,
  isLoading,
} = useBudgetAccess();
```

### useBudgetTableState

Table state management.

```typescript
const {
  selectedIds,
  sortConfig,
  filters,
  columnVisibility,
  setSortConfig,
  setFilters,
  toggleColumnVisibility,
  selectAll,
  selectRow,
} = useBudgetTableState();
```

---

## Types

```typescript
// _types/budget.types.ts

interface BudgetItem {
  _id: Id<"budgetItems">;
  _creationTime: number;
  year: number;
  particularId: Id<"budgetParticulars">;
  particularName?: string;
  totalBudgetAllocated: number;
  totalBudgetUtilized: number;
  obligatedBudget?: number;
  utilizationRate: number;
  isActive: boolean;
  createdBy: Id<"users">;
}

interface BudgetFormValues {
  year: number;
  particularId: string;
  totalBudgetAllocated: number;
  autoCalculate: boolean;
}

interface BudgetStatistics {
  totalAllocated: number;
  totalUtilized: number;
  totalObligated: number;
  averageUtilizationRate: number;
  totalProjects: number;
}
```

---

## Budget Calculations

### Auto-calculation

When `autoCalculate` is enabled:

```typescript
const calculatedAllocated = projects.reduce(
  (sum, p) => sum + p.totalBudget, 
  0
);
```

### Utilization Rate

```typescript
const utilizationRate = allocated > 0 
  ? (utilized / allocated) * 100 
  : 0;
```

---

## Usage Example

```tsx
"use client";

export default function YearBudgetPage({ params }: { params: { year: string } }) {
  const year = parseInt(params.year);
  
  const { canAccess, isLoading: checkingAccess } = useBudgetAccess();
  const { budgetItems, statistics, isLoading: loadingData } = useBudgetData(year);
  const mutations = useBudgetMutations();
  
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  
  if (checkingAccess || loadingData) return <LoadingState />;
  if (!canAccess) return <AccessDeniedPage />;
  
  return (
    <div className="space-y-6">
      <YearBudgetPageHeader
        year={year}
        onAdd={() => {
          setEditingItem(null);
          setShowModal(true);
        }}
      />
      
      <BudgetStatistics {...statistics} />
      
      <BudgetTrackingTable
        data={budgetItems}
        onEdit={(item) => {
          setEditingItem(item);
          setShowModal(true);
        }}
        onDelete={mutations.handleDelete}
      />
      
      <BudgetModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? "Edit Budget Item" : "Add Budget Item"}
      >
        <BudgetItemForm
          initialData={editingItem}
          year={year}
          onSubmit={editingItem 
            ? mutations.handleEdit 
            : mutations.handleAdd
          }
          onCancel={() => setShowModal(false)}
        />
      </BudgetModal>
    </div>
  );
}
```

---

## Related Documentation

- [Projects List](./04-projects-list.md)
- [Hooks & Data Flow](./07-hooks-data-flow.md)
