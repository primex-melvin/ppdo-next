# Table Hooks

The PPDO table system provides three core hooks for managing table state. These hooks are designed to work together seamlessly with the toolbar components.

## Hook Locations

| Hook | Path |
|------|------|
| `useTableSearch` | `hooks/useTableSearch.ts` |
| `useTableSelection` | `hooks/useTableSelection.ts` |
| `useTableColumnVisibility` | `hooks/useTableColumnVisibility.ts` |

---

## 1. useTableSearch

Manages search input state with debouncing and optional filtering.

### Interface

```typescript
interface UseTableSearchOptions<T> {
  /** Initial search query */
  initialQuery?: string;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Optional function to filter items based on query */
  filterFn?: (item: T, query: string) => boolean;
}

interface UseTableSearchReturn<T> {
  /** Current search query */
  query: string;
  /** Set search query (debounced) */
  setQuery: (query: string) => void;
  /** Raw debounced query value */
  debouncedQuery: string;
  /** Clear search */
  clear: () => void;
  /** Ref to attach to search input */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Focus the search input */
  focus: () => void;
  /** Is search active */
  isActive: boolean;
  /** Filter items based on search (if filterFn provided) */
  filterItems: (items: T[]) => T[];
}
```

### Basic Usage

```tsx
const search = useTableSearch();

return (
  <input
    value={search.query}
    onChange={(e) => search.setQuery(e.target.value)}
    ref={search.inputRef}
    placeholder="Search..."
  />
);
```

### With Filter Function

```tsx
interface BudgetItem {
  _id: string;
  name: string;
  description?: string;
}

const search = useTableSearch<BudgetItem>(data, {
  filterFn: (item, query) =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.description?.toLowerCase().includes(query.toLowerCase()),
});

// Get filtered results
const filteredData = search.filterItems(data);
```

### With Toolbar Integration

```tsx
<TableToolbar
  searchQuery={search.query}
  onSearchChange={search.setQuery}
  searchInputRef={search.inputRef}
  onSearchFocus={() => search.focus()}
/>
```

---

## 2. useTableSelection

Manages row selection state with select-all functionality.

### Interface

```typescript
interface UseTableSelectionOptions<T> {
  /** Initial selected IDs */
  initialSelected?: Set<T>;
}

interface UseTableSelectionReturn<T> {
  /** Set of selected IDs */
  selectedIds: Set<T>;
  /** Toggle selection for a single ID */
  toggleId: (id: T) => void;
  /** Select multiple IDs */
  selectIds: (ids: T[]) => void;
  /** Deselect multiple IDs */
  deselectIds: (ids: T[]) => void;
  /** Select all available IDs */
  selectAll: (allIds: T[]) => void;
  /** Deselect all IDs */
  clearAll: () => void;
  /** Check if ID is selected */
  isSelected: (id: T) => boolean;
  /** Handle select all checkbox change */
  handleSelectAll: (checked: boolean, allIds?: T[]) => void;
  /** Is select all checkbox checked */
  selectAllChecked: boolean;
  /** Is select all checkbox in indeterminate state */
  isIndeterminate: boolean;
  /** Get count of selected items */
  count: number;
}
```

### Basic Usage

```tsx
const allIds = data.map(item => item._id);
const selection = useTableSelection<string>(allIds);

// In table header
<input
  type="checkbox"
  checked={selection.selectAllChecked}
  ref={(el) => {
    if (el) el.indeterminate = selection.isIndeterminate;
  }}
  onChange={(e) => selection.handleSelectAll(e.target.checked, allIds)}
/>

// In table row
<input
  type="checkbox"
  checked={selection.isSelected(item._id)}
  onChange={() => selection.toggleId(item._id)}
/>
```

### With Toolbar Integration

```tsx
<TableToolbar
  selectedCount={selection.count}
  onClearSelection={selection.clearAll}
  onBulkTrash={() => handleBulkTrash(Array.from(selection.selectedIds))}
/>
```

### Bulk Operations

```tsx
// Get selected items for operations
const selectedItems = data.filter(item =>
  selection.selectedIds.has(item._id)
);

// Clear after operation
const handleBulkDelete = async () => {
  await deleteItems(Array.from(selection.selectedIds));
  selection.clearAll();
};
```

---

## 3. useTableColumnVisibility

Manages column visibility state with localStorage persistence.

### Interface

```typescript
interface UseTableColumnVisibilityOptions {
  /** Columns visible by default */
  defaultVisible?: string[];
  /** Columns hidden by default */
  defaultHidden?: string[];
  /** All available columns */
  allColumns?: string[];
  /** Enable localStorage persistence (default: true) */
  persist?: boolean;
}

interface UseTableColumnVisibilityReturn {
  /** Set of hidden column IDs */
  hiddenColumns: Set<string>;
  /** Toggle column visibility */
  toggleColumn: (columnId: string, isChecked?: boolean) => void;
  /** Show all columns */
  showAll: () => void;
  /** Hide all columns */
  hideAll: () => void;
  /** Get visible columns */
  visibleColumns: string[];
  /** Check if column is visible */
  isVisible: (columnId: string) => boolean;
  /** Reset to default visibility */
  reset: () => void;
}
```

### Basic Usage

```tsx
const columns = useTableColumnVisibility("budget-items-table", {
  defaultVisible: ["id", "name", "amount", "status"],
  defaultHidden: ["notes", "createdBy"],
  allColumns: ["id", "name", "amount", "status", "notes", "createdBy"],
});

// In table header
{columns.visibleColumns.map(columnId => (
  <th key={columnId}>{getColumnLabel(columnId)}</th>
))}
```

### With Toolbar Integration

```tsx
<TableToolbar
  hiddenColumns={columns.hiddenColumns}
  onToggleColumn={(id, checked) => columns.toggleColumn(id, checked)}
  onShowAllColumns={columns.showAll}
  onHideAllColumns={columns.hideAll}
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'amount', label: 'Amount' },
    // ...
  ]}
/>
```

### LocalStorage Behavior

The hook automatically persists column visibility to localStorage:

- **Storage Key**: `table-column-visibility-{tableId}`
- **Format**: JSON array of hidden column IDs
- **On Load**: Restores from localStorage if available, falls back to defaults

```tsx
// Disable persistence
const columns = useTableColumnVisibility("temp-table", {
  persist: false,
});
```

---

## Combined Usage Example

```tsx
"use client";

import { useTableSearch, useTableSelection, useTableColumnVisibility } from "@/hooks";
import { TableToolbar } from "@/components/ppdo/table/toolbar";

export function BudgetTable({ data }) {
  // Search
  const search = useTableSearch<BudgetItem>(data, {
    filterFn: (item, query) =>
      item.name.toLowerCase().includes(query.toLowerCase()),
  });

  // Selection
  const allIds = data.map(item => item._id);
  const selection = useTableSelection<string>(allIds);

  // Columns
  const columns = useTableColumnVisibility("budget-table", {
    defaultVisible: ["name", "amount", "status"],
    defaultHidden: ["notes"],
    allColumns: ["name", "amount", "status", "notes"],
  });

  // Filter data
  const filteredData = search.filterItems(data);

  return (
    <>
      <TableToolbar
        // Search
        searchQuery={search.query}
        onSearchChange={search.setQuery}
        searchInputRef={search.inputRef}

        // Selection
        selectedCount={selection.count}
        onClearSelection={selection.clearAll}

        // Columns
        hiddenColumns={columns.hiddenColumns}
        onToggleColumn={columns.toggleColumn}
        onShowAllColumns={columns.showAll}
        onHideAllColumns={columns.hideAll}

        // Other props
        onBulkTrash={() => handleTrash(selection.selectedIds)}
        accentColor="#3b82f6"
      />

      <Table
        data={filteredData}
        visibleColumns={columns.visibleColumns}
        selectedIds={selection.selectedIds}
        onToggleRow={selection.toggleId}
      />
    </>
  );
}
```
