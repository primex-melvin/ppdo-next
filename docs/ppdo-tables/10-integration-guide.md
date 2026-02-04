# Integration Guide

This guide walks through implementing the PPDO table toolbar system in a new table component.

## Quick Start

### Step 1: Import Hooks and Components

```tsx
"use client";

import { useRef } from "react";
import {
  useTableSearch,
  useTableSelection,
  useTableColumnVisibility,
} from "@/hooks";
import { TableToolbar } from "@/components/ppdo/table/toolbar";
```

### Step 2: Define Column Constants

Create a constants file for your table:

```tsx
// constants/index.ts
export const MY_TABLE_COLUMNS = [
  { key: "name", label: "Name", sortable: true },
  { key: "status", label: "Status", filterable: true },
  { key: "amount", label: "Amount", sortable: true },
  { key: "date", label: "Date", sortable: true },
  { key: "notes", label: "Notes" },
] as const;
```

### Step 3: Initialize Hooks

```tsx
export function MyTable({ data }) {
  // Search hook
  const search = useTableSearch<MyItem>(data, {
    filterFn: (item, query) =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.notes?.toLowerCase().includes(query.toLowerCase()),
  });

  // Selection hook
  const allIds = data.map(item => item._id);
  const selection = useTableSelection<string>(allIds);

  // Column visibility hook
  const columns = useTableColumnVisibility("my-table", {
    defaultVisible: ["name", "status", "amount", "date"],
    defaultHidden: ["notes"],
    allColumns: MY_TABLE_COLUMNS.map(c => c.key),
  });

  // Filter data
  const filteredData = search.filterItems(data);

  // ...
}
```

### Step 4: Add Toolbar

```tsx
return (
  <div className="flex flex-col h-full">
    <TableToolbar
      // Title
      title="My Items"
      searchPlaceholder="Search items..."
      addButtonLabel="Add Item"
      accentColor="#3b82f6"

      // Search
      searchQuery={search.query}
      onSearchChange={search.setQuery}
      searchInputRef={search.inputRef}

      // Selection
      selectedCount={selection.count}
      onClearSelection={selection.clearAll}

      // Column Visibility
      columns={MY_TABLE_COLUMNS.map(c => ({ key: c.key, label: c.label }))}
      hiddenColumns={columns.hiddenColumns}
      onToggleColumn={columns.toggleColumn}
      onShowAllColumns={columns.showAll}
      onHideAllColumns={columns.hideAll}

      // Trash
      onBulkTrash={handleBulkTrash}
      onOpenTrash={() => setShowTrashModal(true)}

      // Export
      onExportCSV={handleExportCSV}
      onOpenPrintPreview={() => setShowPrintPreview(true)}

      // Add
      onAddNew={() => setShowAddModal(true)}
    />

    <div className="flex-1 overflow-auto">
      <MyTableBody
        data={filteredData}
        visibleColumns={columns.visibleColumns}
        selectedIds={selection.selectedIds}
        onToggleRow={selection.toggleId}
      />
    </div>
  </div>
);
```

---

## Complete Example

```tsx
"use client";

import { useState, useRef } from "react";
import {
  useTableSearch,
  useTableSelection,
  useTableColumnVisibility,
} from "@/hooks";
import { TableToolbar } from "@/components/ppdo/table/toolbar";
import { Calculator } from "lucide-react";

// Types
interface MyItem {
  _id: string;
  name: string;
  status: "active" | "inactive";
  amount: number;
  date: string;
  notes?: string;
}

// Constants
const MY_TABLE_COLUMNS = [
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
  { key: "amount", label: "Amount" },
  { key: "date", label: "Date" },
  { key: "notes", label: "Notes" },
];

interface MyTableProps {
  data: MyItem[];
  isAdmin: boolean;
  pendingRequestsCount?: number;
}

export function MyTable({ data, isAdmin, pendingRequestsCount }: MyTableProps) {
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Search
  const search = useTableSearch<MyItem>(data, {
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
      );
    },
  });

  // Selection
  const allIds = data.map(item => item._id);
  const selection = useTableSelection<string>(allIds);

  // Column Visibility
  const columns = useTableColumnVisibility("my-table", {
    defaultVisible: ["name", "status", "amount", "date"],
    defaultHidden: ["notes"],
    allColumns: MY_TABLE_COLUMNS.map(c => c.key),
  });

  // Handlers
  const handleBulkTrash = async () => {
    const ids = Array.from(selection.selectedIds);
    await trashItems(ids);
    selection.clearAll();
  };

  const handleBulkAutoCalculate = async () => {
    const ids = Array.from(selection.selectedIds);
    await toggleAutoCalculate(ids);
    selection.clearAll();
  };

  const handleExportCSV = () => {
    const visibleData = filteredData.map(item => {
      const row: Record<string, any> = {};
      columns.visibleColumns.forEach(col => {
        row[col] = item[col as keyof MyItem];
      });
      return row;
    });
    exportToCSV(visibleData, "my-items-export.csv");
  };

  // Filter data
  const filteredData = search.filterItems(data);

  // Bulk actions
  const bulkActions = [
    {
      id: "auto-calculate",
      label: "Toggle Auto-Calculate",
      icon: <Calculator className="w-4 h-4" />,
      onClick: handleBulkAutoCalculate,
      showWhen: (count: number) => count > 0,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-lg border">
      {/* Toolbar */}
      <TableToolbar
        // Identity
        title="My Items"
        searchPlaceholder="Search by name, status, or notes..."
        addButtonLabel="Add Item"
        accentColor="#3b82f6"

        // Search
        searchQuery={search.query}
        onSearchChange={search.setQuery}
        searchInputRef={search.inputRef}

        // Selection
        selectedCount={selection.count}
        onClearSelection={selection.clearAll}

        // Columns
        columns={MY_TABLE_COLUMNS.map(c => ({ key: c.key, label: c.label }))}
        hiddenColumns={columns.hiddenColumns}
        onToggleColumn={columns.toggleColumn}
        onShowAllColumns={columns.showAll}
        onHideAllColumns={columns.hideAll}

        // Bulk Actions
        bulkActions={bulkActions}
        onBulkTrash={handleBulkTrash}
        onOpenTrash={() => setShowTrashModal(true)}

        // Export
        onExportCSV={handleExportCSV}
        onOpenPrintPreview={() => setShowPrintPreview(true)}

        // Admin
        isAdmin={isAdmin}
        pendingRequestsCount={pendingRequestsCount}
        onOpenShare={() => setShowShareModal(true)}

        // Add
        onAddNew={() => setShowAddModal(true)}
      />

      {/* Table Body */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-12">
                <input
                  type="checkbox"
                  checked={selection.selectAllChecked}
                  ref={el => {
                    if (el) el.indeterminate = selection.isIndeterminate;
                  }}
                  onChange={e => selection.handleSelectAll(e.target.checked, allIds)}
                />
              </th>
              {columns.visibleColumns.map(col => (
                <th key={col}>
                  {MY_TABLE_COLUMNS.find(c => c.key === col)?.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr key={item._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selection.isSelected(item._id)}
                    onChange={() => selection.toggleId(item._id)}
                  />
                </td>
                {columns.visibleColumns.map(col => (
                  <td key={col}>{item[col as keyof MyItem]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAddModal && <AddModal onClose={() => setShowAddModal(false)} />}
      {showTrashModal && <TrashModal onClose={() => setShowTrashModal(false)} />}
      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}
      {showPrintPreview && <PrintPreview onClose={() => setShowPrintPreview(false)} />}
    </div>
  );
}
```

---

## Using an Adapter Instead

If you want to create a domain-specific adapter:

```tsx
// components/my-feature/MyTableToolbar.tsx
"use client";

import React from "react";
import { TableToolbar } from "@/components/ppdo/table/toolbar/TableToolbar";
import { MY_TABLE_COLUMNS } from "./constants";

export interface MyTableToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  selectedCount: number;
  onClearSelection: () => void;
  hiddenColumns: Set<string>;
  onToggleColumn: (columnId: string, isChecked: boolean) => void;
  onShowAllColumns: () => void;
  onHideAllColumns: () => void;
  onBulkTrash: () => void;
  onOpenTrash: () => void;
  onExportCSV: () => void;
  onAddNew?: () => void;
  accentColor: string;
}

export function MyTableToolbar(props: MyTableToolbarProps) {
  return (
    <TableToolbar
      title="My Items"
      searchPlaceholder="Search items..."
      addButtonLabel="Add Item"
      columns={MY_TABLE_COLUMNS.map(c => ({ key: c.key, label: c.label }))}
      {...props}
    />
  );
}
```

---

## Checklist

Before shipping your table implementation:

- [ ] All hooks initialized correctly
- [ ] Toolbar connected to hooks
- [ ] Column visibility persists to localStorage
- [ ] Selection cleared after bulk operations
- [ ] Mobile responsive layout tested
- [ ] Print preview working (if applicable)
- [ ] Export CSV includes only visible columns
- [ ] Admin features hidden from non-admins
- [ ] Accessibility: keyboard navigation works
- [ ] Error states handled gracefully
