# Column Visibility System

The column visibility system allows users to show/hide table columns through a dropdown menu interface.

## Components

### 1. TableToolbarColumnVisibility (Core)

**Location**: `components/ppdo/table/toolbar/TableToolbarColumnVisibility.tsx`

This is the default column visibility component used by the unified `TableToolbar`.

```typescript
interface ColumnVisibilityMenuProps {
  columns?: { key: string; label: string }[];
  hiddenColumns: Set<string>;
  onToggleColumn: (columnId: string, isChecked: boolean) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}
```

**Features**:
- Checkbox items for each column
- "Show All" / "Hide All" actions
- Automatic column name formatting (camelCase/snake_case to Title Case)
- Fallback to hiddenColumns keys if columns not provided

**Usage**:
```tsx
<TableToolbarColumnVisibility
  columns={[
    { key: "name", label: "Name" },
    { key: "amount", label: "Amount" },
  ]}
  hiddenColumns={hiddenColumns}
  onToggleColumn={handleToggle}
  onShowAll={showAllColumns}
  onHideAll={hideAllColumns}
/>
```

---

### 2. ColumnVisibilityMenu (Projects/20% DF)

**Location**: `components/ppdo/projects/components/ProjectsTable/ColumnVisibilityMenu.tsx`

Wraps the base `ColumnVisibilityMenu` with project-specific columns.

```tsx
import { ColumnVisibilityMenu as BaseColumnVisibilityMenu } from "@/components/ColumnVisibilityMenu";
import { AVAILABLE_COLUMNS } from "../../constants";

export function ColumnVisibilityMenu(props) {
  const columns = AVAILABLE_COLUMNS.map(col => ({
    key: col.id,
    label: col.label,
  }));

  return (
    <BaseColumnVisibilityMenu
      columns={columns}
      label="Toggle Columns"
      showCount={true}
      {...props}
    />
  );
}
```

---

### 3. BudgetColumnVisibilityMenu

**Location**: `components/ppdo/table/toolbar/BudgetColumnVisibilityMenu.tsx`

A minimal implementation used in the legacy budget toolbar.

```tsx
interface BudgetColumnVisibilityMenuProps {
  hiddenColumns: Set<string>;
  onToggleColumn: (columnId: string, isChecked: boolean) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}
```

---

### 4. Inline Column Visibility (Funds)

**Location**: `components/ppdo/funds/components/toolbar/FundsTableToolbar.tsx`

The funds toolbar implements column visibility inline within the toolbar component:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">
      <Eye className="w-4 h-4" />
      Columns
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
    {AVAILABLE_COLUMNS.map((column) => (
      <DropdownMenuCheckboxItem
        key={column.id}
        checked={!hiddenColumns.has(column.id)}
        onCheckedChange={(checked) => onToggleColumn(column.id, checked)}
      >
        {column.label}
      </DropdownMenuCheckboxItem>
    ))}
    <DropdownMenuItem onClick={onShowAllColumns}>
      Show All Columns
    </DropdownMenuItem>
    <DropdownMenuItem onClick={onHideAllColumns}>
      Hide All Columns
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Column Constants

Each table type defines its available columns in a constants file:

### Budget Columns
**Location**: `components/ppdo/11_project_plan/constants/index.ts`

```typescript
export const BUDGET_TABLE_COLUMNS = [
  { key: "particular", label: "Particulars", sortable: true, align: "left" },
  { key: "year", label: "Year", filterable: true, align: "center" },
  { key: "status", label: "Status", filterable: true, align: "center" },
  { key: "totalBudgetAllocated", label: "Budget Allocated", sortable: true, align: "right" },
  { key: "obligatedBudget", label: "Obligated Budget", sortable: true, align: "right" },
  { key: "totalBudgetUtilized", label: "Budget Utilized", sortable: true, align: "right" },
  { key: "utilizationRate", label: "Utilization Rate", sortable: true, align: "right" },
  { key: "projectCompleted", label: "Completed", sortable: true, align: "right" },
  { key: "projectDelayed", label: "Delayed", sortable: true, align: "right" },
  { key: "projectsOngoing", label: "Ongoing", sortable: true, align: "right" },
] as const;
```

### Project Columns
**Location**: `components/ppdo/projects/constants/index.ts`

```typescript
export const AVAILABLE_COLUMNS: TableColumn[] = [
  { id: "particulars", label: "Particulars", sortable: true, align: "left" },
  { id: "implementingOffice", label: "Implementing Office", filterable: true, align: "left" },
  { id: "year", label: "Year", filterable: true, align: "center" },
  { id: "status", label: "Status", filterable: true, align: "left" },
  { id: "totalBudgetAllocated", label: "Allocated Budget", sortable: true, align: "right" },
  { id: "obligatedBudget", label: "Obligated Budget", sortable: true, align: "right" },
  { id: "totalBudgetUtilized", label: "Utilized Budget", sortable: true, align: "right" },
  { id: "utilizationRate", label: "Utilization Rate", sortable: true, align: "right" },
  { id: "projectCompleted", label: "Completed", sortable: true, align: "right" },
  { id: "projectDelayed", label: "Delayed", sortable: true, align: "right" },
  { id: "projectsOngoing", label: "Ongoing", sortable: true, align: "right" },
  { id: "remarks", label: "Remarks", align: "left" },
];
```

### Funds Columns
**Location**: `components/ppdo/funds/constants/index.ts`

```typescript
export const AVAILABLE_COLUMNS = [
  { id: "projectTitle", label: "Project Title", resizable: true },
  { id: "officeInCharge", label: "Office In-Charge" },
  { id: "status", label: "Status" },
  { id: "dateReceived", label: "Date Received" },
  { id: "received", label: "Received" },
  { id: "obligatedPR", label: "Obligated PR" },
  { id: "utilized", label: "Utilized" },
  { id: "utilizationRate", label: "Utilization %" },
  { id: "balance", label: "Balance" },
  { id: "remarks", label: "Remarks", resizable: true },
] as const;
```

---

## Custom Column Visibility Component

To use a custom column visibility component with `TableToolbar`:

```tsx
function MyColumnVisibilityMenu({ columns, hiddenColumns, onToggleColumn, onShowAll, onHideAll }) {
  // Custom implementation
  return (
    <MyCustomDropdown>
      {/* Custom UI */}
    </MyCustomDropdown>
  );
}

<TableToolbar
  columnVisibilityComponent={MyColumnVisibilityMenu}
  columns={myColumns}
  hiddenColumns={hiddenColumns}
  onToggleColumn={handleToggle}
  onShowAllColumns={showAll}
  onHideAllColumns={hideAll}
/>
```

---

## Column Name Formatting

The `TableToolbarColumnVisibility` component includes automatic name formatting:

```typescript
function formatColumnName(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")     // Add space before capitals
    .replace(/_/g, " ")              // Replace underscores with spaces
    .replace(/^\s+|\s+$/g, "")       // Trim
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Examples:
// "budgetAmount" => "Budget Amount"
// "fiscal_year"  => "Fiscal Year"
// "totalBudgetAllocated" => "Total Budget Allocated"
```

---

## Persistence

Column visibility state persists via the `useTableColumnVisibility` hook:

- **Storage Key**: `table-column-visibility-{tableId}`
- **Stored Data**: JSON array of hidden column IDs
- **Auto-Save**: Saves on every toggle
- **Auto-Load**: Restores on component mount
