# Domain-Specific Toolbars

These are standalone toolbar implementations that exist alongside or instead of adapters. They provide complete implementations with domain-specific features.

## Standalone Toolbar Inventory

| Toolbar | Location | Status |
|---------|----------|--------|
| ProjectsTableToolbar | `components/ppdo/projects/components/ProjectsTable/` | Standalone |
| FundsTableToolbar | `components/ppdo/funds/components/toolbar/` | Standalone |
| TwentyPercentDFTableToolbar | `components/ppdo/twenty-percent-df/components/TwentyPercentDFTable/` | Standalone |
| TrustFundTableToolbar | `app/(private)/dashboard/(protected)/trust-funds/[year]/components/` | Standalone |
| BudgetTableToolbar | `components/ppdo/11_project_plan/table/` | Legacy Standalone |
| BudgetTableToolbar | `components/ppdo/table/toolbar/` | Unified Reference |

---

## 1. ProjectsTableToolbar (Standalone)

**Location**: `components/ppdo/projects/components/ProjectsTable/ProjectsTableToolbar.tsx`

### Features
- Custom `ColumnVisibilityMenu` component
- `ProjectBulkActions` component for category changes
- Expanding search with Framer Motion
- Admin share with pending request badge

### Unique Props
```typescript
interface ProjectsTableToolbarProps {
  // Unique: Category change bulk action
  canManageBulkActions: boolean;
  onBulkCategoryChange: (categoryId: any) => void;

  // Standard props...
}
```

### Layout
```
┌──────────────────────────────────────────────────────────────────────┐
│ [Title/Selection]           [Search] [Columns] [Category] [Trash]   │
│                                      [Export▼] [Share] [+ Add]      │
└──────────────────────────────────────────────────────────────────────┘
```

### Special Components
- **ProjectBulkActions**: Dropdown for bulk category changes
- **ColumnVisibilityMenu**: Wraps base visibility menu with project columns

---

## 2. FundsTableToolbar (Standalone)

**Location**: `components/ppdo/funds/components/toolbar/FundsTableToolbar.tsx`

### Features
- Animated search expansion
- Status visibility menu (for Kanban view)
- Field visibility menu (for Kanban view)
- Inline column visibility dropdown

### Unique Props
```typescript
interface FundsTableToolbarProps {
  // Standard table props...

  // Kanban-specific
  visibleStatuses?: Set<string>;
  onToggleStatus?: (statusId: string, isChecked: boolean) => void;
  visibleFields?: Set<string>;
  onToggleField?: (fieldId: string, isChecked: boolean) => void;

  // UI toggles
  showColumnToggle?: boolean;  // default: true
  showExport?: boolean;        // default: true
}
```

### Special Components
- **StatusVisibilityMenu**: Toggle which statuses show in Kanban view
- **KanbanFieldVisibilityMenu**: Toggle which fields show on Kanban cards

### Field Configuration
```typescript
fields={[
  { id: "received", label: "Received" },
  { id: "obligatedPR", label: "Obligated/PR" },
  { id: "utilized", label: "Utilized" },
  { id: "balance", label: "Balance" },
  { id: "utilizationRate", label: "Utilization Rate" },
  { id: "date", label: "Date" },
  { id: "remarks", label: "Remarks" },
]}
```

---

## 3. TwentyPercentDFTableToolbar

**Location**: `components/ppdo/twenty-percent-df/components/TwentyPercentDFTable/TwentyPercentDFTableToolbar.tsx`

### Features
- Nearly identical to ProjectsTableToolbar
- Custom `TwentyPercentDFBulkActions` component
- Animated search with Framer Motion

### Unique Props
```typescript
interface TwentyPercentDFTableToolbarProps {
  // Same as ProjectsTableToolbar
  canManageBulkActions: boolean;
  onBulkCategoryChange: (categoryId: any) => void;
  // ...
}
```

### Layout
Same as ProjectsTableToolbar with domain-specific default title ("Projects").

---

## 4. TrustFundTableToolbar

**Location**: `app/(private)/dashboard/(protected)/trust-funds/[year]/components/TrustFundTableToolbar.tsx`

### Features
- Simplified toolbar (no column visibility)
- No share functionality
- Animated search expansion
- Direct print (no print preview)

### Props Interface
```typescript
interface TrustFundTableToolbarProps {
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement>;

  // Selection
  selectedCount: number;
  onClearSelection: () => void;

  // Export/Print
  onExportCSV: () => void;
  onPrint: () => void;

  // Actions
  isAdmin: boolean;
  onOpenTrash: () => void;
  onBulkTrash: () => void;
  onAddNew?: () => void;

  // UI State
  accentColor: string;
}
```

### Layout (Simplified)
```
┌──────────────────────────────────────────────────────────────────────┐
│ [Trust Funds/Selection]         [Search] [Trash] [Export▼] [+ Add]  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. BudgetTableToolbar (11_project_plan - Legacy)

**Location**: `components/ppdo/11_project_plan/table/BudgetTableToolbar.tsx`

### Features
- Original implementation before unification
- Uses `BudgetColumnVisibilityMenu`
- Print preview with draft indicator
- Admin share with pending badge

### Notes
This is the legacy implementation that the unified `TableToolbar` was modeled after. The adapter in `components/ppdo/table/toolbar/adapters/` should be preferred for new code.

---

## Comparison Matrix

| Feature | Projects | Funds | 20% DF | Trust Fund | Budget (Legacy) |
|---------|----------|-------|--------|------------|-----------------|
| Animated Search | Yes | Yes | Yes | Yes | No |
| Column Visibility | Custom Menu | Inline | Custom Menu | No | Custom Menu |
| Bulk Category | Yes | No | Yes | No | No |
| Auto-Calculate | Optional | No | Optional | No | Yes |
| Kanban Support | No | Yes | No | No | No |
| Print Preview | Optional | Optional | Optional | No | Yes |
| Admin Share | Yes | No | Yes | No | Yes |
| Framer Motion | Yes | Yes | Yes | Yes | No |

---

## When to Use Standalone vs. Adapter

**Use Standalone When**:
- Need features not supported by unified toolbar
- Need complete control over layout/behavior
- Building a one-off specialized view

**Use Adapter When**:
- Want consistent behavior across tables
- Need to maintain backward compatibility
- Building a standard data table
