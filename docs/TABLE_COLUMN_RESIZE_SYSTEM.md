# Table Column Resize System Documentation

> **Comprehensive Guide**: How column resizing works across all PPDO dashboard tables.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Pages Using Resizable Tables](#pages-using-resizable-tables)
3. [Architecture & Data Flow](#architecture--data-flow)
4. [User Experience](#user-experience)
5. [Implementation Details](#implementation-details)
6. [Database Schema & Persistence](#database-schema--persistence)
7. [Permission System](#permission-system)
8. [API Reference](#api-reference)
9. [Configuration Guide](#configuration-guide)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The PPDO Table Column Resize System enables users to customize column widths through an intuitive drag-and-drop interface. Column widths are **persisted to the database**, ensuring preferences are maintained across sessions and devices.

### Key Features

| Feature | Description |
|---------|-------------|
| **Pixel-Perfect Resizing** | Drag column borders to exact pixel widths |
| **Persistent Storage** | Widths saved to Convex database per-user |
| **Min/Max Constraints** | Columns cannot be resized below minimum or above maximum widths |
| **Optimistic UI** | Immediate visual feedback during resize |
| **Debounced Saves** | Reduces database writes during rapid resizing |
| **Admin-Only Layout Edit** | Only admins can resize columns |

---

## Pages Using Resizable Tables

The following dashboard pages use the unified resizable table system:

### Project Planning & Budget

| URL Pattern | Page Component | Table Identifier | Description |
|-------------|----------------|------------------|-------------|
| `/dashboard/project/YYYY` | `YearBudgetPage` | `budgetItemsTable_v2` | Main budget tracking table |
| `/dashboard/project/YYYY/FGFDSGDSFS` | `ParticularProjectsPage` | `projectsTable_{particularId}` | Projects under a particular |
| `/dashboard/project/YYYY/FGFDSGDSFS/dafsdds-p57bctn8bmf0zfn4pdbpfm9qp57zm9jv` | `ProjectBreakdownPage` | `govtProjectBreakdowns` | Individual project breakdown |

### 20% Development Fund

| URL Pattern | Page Component | Table Identifier | Description |
|-------------|----------------|------------------|-------------|
| `/dashboard/20_percent_df/YYYY` | `YearTwentyPercentDFPage` | `twentyPercentDFTable_v2` | 20% DF main table |
| `/dashboard/20_percent_df/YYYY/asdsa-sx75rz0nv7zyby82zq9c8n5t5580qsvj` | `TwentyPercentDFBreakdownPage` | `twentyPercentDFBreakdowns` | 20% DF project breakdown |

### Trust Funds

| URL Pattern | Page Component | Table Identifier | Description |
|-------------|----------------|------------------|-------------|
| `/dashboard/trust-funds/YYYY` | `YearTrustFundsPage` | `trustFundsTable` | Trust funds main table |
| `/dashboard/trust-funds/YYYY/[slug]` | `TrustFundBreakdownPage` | `trustFundBreakdowns` | Trust fund project breakdown |

### Special Education Funds (SEF)

| URL Pattern | Page Component | Table Identifier | Description |
|-------------|----------------|------------------|-------------|
| `/dashboard/special-education-funds/YYYY` | `YearSEFPage` | `sefTable` | SEF main table |
| `/dashboard/special-education-funds/YYYY/[slug]` | `SEFBreakdownPage` | `specialEducationFundBreakdowns` | SEF project breakdown |

### Special Health Funds (SHF)

| URL Pattern | Page Component | Table Identifier | Description |
|-------------|----------------|------------------|-------------|
| `/dashboard/special-health-funds/YYYY` | `YearSHFPage` | `shfTable` | SHF main table |
| `/dashboard/special-health-funds/YYYY/[slug]` | `SHFBreakdownPage` | `specialHealthFundBreakdowns` | SHF project breakdown |

### Table Identifier Summary

```typescript
// All table identifiers used in the system
const TABLE_IDENTIFIERS = {
  // Main tables
  budgetItems: "budgetItemsTable_v2",
  twentyPercentDF: "twentyPercentDFTable_v2",
  trustFunds: "trustFundsTable",
  sef: "sefTable",
  shf: "shfTable",
  
  // Project breakdown tables (dynamic)
  projects: (particularId: string) => `projectsTable_${particularId}`,
  
  // Grandchild breakdown tables
  govtProjectBreakdowns: "govtProjectBreakdowns",
  trustFundBreakdowns: "trustFundBreakdowns",
  specialEducationFundBreakdowns: "specialEducationFundBreakdowns",
  specialHealthFundBreakdowns: "specialHealthFundBreakdowns",
  twentyPercentDFBreakdowns: "twentyPercentDFBreakdowns",
  
  // Legacy
  breakdown: "breakdown",
} as const;
```

---

## Architecture & Data Flow

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COLUMN RESIZE PIPELINE                             │
└─────────────────────────────────────────────────────────────────────────────┘

   User drags
   column border
        │
        ▼
┌─────────────────┐
│  ResizableTable │  Header cell with invisible 4px resize handle
│     Header      │  onMouseDown triggers resize start
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  useResizable   │────▶│  Mouse Events   │  Mouse move calculates delta
│    Columns      │◄────│  (mousemove/up) │  Mouse up ends resize
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│ updateColumnWidth│  Optimistic update to local state
│   (local state) │  updateColumnWidth(colKey, newWidth)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  saveWidthToDb  │  Debounced (300ms) database save
│   (debounced)   │  Prevents excessive DB writes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Convex Mutation │  api.tableSettings.updateColumnWidth
│  updateColumnWidth│  Inserts or updates userTableSettings
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Convex DB     │  userTableSettings table
│                 │  { userId, tableIdentifier, columns: [{fieldKey, width}] }
└─────────────────┘
```

### Component Hierarchy

```
Page Component (e.g., YearBudgetPage)
    │
    └── Table Component (e.g., BudgetTable)
            │
            ├── useResizableColumns Hook
            │       ├── useTableSettings (persistence)
            │       ├── useTableResize (resize logic)
            │       └── useColumnDragDrop (reordering)
            │
            ├── ResizableTableContainer
            │       │
            │       └── <table>
            │               │
            │               ├── ResizableTableHeader
            │               │       └── <th> with resize handle
            │               │
            │               └── ResizableTableRow (multiple)
            │                       └── <td> with calculated width
            │
            └── TableToolbar (column visibility, etc.)
```

### Resize Operation Flow

```typescript
// 1. User starts dragging
const startResizeColumn = (e: React.MouseEvent, index: number) => {
    // - Check canEditLayout permission
    // - Record startX, startWidth, columnKey
    // - Add mousemove/mouseup listeners to document
};

// 2. User drags (multiple times)
const handleMouseMove = (e: MouseEvent) => {
    // - Calculate delta = e.clientX - startX
    // - newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta))
    // - Optimistic update: updateColumnWidth(columnKey, newWidth)
    // - UI updates immediately
};

// 3. User releases mouse
const handleMouseUp = () => {
    // - Remove event listeners
    // - Debounced save to database triggers
    // - Final width persisted to Convex
};
```

---

## User Experience

### Resize Handle Interaction

```
┌─────────────────────────────────────────────────────────────┐
│ Project Name        │ Budget      │ Status    │ Year  │ Act│
│                     │             │           │       │    │
├─────────────────────┼─────────────┼───────────┼───────┼────┤
│ ↑                   │             │           │       │    │
│ Grip icon           │             │           │       │    │
│ (drag to reorder)   │             │           │       │    │
│                     │             │           │       │    │
│            ↓ 4px    │             │           │       │    │
│ ◄──────────┼────────►             │           │       │    │
│            │ invisible            │           │       │    │
│            │ resize handle        │           │       │    │
│            │ (hover = blue)       │           │       │    │
│            │                      │           │       │    │
│     cursor: col-resize           │           │       │    │
└─────────────────────────────────────────────────────────────┘
```

### Visual Feedback

| State | Visual Indicator |
|-------|------------------|
| **Default** | Transparent 4px handle at column right edge |
| **Hover** | Handle turns blue (`rgb(59 130 246 / 0.5)`) |
| **Dragging** | Column width updates in real-time |
| **Saved** | No visual indicator (persistence is silent) |

### Constraints & Limits

```typescript
// Each column has configurable constraints
interface ColumnConfig {
  key: string;
  width: number;        // Default/current width
  minWidth?: number;    // Minimum allowed (default: 60px)
  maxWidth?: number;    // Maximum allowed (default: 600px)
}

// Examples from actual configs:
{ key: "particulars", width: 320, minWidth: 200, maxWidth: 500 }
{ key: "year", width: 80, minWidth: 60, maxWidth: 120 }
{ key: "remarks", width: 250, minWidth: 150, maxWidth: 400 }
```

---

## Implementation Details

### Core Hook: useResizableColumns

**Location**: `components/features/ppdo/odpp/utilities/data-tables/core/hooks/useResizableColumns.ts`

```typescript
interface UseResizableColumnsOptions {
    tableIdentifier: string;        // Unique table ID (e.g., "budgetItemsTable_v2")
    defaultColumns: ColumnConfig[]; // Column definitions with defaults
}

interface UseResizableColumnsReturn {
    // State
    columns: ColumnConfig[];              // Current column config
    columnWidths: Map<string, number>;    // Current pixel widths
    canEditLayout: boolean;               // Permission flag
    
    // Actions
    startResizeColumn: (e: React.MouseEvent, index: number) => void;
    updateColumnWidth: (columnKey: string, newWidth: number) => void;
}

// Usage in table component
const {
    columns,
    columnWidths,
    canEditLayout,
    startResizeColumn,
} = useResizableColumns({
    tableIdentifier: "budgetItemsTable_v2",
    defaultColumns: BUDGET_TABLE_COLUMNS,
});
```

### Header Component with Resize Handle

**Location**: `components/features/ppdo/odpp/utilities/data-tables/core/ResizableTableHeader.tsx`

```typescript
// Key resize handle implementation
{canEditLayout && (
    <div
        className="absolute right-0 top-0 h-full cursor-col-resize z-10"
        onMouseDown={e => onStartResize(e, index)}
        style={{
            width: '4px',
            marginRight: '-2px',
            backgroundColor: 'transparent',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(59 130 246 / 0.5)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
        }}
    />
)}
```

### Width Application in Rows

**Location**: `components/features/ppdo/odpp/utilities/data-tables/core/ResizableTableRow.tsx`

```typescript
// Helper to get column width
const getColumnWidth = (column: ColumnConfig): number => {
    const key = String(column.key);
    if (columnWidths?.has(key)) {
        return columnWidths.get(key)!;  // Use saved width
    }
    return column.width ?? 150;          // Fallback to default
};

// Applied to each cell
<td
    style={{
        width: `${getColumnWidth(column)}px`,
        minWidth: `${column.minWidth || 60}px`,
        maxWidth: `${column.maxWidth || 600}px`,
    }}
>
    {renderCell(data, column)}
</td>
```

### Debounced Database Save

**Location**: `components/features/ppdo/odpp/utilities/data-tables/core/hooks/useTableSettings.ts`

```typescript
// Debounced save to prevent excessive DB writes
const saveWidthToDb = useDebouncedCallback(
    async (columnKey: string, width: number) => {
        if (!canEditLayout) return;
        console.log(`[Table:${tableIdentifier}] Saving width: ${columnKey} = ${width}px`);
        await updateWidth({ tableIdentifier, columnKey, width });
    },
    300 // 300ms debounce
);

const updateColumnWidth = useCallback((columnKey: string, newWidth: number) => {
    const col = columns.find(c => String(c.key) === columnKey);
    if (!col) return;

    // Clamp to min/max bounds
    const minW = col.minWidth ?? 60;
    const maxW = col.maxWidth ?? 600;
    const clamped = Math.max(minW, Math.min(maxW, newWidth));

    // Optimistic update - immediate UI update
    setColumnWidths(prev => new Map(prev).set(columnKey, clamped));

    // Schedule save to database (debounced)
    saveWidthToDb(columnKey, clamped);
}, [columns, saveWidthToDb]);
```

---

## Database Schema & Persistence

### Schema Definitions

**Location**: `convex/schema/tableSettings.ts`

```typescript
// User-specific table settings
userTableSettings: defineTable({
    userId: v.id("users"),
    tableIdentifier: v.string(),
    columns: v.array(
        v.object({
            fieldKey: v.string(),      // Column identifier
            width: v.number(),         // Pixel width - ACTIVELY USED
            isVisible: v.boolean(),    // Column visibility
            pinned: v.optional(v.union(v.literal("left"), v.literal("right"), v.null())),
            flex: v.optional(v.number()),
        })
    ),
    customRowHeights: v.optional(v.string()),
    defaultRowHeight: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
}).index("by_user_and_table", ["userId", "tableIdentifier"]),

// System-wide default column widths
tableColumnDefaults: defineTable({
    tableIdentifier: v.string(),
    columnKey: v.string(),
    defaultWidth: v.number(),
    minWidth: v.number(),
    maxWidth: v.optional(v.number()),
    flex: v.number(),
    updatedAt: v.number(),
})
    .index("by_table", ["tableIdentifier"])
    .index("by_table_column", ["tableIdentifier", "columnKey"]),
```

### Convex Mutations

**Location**: `convex/tableSettings.ts`

```typescript
// Update single column width (for resize operations)
export const updateColumnWidth = mutation({
    args: {
        tableIdentifier: v.string(),
        columnKey: v.string(),
        width: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("userTableSettings")
            .withIndex("by_user_and_table", (q) =>
                q.eq("userId", userId).eq("tableIdentifier", args.tableIdentifier)
            )
            .first();

        if (!existing) {
            // Create new settings with defaults
            const defaults = await ctx.db
                .query("tableColumnDefaults")
                .withIndex("by_table", (q) => q.eq("tableIdentifier", args.tableIdentifier))
                .collect();

            const columns = defaults.map((def) => ({
                fieldKey: def.columnKey,
                width: def.columnKey === args.columnKey ? args.width : def.defaultWidth,
                isVisible: true,
                flex: def.flex,
                pinned: null as "left" | "right" | null,
            }));

            await ctx.db.insert("userTableSettings", {
                userId,
                tableIdentifier: args.tableIdentifier,
                columns,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        } else {
            // Update existing column width
            const columns = existing.columns.map((c) =>
                c.fieldKey === args.columnKey ? { ...c, width: args.width } : c
            );

            await ctx.db.patch(existing._id, {
                columns,
                updatedAt: Date.now(),
            });
        }
    },
});
```

### Width Loading Priority

When a table loads, widths are resolved in this priority order:

```
1. User's saved width (from userTableSettings)
   └── Highest priority - user's custom setting
   
2. Database default width (from tableColumnDefaults)
   └── Fallback if no user setting exists
   
3. Config default width (from ColumnConfig in code)
   └── Final fallback
   
4. Hardcoded default (150px)
   └── Absolute fallback
```

```typescript
// From useTableSettings.ts
const finalWidth = savedWidth ?? dbDefault ?? colConfig?.width ?? 150;
```

---

## Permission System

### Layout Edit Permission

Only users with `super_admin` or `admin` roles can resize columns:

```typescript
// From useTableSettings.ts
const currentUser = useQuery(api.users.current, {});
const canEditLayout = currentUser?.role === "super_admin" || currentUser?.role === "admin";

// Applied to resize handle
{canEditLayout && (
    <div
        className="... cursor-col-resize ..."
        onMouseDown={e => onStartResize(e, index)}
        // ...
    />
)}
```

### Permission Behavior Matrix

| User Role | Can Resize Columns | Can Reorder Columns | Can Toggle Visibility |
|-----------|-------------------|---------------------|----------------------|
| `super_admin` | ✅ Yes | ✅ Yes | ✅ Yes |
| `admin` | ✅ Yes | ✅ Yes | ✅ Yes |
| `user` | ❌ No | ❌ No | ❌ No |
| `viewer` | ❌ No | ❌ No | ❌ No |

---

## API Reference

### Hooks

#### useResizableColumns

```typescript
import { useResizableColumns } from "@/components/features/ppdo/odpp/utilities/data-tables/core";

function MyTable() {
    const {
        // State
        columns,           // ColumnConfig[] - current columns
        columnWidths,      // Map<string, number> - pixel widths
        rowHeights,        // RowHeights - per-row heights
        hiddenColumns,     // Set<string> - hidden column keys
        canEditLayout,     // boolean - user can edit
        containerRef,      // RefObject<HTMLDivElement>
        
        // Resize handlers
        startResizeColumn, // (e: React.MouseEvent, index: number) => void
        startResizeRow,    // (e: React.MouseEvent, rowId: string) => void
        
        // Drag/drop handlers
        onDragStart,       // (index: number) => void
        onDragOver,        // (e: React.DragEvent) => void
        onDrop,            // (index: number) => void
        
        // Visibility
        toggleColumnVisibility, // (columnKey: string, isVisible: boolean) => void
    } = useResizableColumns({
        tableIdentifier: "myTable",
        defaultColumns: MY_COLUMNS,
    });
}
```

#### useTableSettings

```typescript
import { useTableSettings } from "@/components/features/ppdo/odpp/utilities/data-tables/core";

function useMyTableSettings() {
    const {
        columns,
        columnWidths,
        rowHeights,
        canEditLayout,
        toggleColumnVisibility,
        updateColumnWidth,
        saveLayout,
    } = useTableSettings({
        tableIdentifier: "myTable",
        defaultColumns: MY_COLUMNS,
    });
}
```

### Components

#### ResizableTableContainer

```typescript
interface ResizableTableContainerProps {
    children: ReactNode;
    toolbar?: ReactNode;
    className?: string;
    maxHeight?: string;  // Default: "calc(100vh - 280px)"
}

<ResizableTableContainer
    ref={containerRef}
    toolbar={<TableToolbar />}
    maxHeight="calc(100vh - 200px)"
>
    <table>...</table>
</ResizableTableContainer>
```

#### ResizableTableHeader

```typescript
interface ResizableTableHeaderProps {
    columns: ColumnConfig[];
    columnWidths?: Map<string, number>;
    canEditLayout: boolean;
    onDragStart: (index: number) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (index: number) => void;
    onStartResize: (e: React.MouseEvent, index: number) => void;
    
    // Selection props
    isAllSelected?: boolean;
    isIndeterminate?: boolean;
    onSelectAll?: (checked: boolean) => void;
    
    // Customization
    showActionsColumn?: boolean;
    actionsColumnWidth?: number;
}
```

#### ResizableTableRow

```typescript
interface ResizableTableRowProps<T extends { _id: string }> {
    data: T;
    index: number;
    columns: ColumnConfig[];
    columnWidths?: Map<string, number>;
    rowHeight: number;
    canEditLayout: boolean;
    renderCell: (item: T, column: ColumnConfig) => React.ReactNode;
    renderActions?: (item: T) => React.ReactNode;
    onRowClick?: (item: T, event: React.MouseEvent) => void;
    onStartRowResize: (e: React.MouseEvent, rowId: string) => void;
    
    // Selection
    isSelected?: boolean;
    onSelectRow?: (id: string, checked: boolean) => void;
}
```

### Convex API

```typescript
// Queries
api.tableSettings.getSettings({ tableIdentifier: string })
api.tableSettings.getDefaultWidths({ tableIdentifier: string })

// Mutations
api.tableSettings.saveSettings({
    tableIdentifier: string,
    columns: Array<{ fieldKey: string; width: number; isVisible: boolean; pinned?: string | null; flex?: number }>,
    customRowHeights?: string,
})

api.tableSettings.updateColumnWidth({
    tableIdentifier: string,
    columnKey: string,
    width: number,
})

api.tableSettings.resetSettings({ tableIdentifier: string })

// Internal mutations (admin only)
api.tableSettings.seedDefaultWidths()
api.tableSettings.clearDefaultWidths()
api.tableSettings.clearCorruptedSettings()
```

---

## Configuration Guide

### Column Configuration

**Location**: `components/features/ppdo/odpp/utilities/data-tables/configs/`

```typescript
// Example: projectsColumns.ts
import { ColumnConfig } from "../core/types/table.types";

export const PROJECT_TABLE_COLUMNS: ColumnConfig[] = [
    {
        key: "particulars",
        label: "Project Name",
        width: 320,         // Default width in pixels
        flex: 5,            // Proportional weight
        minWidth: 200,      // Minimum allowed width
        maxWidth: 500,      // Maximum allowed width
        type: "text",
        align: "left"
    },
    {
        key: "year",
        label: "Year",
        width: 80,
        flex: 1,
        minWidth: 60,
        maxWidth: 120,
        type: "number",
        align: "center"
    },
    // ... more columns
];
```

### Column Types

```typescript
type ColumnType = 
    | "text"      // General text content
    | "number"    // Numeric values
    | "date"      // Date values
    | "status"    // Status badges
    | "currency"  // Money values (formatted)
    | "percentage" // Percentage values
    | "custom";   // Custom rendering
```

### Default Widths by Type

```typescript
// From table.types.ts
export const DEFAULT_WIDTHS: Record<ColumnType, { width: number; min: number; max: number }> = {
    text: { width: 200, min: 120, max: 500 },
    number: { width: 100, min: 70, max: 200 },
    date: { width: 120, min: 100, max: 200 },
    status: { width: 130, min: 90, max: 200 },
    currency: { width: 140, min: 100, max: 250 },
    percentage: { width: 110, min: 80, max: 200 },
    custom: { width: 150, min: 80, max: 400 },
};
```

### Seeding Default Widths

**Location**: `convex/tableSettings.ts`

```typescript
// Add to seedDefaultWidths mutation
const allDefaults = [
    // Existing entries...
    
    // New table
    { 
        tableId: "myNewTable", 
        col: "columnKey", 
        width: 200, 
        flex: 2, 
        minW: 120, 
        maxW: 400 
    },
];
```

Run the seed mutation from the Convex dashboard or create an admin UI button.

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **Resize handle not visible** | User not admin | Check user role in database |
| **Width not persisting** | Network error | Check Convex logs for mutation errors |
| **Column too narrow** | minWidth too small | Update column config minWidth |
| **Column too wide** | maxWidth too large | Update column config maxWidth |
| **Widths reset on refresh** | Settings not loading | Check getSettings query returns data |
| **All columns same width** | columnWidths not passed | Ensure columnWidths prop is passed to ResizableTableRow |

### Debug Logging

Enable console logging to trace resize operations:

```typescript
// From useResizableColumns.ts
console.log(`[Table:${tableIdentifier}] Resize START: ${colKey} (${startWidth}px)`);
console.log(`[Table:${tableIdentifier}] Resize MOVE: ${colKey} → ${newWidth}px`);
console.log(`[Table:${tableIdentifier}] Resize END: ${colKey} → ${finalWidth}px`);

// From useTableSettings.ts
console.log(`[Table:${tableIdentifier}] Loaded ${columns.length} columns`);
console.log(`[Table:${tableIdentifier}] Widths: ${widthInfo}`);
console.log(`[Table:${tableIdentifier}] Saving width: ${columnKey} = ${width}px`);

// From convex/tableSettings.ts
console.log(`[Convex] updateColumnWidth | table: ${args.tableIdentifier} | column: ${args.columnKey} | width: ${args.width}px`);
```

### Reset User Settings

To reset a user's column settings to defaults:

```typescript
// In Convex dashboard or admin panel
await ctx.runMutation(api.tableSettings.resetSettings, {
    tableIdentifier: "budgetItemsTable_v2"
});
```

### Fix Corrupted Settings

If columns have zero or negative widths:

```typescript
// Run internal mutation to clean up corrupted settings
await ctx.runMutation(api.tableSettings.clearCorruptedSettings);
```

---

## Related Documentation

- [TABLE_SYSTEM_DOCUMENTATION.md](./TABLE_SYSTEM_DOCUMENTATION.md) - General table system overview
- [ppdo-tables/01-architecture-overview.md](./ppdo-tables/01-architecture-overview.md) - Toolbar architecture
- [IMPLEMENTATION_PLAN_COLUMN_WIDTHS.md](./IMPLEMENTATION_PLAN_COLUMN_WIDTHS.md) - Original implementation plan

---

*Last Updated: February 2026*  
*Maintainer: Development Team*  
*Version: 2.1 (Persisted Pixel Widths)*
