# Funds Components

> Trust Funds, Special Education Funds, and Special Health Funds components

---

## Overview

The Funds module provides components for managing special purpose funds:
- **Trust Funds** - Project organs and trust funds
- **Special Education Funds (SEF)** - Education allocations
- **Special Health Funds (SHF)** - Health allocations

All fund types share the same component architecture.

**File Location:** `components/ppdo/funds/`

---

## Component Inventory

### Table Components (`funds/components/`)

#### FundsTable
Main table for fund items.

```typescript
interface FundsTableProps {
  funds: Fund[];
  breakdowns: FundBreakdown[];
  columns: ColumnConfig[];
  onEdit?: (fund: Fund) => void;
  onDelete?: (id: string) => void;
  onAddBreakdown?: (fundId: string) => void;
}
```

**Features:**
- Expandable rows showing breakdowns
- Column resize/reorder
- Row selection
- Sorting
- Totals calculation

---

#### FundsTable Subcomponents

| Component | Purpose |
|-----------|---------|
| `FundsTableHeader` | Column headers with sort |
| `FundsTableBody` | Table body |
| `FundsTableRow` | Individual row with expand |
| `FundsTableTotalRow` | Summary row |

---

### Header & Statistics

#### FundsPageHeader
Page header for funds views.

```typescript
interface FundsPageHeaderProps {
  title: string;
  subtitle?: string;
  year: number;
  onAddFund?: () => void;
  onPrint?: () => void;
}
```

#### FundsStatistics
Statistics cards display.

```typescript
interface FundsStatisticsProps {
  totalReceived: number;
  totalUtilized: number;
  totalBalance: number;
  fundCount: number;
  breakdownCount: number;
  avgUtilizationRate: number;
}
```

---

### Kanban View

#### FundsKanban
Kanban board view for funds.

```typescript
interface FundsKanbanProps {
  funds: Fund[];
  columns: KanbanColumnConfig[];
  onMove: (fundId: string, targetColumn: string) => void;
}
```

---

### Context Menu

#### FundsContextMenu
Right-click menu for fund rows.

```typescript
interface FundsContextMenuProps {
  fund: Fund;
  onEdit: () => void;
  onDelete: () => void;
  onAddBreakdown: () => void;
  onPrint: () => void;
}
```

---

## Form Components (`funds/form/`)

### FundForm
Form for creating/editing funds.

```typescript
interface FundFormProps {
  initialData?: Partial<Fund>;
  year: number;
  onSubmit: (data: FundFormValues) => Promise<void>;
  onCancel?: () => void;
}
```

**Fields:**
- Fund Name
- Description
- Amount Received
- Amount Utilized (calculated)
- Balance (calculated)
- Reference Number
- Date Received

---

## Hooks

### useFundsData
Fetches fund data for a year.

```typescript
const {
  funds,
  breakdowns,
  isLoading,
  error,
  refetch,
} = useFundsData({
  year: number;
  includeInactive?: boolean;
});
```

### useFundsMutations
CRUD operations for funds.

```typescript
const {
  createFund,
  updateFund,
  deleteFund,
  createBreakdown,
  updateBreakdown,
  deleteBreakdown,
  isLoading,
} = useFundsMutations();
```

### useFundsPrintDraft
Manages print preview state.

```typescript
const {
  draft,
  saveDraft,
  loadDraft,
  clearDraft,
  applyTemplate,
} = useFundsPrintDraft();
```

### Table Hooks

```typescript
// Sorting
const { sortConfig, setSortConfig, sortedData } = useTableSort(data);

// Filtering
const { filters, setFilter, filteredData } = useTableFilter(data);

// Selection
const { selectedIds, toggleSelection, selectAll } = useTableSelection(data);

// Column resize
const { widths, startResize } = useColumnResize(initialWidths);
```

---

## Types

```typescript
// types/index.ts

// Base fund interface (shared across fund types)
interface BaseFund {
  _id: Id<"trustFunds" | "specialEducationFunds" | "specialHealthFunds">;
  _creationTime: number;
  year: number;
  name: string;
  description?: string;
  received: number;
  utilized: number;
  balance: number;
  utilizationRate: number;
  isActive: boolean;
  createdBy: Id<"users">;
}

// Specific fund types
type TrustFund = BaseFund & { _table: "trustFunds" };
type SpecialEducationFund = BaseFund & { _table: "specialEducationFunds" };
type SpecialHealthFund = BaseFund & { _table: "specialHealthFunds" };

// Breakdown
interface FundBreakdown {
  _id: string;
  fundId: string;
  description: string;
  amount: number;
  date: number;
  reference?: string;
}

// Form values
interface FundFormValues {
  name: string;
  description?: string;
  received: number;
  reference?: string;
  dateReceived: number;
}
```

---

## Utilities

```typescript
// utils/index.ts

// Calculate fund statistics
calculateFundStats(funds: Fund[]): {
  totalReceived: number;
  totalUtilized: number;
  totalBalance: number;
  avgUtilizationRate: number;
};

// Format fund type label
formatFundType(type: FundType): string;
// "trust-funds" â†’ "Trust Fund"

// Get breakdowns for fund
getFundBreakdowns(fundId: string, allBreakdowns: FundBreakdown[]);
```

---

## Print Adapter

### FundsPrintAdapter

```typescript
const adapter = new FundsPrintAdapter({
  funds,
  breakdowns,
  year,
  fundType: "trust-funds",
  columns,
});

const printData = adapter.toPrintFormat();
```

---

## Usage Example

### Trust Funds Page

```tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  FundsTable,
  FundsPageHeader,
  FundsStatistics,
  FundForm,
} from "@/components/features/ppdo/funds";
import { useState } from "react";

export default function TrustFundsPage({
  params,
}: {
  params: { year: string };
}) {
  const [showForm, setShowForm] = useState(false);
  const year = parseInt(params.year);
  
  const funds = useQuery(api.trustFunds.getByYear, { year });
  const breakdowns = useQuery(api.trustFundBreakdowns.getByYear, { year });
  
  if (!funds || !breakdowns) return <LoadingState />;
  
  const stats = calculateFundStats(funds);
  
  return (
    <div className="space-y-6">
      <FundsPageHeader
        title="Trust Funds"
        subtitle="Project Organs"
        year={year}
        onAddFund={() => setShowForm(true)}
      />
      
      <FundsStatistics {...stats} />
      
      <FundsTable
        funds={funds}
        breakdowns={breakdowns}
        columns={TRUST_FUND_COLUMNS}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      
      {showForm && (
        <FundForm
          year={year}
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

- [Table Components](./06-table-components.md)
- [Dashboard Components](./03-dashboard-components.md)