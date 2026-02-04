# Unified Table Toolbar

**Location**: `components/ppdo/table/toolbar/TableToolbar.tsx`

## Overview

The `TableToolbar` is the core, unified toolbar component used across all PPDO table views. It provides a consistent, feature-rich interface for table operations.

## Features

- **Search filtering** with expanding animation
- **Column visibility** toggling
- **Selection management** with count display
- **Bulk actions** (pluggable)
- **Export/Print** capabilities
- **Admin sharing** features
- **Responsive design** (desktop/mobile layouts)

## Props Interface

```typescript
interface TableToolbarProps {
  // ═══════════════════════════════════════════════════════════
  // CORE FEATURES (Required in all tables)
  // ═══════════════════════════════════════════════════════════

  /** Current search input value */
  searchQuery: string;

  /** Callback when search input changes */
  onSearchChange: (query: string) => void;

  /** Ref to the search input element */
  searchInputRef: React.RefObject<HTMLInputElement>;

  /** Number of selected items */
  selectedCount: number;

  /** Callback to clear all selections */
  onClearSelection: () => void;

  /** Set of column IDs that are hidden */
  hiddenColumns: Set<string>;

  /** Callback when user toggles column visibility */
  onToggleColumn: (columnId: string, isChecked: boolean) => void;

  /** Callback to show all columns */
  onShowAllColumns: () => void;

  /** Callback to hide all columns */
  onHideAllColumns: () => void;

  /** Array of all available columns for visibility toggling */
  columns?: { key: string; label: string }[];

  /** Callback to move selected items to trash */
  onBulkTrash: () => void;

  // ═══════════════════════════════════════════════════════════
  // UI CUSTOMIZATION
  // ═══════════════════════════════════════════════════════════

  /** Table title (e.g., "Budget Items", "Projects", "Funds") */
  title?: string;

  /** Placeholder text for search input */
  searchPlaceholder?: string;

  /** Label for "Add New" button */
  addButtonLabel?: string;

  /** Accent/primary color for buttons */
  accentColor: string;

  // ═══════════════════════════════════════════════════════════
  // EXPORT & PRINT OPTIONS (Optional)
  // ═══════════════════════════════════════════════════════════

  /** Callback for exporting as CSV */
  onExportCSV?: () => void;

  /** Callback for direct printing (PDF) */
  onPrint?: () => void;

  /** Callback for opening print preview (alternative to onPrint) */
  onOpenPrintPreview?: () => void;

  /** Show draft indicator badge on print button */
  hasPrintDraft?: boolean;

  // ═══════════════════════════════════════════════════════════
  // SHARING & ADMIN FEATURES (Optional)
  // ═══════════════════════════════════════════════════════════

  /** Is current user an admin */
  isAdmin?: boolean;

  /** Number of pending share requests (shows badge) */
  pendingRequestsCount?: number;

  /** Callback to open share/access management modal */
  onOpenShare?: () => void;

  /** Callback to open recycle bin modal */
  onOpenTrash?: () => void;

  // ═══════════════════════════════════════════════════════════
  // BULK ACTIONS (Optional, Pluggable)
  // ═══════════════════════════════════════════════════════════

  /** Array of custom bulk actions */
  bulkActions?: BulkAction[];

  // ═══════════════════════════════════════════════════════════
  // ADVANCED FEATURES (Optional)
  // ═══════════════════════════════════════════════════════════

  /** Callback when search input receives focus */
  onSearchFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;

  /** Custom React node to render in action buttons area */
  expandButton?: React.ReactNode;

  /** Custom column visibility menu component */
  columnVisibilityComponent?: React.ComponentType<ColumnVisibilityMenuProps>;

  /** Add new item button handler */
  onAddNew?: () => void;

  // ═══════════════════════════════════════════════════════════
  // LEGACY SUPPORT (Deprecated)
  // ═══════════════════════════════════════════════════════════

  /** @deprecated Use bulkActions array instead */
  onBulkToggleAutoCalculate?: () => void;

  /** @deprecated Use bulkActions array instead */
  onBulkCategoryChange?: (categoryId: any) => void;

  /** @deprecated Use bulkActions array instead */
  canManageBulkActions?: boolean;
}
```

## Basic Usage

```tsx
import { TableToolbar } from "@/components/ppdo/table/toolbar";

<TableToolbar
  title="Budget Items"
  searchPlaceholder="Search budget items..."
  searchQuery={search}
  onSearchChange={setSearch}
  searchInputRef={searchRef}
  selectedCount={selectedIds.size}
  onClearSelection={clearSelection}
  hiddenColumns={hidden}
  onToggleColumn={toggleColumn}
  onShowAllColumns={showAll}
  onHideAllColumns={hideAll}
  onBulkTrash={trashSelected}
  accentColor="#3b82f6"
  isAdmin={isAdmin}
  onOpenShare={openShare}
  onExportCSV={exportCsv}
  onOpenPrintPreview={openPrintPreview}
  columns={[
    { key: 'name', label: 'Name' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
  ]}
/>
```

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌───────────────┐                    ┌────────────────────────────┐ │
│ │ Title/        │                    │        Actions Area        │ │
│ │ Selection     │                    │                            │ │
│ │ Badge         │                    │ [Search] [Cols] [Trash]    │ │
│ │               │                    │ [Export] [Share] [+ Add]   │ │
│ └───────────────┘                    └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
     LEFT SIDE                                RIGHT SIDE
     (min-width: 200px)                       (flex-1, justify-end)
```

## Animation Details

The toolbar uses Framer Motion for smooth animations:

### Search Expansion
```tsx
// Search input expands on focus
<motion.div
  animate={{
    width: isSearchExpanded ? "100%" : "20rem",
    flexGrow: isSearchExpanded ? 1 : 0
  }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
>
```

### Title/Actions Fade
```tsx
// Title fades out when search expands on mobile
<AnimatePresence mode="popLayout">
  {(!isSearchExpanded || window.innerWidth >= 1024) && (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, width: 0 }}
      transition={{ duration: 0.2 }}
    >
```

## Selection State

When items are selected (`selectedCount > 0`):

1. Title is replaced with selection badge
2. Trash button changes to "To Trash (N)"
3. Bulk actions become visible

```tsx
{selectedCount > 0 ? (
  <div className="flex items-center gap-2">
    <Badge variant="secondary">
      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
      {selectedCount} Selected
    </Badge>
    <Button onClick={onClearSelection}>Clear</Button>
  </div>
) : (
  <h3>{title}</h3>
)}
```

## Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `< sm` (640px) | Search only, all actions in "More" menu |
| `< lg` (1024px) | Compact buttons, some in "More" menu |
| `>= lg` | Full desktop layout, all actions visible |
| `>= xl` (1280px) | Full button labels visible |

## CSS Classes

```css
/* Root container */
.h-16                          /* 64px height */
.px-4                          /* 16px horizontal padding */
.border-b                      /* Bottom border */
.flex.items-center             /* Flexbox centering */
.justify-between               /* Space between */
.no-print                      /* Hidden when printing */
.overflow-hidden               /* Prevent overflow */
```
