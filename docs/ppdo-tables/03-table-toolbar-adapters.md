# Table Toolbar Adapters

Adapters are thin wrapper components that maintain backward compatibility while using the unified `TableToolbar` internally.

## Purpose

Adapters serve three key functions:

1. **Backward Compatibility**: Existing code continues to work without changes
2. **Domain-Specific Defaults**: Pre-configured titles, placeholders, and columns
3. **Legacy Prop Translation**: Convert old prop patterns to new bulk actions format

## Available Adapters

### 1. BudgetTableToolbar

**Location**: `components/ppdo/table/toolbar/adapters/BudgetTableToolbar.tsx`

```typescript
interface BudgetTableToolbarProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;

  // Selection
  selectedCount: number;
  onClearSelection: () => void;

  // Column Visibility
  hiddenColumns: Set<string>;
  onToggleColumn: (columnId: string, isChecked: boolean) => void;
  onShowAllColumns: () => void;
  onHideAllColumns: () => void;

  // Export/Print
  onExportCSV: () => void;
  onOpenPrintPreview: () => void;

  // Actions
  isAdmin: boolean;
  pendingRequestsCount: number | undefined;
  onOpenShare: () => void;
  onOpenTrash: () => void;
  onBulkTrash: () => void;
  onAddNew?: () => void;

  // Auto-Calculate Toggle
  onBulkToggleAutoCalculate?: () => void;

  // Draft indicator
  hasPrintDraft?: boolean;

  // UI State
  expandButton?: React.ReactNode;
  accentColor: string;
}
```

**Default Configuration**:
- `title`: "Budget Items"
- `searchPlaceholder`: "Search budget items..."
- `addButtonLabel`: "Add New"
- `columns`: Uses `BUDGET_TABLE_COLUMNS` from constants

**Usage**:
```tsx
import { BudgetTableToolbar } from "@/components/features/ppdo/table/toolbar";

<BudgetTableToolbar
  searchQuery={search}
  onSearchChange={setSearch}
  // ... other props
  accentColor="#3b82f6"
/>
```

### 2. ProjectsTableToolbar

**Location**: `components/ppdo/table/toolbar/adapters/ProjectsTableToolbar.tsx`

```typescript
interface ProjectsTableToolbarProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;

  // Selection
  selectedCount: number;
  onClearSelection: () => void;

  // Bulk Actions
  canManageBulkActions: boolean;
  onBulkCategoryChange: (categoryId: any) => void;

  // Column Visibility
  hiddenColumns: Set<string>;
  onToggleColumn: (columnId: string, isChecked: boolean) => void;
  onShowAllColumns: () => void;
  onHideAllColumns: () => void;

  // Export/Print
  onExportCSV: () => void;
  onPrint?: () => void;
  onOpenPrintPreview?: () => void;
  hasPrintDraft?: boolean;

  // Trash
  onOpenTrash?: () => void;
  onBulkTrash: () => void;

  // Share
  isAdmin: boolean;
  pendingRequestsCount: number | undefined;
  onOpenShare: () => void;

  // Auto-Calculate Toggle
  onBulkToggleAutoCalculate?: () => void;

  // Add Project
  onAddProject?: () => void;

  // Expand Button
  expandButton?: React.ReactNode;

  accentColor: string;
}
```

**Default Configuration**:
- `title`: "Projects"
- `searchPlaceholder`: "Search projects..."
- `addButtonLabel`: "Add Project"
- `columns`: Uses `AVAILABLE_COLUMNS` from projects constants

**Usage**:
```tsx
import { ProjectsTableToolbar } from "@/components/features/ppdo/table/toolbar";

<ProjectsTableToolbar
  searchQuery={search}
  onSearchChange={setSearch}
  canManageBulkActions={hasEditAccess}
  onBulkCategoryChange={handleCategoryChange}
  // ... other props
  accentColor="#10b981"
/>
```

### 3. FundsTableToolbar

**Location**: `components/ppdo/table/toolbar/adapters/FundsTableToolbar.tsx`

```typescript
interface FundsTableToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  selectedCount: number;
  onClearSelection: () => void;
  hiddenColumns: Set<string>;
  onToggleColumn: (columnId: string, isChecked: boolean) => void;
  onShowAllColumns: () => void;
  onHideAllColumns: () => void;
  onExportCSV: () => void;
  onPrint?: () => void;
  onOpenPrintPreview?: () => void;
  hasPrintDraft?: boolean;
  isAdmin: boolean;
  onOpenTrash?: () => void;
  onBulkTrash: () => void;
  onAddNew?: () => void;
  accentColor: string;
  title?: string;
  searchPlaceholder?: string;
}
```

**Default Configuration**:
- `title`: "Funds" (customizable)
- `searchPlaceholder`: "Search funds..." (customizable)
- `addButtonLabel`: "Add New Item"
- `columns`: Uses `AVAILABLE_COLUMNS` from funds constants

**Usage**:
```tsx
import { FundsTableToolbar } from "@/components/features/ppdo/table/toolbar";

<FundsTableToolbar
  title="Trust Funds"
  searchPlaceholder="Search trust funds..."
  searchQuery={search}
  onSearchChange={setSearch}
  // ... other props
  accentColor="#f59e0b"
/>
```

## Legacy Prop Translation

Adapters convert legacy props to the new `bulkActions` format:

```tsx
// Inside adapter
const bulkActions: BulkAction[] = [];

if (onBulkToggleAutoCalculate) {
  bulkActions.push({
    id: "auto-calculate",
    label: "Toggle Auto-Calculate",
    icon: <Calculator className="w-4 h-4" />,
    onClick: onBulkToggleAutoCalculate,
    showWhen: (count) => count > 0,
  });
}

return (
  <TableToolbar
    // ... core props
    bulkActions={bulkActions.length > 0 ? bulkActions : undefined}
  />
);
```

## Import Patterns

**From Unified Index (Recommended)**:
```tsx
import {
  BudgetTableToolbar,
  ProjectsTableToolbar,
  FundsTableToolbar
} from "@/components/features/ppdo/table/toolbar";
```

**From Core (Direct Access)**:
```tsx
import { TableToolbar } from "@/components/features/ppdo/table/toolbar/TableToolbar";
```

## Creating a New Adapter

To create an adapter for a new table type:

```tsx
"use client";

import React from "react";
import { TableToolbar } from "../TableToolbar";
import { BulkAction } from "../types";
import { MY_TABLE_COLUMNS } from "@/path/to/constants";

export interface MyTableToolbarProps {
  // ... define domain-specific props
}

export function MyTableToolbar(props: MyTableToolbarProps) {
  // 1. Convert legacy props to bulkActions
  const bulkActions: BulkAction[] = [];
  // ... add actions as needed

  // 2. Return unified toolbar with domain defaults
  return (
    <TableToolbar
      title="My Table"
      searchPlaceholder="Search my items..."
      addButtonLabel="Add New"
      columns={MY_TABLE_COLUMNS.map(col => ({
        key: col.id,
        label: col.label
      }))}
      bulkActions={bulkActions.length > 0 ? bulkActions : undefined}
      {...props}
    />
  );
}
```