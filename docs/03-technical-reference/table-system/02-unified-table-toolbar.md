# Unified Table Toolbar

**Location**: `components/ppdo/table/toolbar/TableToolbar.tsx`

## Overview

The `TableToolbar` is the core, unified toolbar component used across all PPDO table views. It provides a consistent, feature-rich interface for table operations.

## Features

- **Search filtering** with expanding animation (configurable)
- **Column visibility** toggling
- **Selection management** with count display
- **Bulk actions** (pluggable array-based + custom component slot)
- **Kanban view support** (status/field visibility menus)
- **Export/Print** capabilities
- **Admin sharing** features
- **Responsive design** (desktop/mobile layouts)
- **Feature toggles** (show/hide specific features)

## Props Interface

```typescript
interface TableToolbarProps {
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // CORE FEATURES (Required in all tables)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // UI CUSTOMIZATION
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /** Table title (e.g., "Budget Items", "Projects", "Funds") */
  title?: string;

  /** Placeholder text for search input */
  searchPlaceholder?: string;

  /** Label for "Add New" button */
  addButtonLabel?: string;

  /** Accent/primary color for buttons */
  accentColor: string;

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // EXPORT & PRINT OPTIONS (Optional)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /** Callback for exporting as CSV */
  onExportCSV?: () => void;

  /** Callback for direct printing (PDF) */
  onPrint?: () => void;

  /** Callback for opening print preview (alternative to onPrint) */
  onOpenPrintPreview?: () => void;

  /** Show draft indicator badge on print button */
  hasPrintDraft?: boolean;

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SHARING & ADMIN FEATURES (Optional)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /** Is current user an admin */
  isAdmin?: boolean;

  /** Number of pending share requests (shows badge) */
  pendingRequestsCount?: number;

  /** Callback to open share/access management modal */
  onOpenShare?: () => void;

  /** Callback to open recycle bin modal */
  onOpenTrash?: () => void;

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // BULK ACTIONS (Optional, Pluggable)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /** Array of custom bulk actions */
  bulkActions?: BulkAction[];

  /** Custom bulk actions component slot (e.g., ProjectBulkActions) */
  bulkActionsComponent?: React.ReactNode;

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // KANBAN VIEW SUPPORT (Optional)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /** Visible status IDs for Kanban view filtering */
  visibleStatuses?: Set<string>;

  /** Callback when user toggles status visibility */
  onToggleStatus?: (statusId: string, isChecked: boolean) => void;

  /** Visible field IDs for Kanban card display */
  visibleFields?: Set<string>;

  /** Callback when user toggles field visibility */
  onToggleField?: (fieldId: string, isChecked: boolean) => void;

  /** Available kanban fields configuration */
  kanbanFields?: KanbanFieldConfig[];

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // FEATURE TOGGLES (Optional, defaults to true)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /** Show/hide column visibility menu (default: true) */
  showColumnVisibility?: boolean;

  /** Show/hide export dropdown (default: true) */
  showExport?: boolean;

  /** Show/hide share button (default: true) */
  showShare?: boolean;

  /** Show/hide print preview in export menu (default: true) */
  showPrintPreview?: boolean;

  /** Show/hide direct print in export menu (default: true) */
  showDirectPrint?: boolean;

  /** Enable animated search expansion (default: true) */
  animatedSearch?: boolean;

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // ADVANCED FEATURES (Optional)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  /** Callback when search input receives focus */
  onSearchFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;

  /** Custom React node to render in action buttons area */
  expandButton?: React.ReactNode;

  /** Custom column visibility menu component */
  columnVisibilityComponent?: React.ComponentType<ColumnVisibilityMenuProps>;

  /** Add new item button handler */
  onAddNew?: () => void;

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // LEGACY SUPPORT (Deprecated)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
import { TableToolbar } from "@/components/features/ppdo/table/toolbar";

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
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚ â”‚ Title/        â”‚                    â”‚        Actions Area        â”‚ â”‚
â”‚ â”‚ Selection     â”‚                    â”‚                            â”‚ â”‚
â”‚ â”‚ Badge         â”‚                    â”‚ [Search] [Cols] [Trash]    â”‚ â”‚
â”‚ â”‚               â”‚                    â”‚ [Export] [Share] [+ Add]   â”‚ â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
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