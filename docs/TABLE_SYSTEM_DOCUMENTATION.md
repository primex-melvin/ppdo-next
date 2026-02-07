# PPDO Table System Documentation

> **Handover Guide**: This document explains everything about how tables work in the PPDO system. Written for developers taking over this project.

---

## 📚 Table of Contents

1. [The Big Picture (5th Grade Version)](#the-big-picture)
2. [Architecture Overview](#architecture-overview)
3. [How Column Widths Work](#how-column-widths-work)
4. [How Row Heights Work](#how-row-heights-work)
5. [Drag & Drop Columns](#drag--drop-columns)
6. [Storage: Backend vs Browser](#storage-backend-vs-browser)
7. [DRY Principles Applied](#dry-principles-applied)
8. [File Structure & Organization](#file-structure--organization)
9. [Comparison: Google Sheets & Excel](#comparison-google-sheets--excel)
10. [Recommended Improvements](#recommended-improvements)
11. [Quick Reference](#quick-reference)

---

## The Big Picture

### 🎯 Simple Explanation

Imagine you're organizing a bookshelf:

- **Columns** = Books on the shelf (each has a different size/importance)
- **Flex** = How much space each book "wants" (a thick dictionary wants more space than a pamphlet)
- **Container** = The bookshelf itself (if the shelf gets wider, all books get more space)
- **Min Width** = The minimum space a book needs (you can't squish a dictionary smaller than this!)

**The Magic**: Instead of saying "this column is exactly 200 pixels wide," we say "this column is 3x as important as that column." The computer figures out the exact pixels based on how big your screen is!

### 🧠 Why This Approach?

| Old Way (Pixels) | New Way (Flex) |
|------------------|----------------|
| `"width": 200` | `"flex": 3` |
| Fixed, rigid | Fluid, responsive |
| Breaks on small screens | Adapts to any screen |
| Stored in database | Calculated at runtime |
| Manual resize needed | Automatic distribution |

---

## Architecture Overview

### System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     TABLE RENDERING PIPELINE                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐
│   CONFIG     │───▶│    HOOKS     │───▶│     COMPONENTS       │
│  (Columns)   │    │ (useResizable│    │ (ResizableTable*)    │
│              │    │   Columns)   │    │                      │
└──────────────┘    └──────────────┘    └──────────────────────┘
                           │                       │
                           ▼                       ▼
                    ┌──────────────┐        ┌──────────────┐
                    │  DYNAMIC     │        │   RENDER     │
                    │  WIDTHS      │        │   OUTPUT     │
                    │ (useDynamic  │        │              │
                    │ ColumnWidths)│        │              │
                    └──────────────┘        └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   STORAGE    │
                    │ (Convex DB)  │
                    └──────────────┘
```

### Key Components

| Component | Purpose | File |
|-----------|---------|------|
| `useResizableColumns` | Main hook that orchestrates everything | `core/hooks/useResizableColumns.ts` |
| `useTableSettings` | Loads/saves visibility, order, row heights | `core/hooks/useTableSettings.ts` |
| `useDynamicColumnWidths` | Calculates pixel widths from flex values | `core/hooks/useDynamicColumnWidths.ts` |
| `ResizableTableContainer` | Scrollable container with sticky header | `core/ResizableTableContainer.tsx` |
| `ResizableTableHeader` | Renders header with drag handles | `core/ResizableTableHeader.tsx` |
| `ResizableTableRow` | Renders data rows | `core/ResizableTableRow.tsx` |

---

## How Column Widths Work

### The Flex Algorithm

```typescript
// Step 1: Sum all flex values of visible columns
const totalFlex = columns.reduce((sum, col) => sum + col.flex, 0);
// Example: [3, 2, 1, 1] = totalFlex of 7

// Step 2: Calculate available space
const availableWidth = containerWidth - fixedColumns;
// fixedColumns = 48px (row #) + 64px (actions) = 112px

// Step 3: Width per flex unit
const widthPerFlex = availableWidth / totalFlex;

// Step 4: Calculate each column
const columnWidth = Math.max(col.flex * widthPerFlex, col.minWidth);
```

### Visual Example

```
Container Width: 1000px
Fixed Columns: 112px (row # + actions)
Available: 888px

Columns:
┌─────────────────┬─────────────┬────────┬────────┐
│ Project Name    │ Budget      │ Status │ Year   │
│ flex: 3         │ flex: 2     │ flex: 1│ flex: 1│
│ minWidth: 180   │ minWidth:100│ min: 80│ min: 60│
├─────────────────┼─────────────┼────────┼────────┤
│ ~380px (43%)    │ ~253px(28%) │~127px  │~127px  │
│                 │             │(14%)   │(14%)   │
└─────────────────┴─────────────┴────────┴────────┘
                 Total: 7 flex units
```

### Column Configuration

```typescript
// Example: projectsColumns.ts
export const PROJECTS_COLUMNS: ColumnConfig<Project>[] = [
  {
    key: "particular",
    label: "Particular",
    flex: 3,           // Takes 3x more space than flex: 1
    minWidth: 180,     // Never smaller than 180px
    type: "text",
    align: "left"
  },
  {
    key: "allocatedBudget",
    label: "Allocated Budget",
    flex: 1.5,         // Medium width
    minWidth: 110,
    type: "currency",
    align: "right"
  },
  {
    key: "year",
    label: "Year",
    flex: 0.8,         // Narrow column
    minWidth: 70,
    type: "number",
    align: "center"
  }
];
```

---

## How Row Heights Work

### Per-Row Height System

Unlike columns (which share width), each row can have its own height:

```typescript
// Row heights are stored as a map
interface RowHeights {
  [rowId: string]: number;  // e.g., { "abc123": 60, "def456": 42 }
}

// Default height for new rows
const DEFAULT_ROW_HEIGHT = 42;

// Usage
const height = rowHeights[row._id] ?? DEFAULT_ROW_HEIGHT;
```

### Resize Handle

Each row has an invisible resize handle at the bottom:

```
┌─────────────────────────────────────────┐
│ Row Content                             │
│                                         │
│─────────────────────────────────────────│  ◄── Drag this line
│ ↑ 4px handle area                       │      to resize row
└─────────────────────────────────────────┘
```

### Current Limitations

⚠️ **Note**: Row height resizing is currently **disabled** in the UI. The code exists but resize handlers are no-ops until flex-based column resize is fully implemented.

---

## Drag & Drop Columns

### How It Works

1. **Start Drag**: User clicks and drags column header (only admins can do this)
2. **Visual Feedback**: Column becomes semi-transparent
3. **Drop Zone**: User hovers over another column
4. **Reorder**: Columns swap positions
5. **Save**: New order is saved to database

### Code Flow

```typescript
// useColumnDragDrop.ts
const onDragStart = (index: number) => {
    setDraggedCol(index);  // Remember which column
};

const onDrop = (targetIndex: number) => {
    // Reorder array: remove from old position, insert at new
    const next = [...prev];
    const [moved] = next.splice(draggedCol, 1);
    next.splice(targetIndex, 0, moved);
    
    // Save to database
    saveLayout(next, rowHeights);
};
```

### Permission Check

```typescript
// Only admins can drag
const canEditLayout = user?.role === "super_admin" || user?.role === "admin";

draggable={canEditLayout}
```

---

## Storage: Backend vs Browser

### What Gets Stored Where

| Feature | Stored In | Persisted? | Notes |
|---------|-----------|------------|-------|
| **Column Order** | Convex DB | ✅ Yes | Array of field keys |
| **Column Visibility** | Convex DB | ✅ Yes | isVisible boolean |
| **Row Heights** | Convex DB | ✅ Yes | JSON string in `customRowHeights` |
| **Column Widths** | ❌ Nowhere | ❌ No | Calculated at runtime from flex |
| **User Preferences** | Convex DB | ✅ Yes | Per-user, per-table |

### Database Schema (Convex)

```typescript
// convex/schema.ts
defineTable("userTableSettings", {
  userId: v.id("users"),
  tableIdentifier: v.string(),  // e.g., "projects", "twentyPercentDF"
  columns: v.array(v.object({
    fieldKey: v.string(),       // e.g., "projectName"
    width: v.number(),          // DEPRECATED: always 0 now
    isVisible: v.boolean(),
    pinned: v.optional(...)     // Future: left/right pinning
  })),
  customRowHeights: v.optional(v.string()),  // JSON: {"rowId": 60}
  defaultRowHeight: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});
```

### Why Not localStorage?

| Approach | Pros | Cons | Our Choice |
|----------|------|------|------------|
| **localStorage** | Fast, offline | Per-browser, lost on logout, not shared | ❌ Not used |
| **Convex DB** | Synced across devices, backed up, user-specific | Requires network | ✅ Used |

### Loading Flow

```
User Opens Page
       │
       ▼
┌──────────────┐
│ Check Convex │◄──── Fetch saved settings
│    Cache     │
└──────────────┘
       │
       ├─► Has settings? ──► Apply saved order + visibility
       │
       └─► No settings? ──► Use default column order
```

---

## DRY Principles Applied

### Don't Repeat Yourself - How We Achieve It

#### 1. Shared Hook Architecture

```typescript
// BEFORE (Repeated in each table):
const ProjectsTable = () => {
  const [columns, setColumns] = useState([...]);  // ❌ Duplicated
  const [hidden, setHidden] = useState(new Set()); // ❌ Duplicated
  // ... 50 more lines of duplicate logic
};

// AFTER (Single source of truth):
const ProjectsTable = () => {
  const {
    columns,
    hiddenColumns,
    columnWidths,
    // ...
  } = useResizableColumns({
    tableIdentifier: "projects",
    defaultColumns: PROJECTS_COLUMNS
  });  // ✅ Reusable!
};
```

#### 2. Config-Driven Columns

```typescript
// configs/projectsColumns.ts - Define once, use everywhere
export const PROJECTS_COLUMNS = [...];

// Used in:
// - ProjectsTable.tsx
// - ProjectsPrintAdapter.ts
// - Export CSV logic
// - Column visibility menu
```

#### 3. Shared Cell Components

```typescript
// cells/common/CurrencyCell.tsx - One component, all tables
<CurrencyCell value={row.allocatedBudget} />

// Used by:
// - ProjectsTable
// - BudgetTable
// - TwentyPercentDFTable
// - FundsTable
```

#### 4. Type Safety Across the Board

```typescript
// Single type definition used everywhere
interface ColumnConfig<T = any> {
  key: keyof T | string;
  label: string;
  flex: number;
  minWidth?: number;
  type: ColumnType;
  align: ColumnAlign;
}
```

### DRY Benefits

| Metric | Before | After |
|--------|--------|-------|
| Lines per table | ~300 | ~80 |
| Column definition duplication | 5x | 1x |
| Bug fix propagation | 5 files | 1 file |
| New table setup time | 2 hours | 15 minutes |

---

## File Structure & Organization

```
components/features/ppdo/odpp/utilities/data-tables/
│
├── 📁 cells/                          # Reusable cell renderers
│   ├── 📁 common/                     # Shared across all tables
│   │   ├── CurrencyCell.tsx
│   │   ├── DateCell.tsx
│   │   ├── PercentageCell.tsx
│   │   └── TextCell.tsx
│   ├── 📁 projects/                   # Project-specific cells
│   ├── 📁 budget/                     # Budget-specific cells
│   └── 📁 funds/                      # Fund-specific cells
│
├── 📁 configs/                        # Column definitions
│   ├── projectsColumns.ts
│   ├── budgetColumns.ts
│   ├── fundsColumns.ts
│   ├── twentyPercentDFColumns.ts
│   └── breakdownColumns.ts
│
├── 📁 core/                           # 🏗️ The engine
│   ├── 📁 constants/
│   │   └── table.constants.ts         # Default heights, min widths
│   │
│   ├── 📁 hooks/                      # 🪝 All the magic happens here
│   │   ├── useResizableColumns.ts     # Main orchestrator
│   │   ├── useTableSettings.ts        # Database persistence
│   │   ├── useDynamicColumnWidths.ts  # Flex → pixels conversion
│   │   ├── useColumnDragDrop.ts       # Drag & drop logic
│   │   ├── useTableResize.ts          # Row/column resize handlers
│   │   └── useTableSelection.ts       # Checkbox selection
│   │
│   ├── 📁 types/
│   │   └── table.types.ts             # TypeScript definitions
│   │
│   ├── 📁 utils/
│   │   ├── table.utils.ts             # Helper functions
│   │   ├── formatters.ts              # Number/date formatting
│   │   └── columnWidthCalculator.ts   # Width calculation engine
│   │
│   ├── ResizableTableContainer.tsx    # 📦 Main wrapper
│   ├── ResizableTableHeader.tsx       # 📋 Header with drag handles
│   ├── ResizableTableRow.tsx          # 📄 Data row component
│   └── TableEmptyState.tsx            # 🚫 Empty state display
│
├── 📁 tables/                         # 📊 Actual table implementations
│   ├── ProjectsTable.tsx              # Uses useResizableColumns
│   ├── BudgetTable.tsx
│   ├── FundsTable.tsx
│   └── TwentyPercentDFTable.tsx
│
└── index.ts                           # Public API exports
```

### Adding a New Table

```typescript
// Step 1: Create config (5 min)
// configs/newTableColumns.ts
export const NEW_TABLE_COLUMNS: ColumnConfig<NewItem>[] = [
  { key: "name", label: "Name", flex: 3, type: "text", align: "left" },
  { key: "amount", label: "Amount", flex: 1.5, type: "currency", align: "right" },
];

// Step 2: Create table component (10 min)
// tables/NewTable.tsx
export function NewTable({ data }: { data: NewItem[] }) {
  const {
    columns,
    hiddenColumns,
    columnWidths,
    containerRef,
    // ...
  } = useResizableColumns({
    tableIdentifier: "newTable",
    defaultColumns: NEW_TABLE_COLUMNS,
  });

  return (
    <ResizableTableContainer ref={containerRef}>
      {/* Render logic */}
    </ResizableTableContainer>
  );
}
```

---

## Comparison: Google Sheets & Excel

### What We Share

| Feature | PPDO Tables | Google Sheets | Excel Online |
|---------|-------------|---------------|--------------|
| **Responsive Columns** | ✅ Flex-based | ✅ Auto-resize | ✅ Auto-resize |
| **Drag Reorder** | ✅ Columns only | ✅ Full | ✅ Full |
| **Row Resize** | ⚠️ Code ready, UI disabled | ✅ Yes | ✅ Yes |
| **Column Resize** | ⚠️ Code ready, needs flex logic | ✅ Yes | ✅ Yes |
| **Persistence** | ✅ Database | ✅ Cloud | ✅ Cloud |
| **Freeze/Pin** | ❌ Planned | ✅ Yes | ✅ Yes |
| **Sort** | ❌ Not implemented | ✅ Yes | ✅ Yes |
| **Filter** | ❌ Not implemented | ✅ Yes | ✅ Yes |
| **Formula Bar** | ❌ N/A | ✅ Yes | ✅ No |

### What Makes Us Different

| Aspect | PPDO | Sheets/Excel |
|--------|------|--------------|
| **Purpose** | Display structured data | Free-form editing |
| **User types** | Admin (edit) / Viewer (read) | Everyone edits |
| **Data source** | Convex database | File/Cloud |
| **Resize model** | Flex weights (responsive) | Fixed pixels |
| **Mobile** | Scrollable | Mobile apps |

### Lessons from Sheets/Excel

```typescript
// What we learned:

// 1. Sticky headers are essential
//    → Our tables have sticky headers

// 2. Visual feedback during drag
//    → We show grip icon, cursor changes

// 3. Minimum sizes prevent breakage
//    → minWidth prevents columns from disappearing

// 4. Persistence matters
//    → User preferences saved to database

// 5. Performance at scale
//    → Virtual scrolling recommended for >1000 rows
```

---

## Recommended Improvements

### 🔴 High Priority

#### 1. Re-enable Column Resizing with Flex
**Problem**: Column resize handles exist but are non-functional  
**Solution**: Implement proportional flex redistribution

```typescript
// When user drags to resize:
// 1. Calculate new flex based on pixel delta
// 2. Redistribute flex from neighboring columns
// 3. Save new flex values to database (add column.flex to schema)

const handleColumnResize = (columnIndex: number, deltaPixels: number) => {
  const col = columns[columnIndex];
  const widthPerFlex = containerWidth / totalFlex;
  
  // Convert pixel change to flex change
  const flexDelta = deltaPixels / widthPerFlex;
  col.flex = Math.max(0.5, col.flex + flexDelta);
  
  // Save to database (needs schema update)
  saveColumnFlex(col.key, col.flex);
};
```

#### 2. Add Column Pinning (Freeze)
**Use Case**: Keep "Project Name" visible while scrolling  
**Reference**: Excel's "Freeze Panes" feature

```typescript
// Add to ColumnConfig
interface ColumnConfig<T> {
  // ... existing
  pinned?: "left" | "right" | null;
}

// Render pinned columns in separate containers
// with position: sticky
```

#### 3. Virtual Scrolling for Large Datasets
**Problem**: 1000+ rows = slow rendering  
**Solution**: Only render visible rows

```typescript
// Libraries: react-window or @tanstack/react-virtual
// Render only rows in viewport + buffer
```

### 🟡 Medium Priority

#### 4. Multi-Column Sort
```typescript
// Shift+click to add secondary sort
interface SortState {
  column: string;
  direction: "asc" | "desc";
}
const [sorts, setSorts] = useState<SortState[]>([]);
```

#### 5. Column Filters
```typescript
// Dropdown in header with filter options
// Similar to Excel's filter arrows
```

#### 6. Export Enhancements
- Export to Excel (.xlsx) not just CSV
- Include formatting (colors, bold headers)
- Respect current column order/visibility

### 🟢 Low Priority / Nice to Have

#### 7. Keyboard Navigation
```typescript
// Arrow keys to move between cells
// Enter to edit
// Escape to cancel
// Like Google Sheets
```

#### 8. Column Groups
```typescript
// Visual grouping of related columns
// Example: "Budget" group containing allocated, utilized, balance
interface ColumnGroup {
  label: string;
  columns: string[];
}
```

#### 9. Undo/Redo
```typescript
// Track layout changes in stack
// Ctrl+Z to undo column reorder/resize
```

### 📊 Implementation Priority Matrix

| Feature | User Impact | Dev Effort | Priority |
|---------|-------------|------------|----------|
| Column Resizing | High | Medium | 🔴 P1 |
| Column Pinning | High | Low | 🔴 P1 |
| Virtual Scrolling | High | High | 🟡 P2 |
| Multi-Sort | Medium | Low | 🟡 P2 |
| Column Filters | Medium | Medium | 🟡 P2 |
| Excel Export | Medium | Low | 🟡 P2 |
| Keyboard Nav | Low | Medium | 🟢 P3 |
| Column Groups | Low | Low | 🟢 P3 |
| Undo/Redo | Low | High | 🟢 P3 |

---

## Quick Reference

### Common Tasks

#### Add a New Column
```typescript
// 1. Add to config
{
  key: "newField",
  label: "New Field",
  flex: 1.5,
  minWidth: 100,
  type: "text",
  align: "left"
}

// 2. That's it! Table auto-updates
```

#### Hide a Column by Default
```typescript
// In your table component:
const { toggleColumnVisibility } = useResizableColumns(...);

useEffect(() => {
  toggleColumnVisibility("columnKey", false);
}, []);
```

#### Change Column Width Ratio
```typescript
// Before
{ flex: 1 }  // 14% of space

// After  
{ flex: 2 }  // 28% of space (2x wider)
```

#### Debug Width Calculations
```typescript
const { columnWidths, containerWidth } = useResizableColumns(...);

useEffect(() => {
  console.log("Container:", containerWidth);
  console.log("Widths:", Object.fromEntries(columnWidths));
}, [columnWidths, containerWidth]);
```

### Type Reference

```typescript
// Complete ColumnConfig
interface ColumnConfig<T = any> {
  key: keyof T | string;        // Property name or accessor
  label: string;                // Header text
  flex: number;                 // Relative width weight
  minWidth?: number;            // Minimum pixels
  type: "text" | "number" | "date" | "status" | "currency" | "percentage" | "custom";
  align: "left" | "center" | "right";
}

// Hook return value
interface UseResizableColumnsReturn {
  columns: ColumnConfig[];           // Ordered, visible columns
  hiddenColumns: Set<string>;        // Currently hidden
  columnWidths: Map<string, number>; // Calculated pixel widths
  rowHeights: RowHeights;            // Per-row heights
  canEditLayout: boolean;            // Is admin?
  containerRef: RefObject<HTMLDivElement>;
  // ... handlers
}
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Columns too narrow | minWidth not set | Add `minWidth: 100` to config |
| Table not responsive | Missing containerRef | Pass `ref={containerRef}` to container |
| Settings not saving | User not admin | Check `canEditLayout` is true |
| Columns overlapping | Container too small | Add `overflow-x: auto` or reduce minWidth |
| Drag not working | `canEditLayout` false | Verify user role is admin |

---

## Glossary

| Term | Definition |
|------|------------|
| **Flex** | A number that determines how much space a column gets relative to others |
| **Container** | The box that holds the table - widths are calculated based on this |
| **DRY** | "Don't Repeat Yourself" - write code once, reuse it |
| **Convex** | Our database - stores user settings and data |
| **Hook** | A React function that manages state and logic |
| **Min Width** | The smallest a column can be before scrolling starts |
| **Resizable** | Can be dragged to change size |
| **Schema** | Database structure definition |
| **Sticky Header** | Header stays visible when scrolling down |

---

## Contact & Resources

- **Convex Docs**: https://docs.convex.dev/
- **React Hooks**: https://react.dev/reference/react
- **ResizeObserver**: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
- **CSS Grid**: https://css-tricks.com/snippets/css/complete-guide-grid/

---

*Last Updated: February 2026*  
*Maintainer: Development Team*  
*Version: 2.0 (Flex-based Layout)*
