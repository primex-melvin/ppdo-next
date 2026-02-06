# Table Components

> Reusable table system with sorting, filtering, resize, and print preview

---

## Overview

The Table module provides a comprehensive table system used across all PPDO modules. Features include:
- Column sorting
- Column resize
- Column reorder (drag-drop)
- Row selection
- Print preview
- Bulk actions
- Toolbar controls

**File Location:** `components/ppdo/table/`

---

## Module Structure

```
table/
â”œâ”€â”€ implementing-office/     # Office selector dropdown
â”œâ”€â”€ print-preview/          # Print preview system
â”‚   â”œâ”€â”€ table-borders/     # Border overlay
â”‚   â””â”€â”€ table-resize/      # Resize handles
â””â”€â”€ toolbar/               # Toolbar components
```

---

## Implementing Office Selector

### ImplementingOfficeSelector

Dropdown for selecting implementing offices.

```typescript
interface ImplementingOfficeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  offices: ImplementingOffice[];
  disabled?: boolean;
  showCreate?: boolean;
}
```

**Features:**
- Search/filter offices
- Create new office inline
- Display office details
- Mode selection (single/multi)

### Subcomponents

| Component | Purpose |
|-----------|---------|
| `CreateNewSection` | Create office UI |
| `CreateOfficeDialog` | Dialog for new office |
| `ModeSelector` | Selection mode toggle |
| `OfficeItemList` | List of offices |
| `SelectedOfficeInfo` | Selected office display |

### Hook

```typescript
const {
  offices,
  selectedOffice,
  setSelectedOffice,
  createOffice,
  isLoading,
} = useOfficeSelector({
  initialValue?: string;
  onChange: (value: string) => void;
});
```

---

## Print Preview System

### PrintPreviewModal

Main modal for print preview.

```typescript
interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PrintData;
  title: string;
  onPrint: () => void;
  onSavePDF: () => void;
}
```

**Features:**
- Canvas-based rendering
- Multiple page support
- Column visibility toggle
- Template selection
- Document title editing
- Page orientation (portrait/landscape)
- Table border overlay

---

### PrintPreviewToolbar

Toolbar for print preview controls.

```typescript
interface PrintPreviewToolbarProps {
  onPrint: () => void;
  onSavePDF: () => void;
  onSaveDraft: () => void;
  onLoadDraft: () => void;
  columns: ColumnConfig[];
  visibleColumns: string[];
  onToggleColumn: (columnId: string) => void;
  orientation: "portrait" | "landscape";
  onChangeOrientation: (orientation: string) => void;
}
```

---

### Print Preview Subcomponents

| Component | Purpose |
|-----------|---------|
| `ColumnVisibilityPanel` | Toggle column visibility |
| `DocumentTitleEditor` | Edit print title |
| `PageOrientationTab` | Portrait/Landscape selector |
| `TemplateSelector` | Select print template |
| `TemplateApplicationModal` | Apply template confirmation |

---

### Table Border Overlay

```typescript
interface TableBorderOverlayProps {
  columns: ColumnConfig[];
  rows: number;
  showBorders: boolean;
  borderStyle: "solid" | "dashed" | "dotted";
  borderColor: string;
}
```

---

### Table Resize System

Resize handles for column width adjustment.

```typescript
// TableResizeHandle
interface TableResizeHandleProps {
  columnId: string;
  onResizeStart: (columnId: string, startX: number) => void;
  isResizing: boolean;
}

// TableResizeOverlay
interface TableResizeOverlayProps {
  isVisible: boolean;
  position: { x: number; y: number };
  width: number;
}

// DimensionTooltip
interface DimensionTooltipProps {
  width: number;
  visible: boolean;
}
```

---

## Toolbar System

### TableToolbar

Main toolbar component for tables.

```typescript
interface TableToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  columns: ColumnConfig[];
  visibleColumns: string[];
  onToggleColumn: (columnId: string) => void;
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  bulkActions: BulkAction[];
  onPrint: () => void;
  onExport: () => void;
}
```

---

### BudgetTableToolbar

Specialized toolbar for budget tables.

```typescript
interface BudgetTableToolbarProps {
  year: number;
  onAddItem: () => void;
  onPrint: () => void;
  selection: SelectionState;
  onBulkDelete: () => void;
  onBulkToggle: () => void;
}
```

---

### Toolbar Adapters

Adapters for different table types:

| Adapter | For Module |
|---------|------------|
| `BudgetTableToolbar` | Budget items |
| `FundsTableToolbar` | Trust Funds/SEF/SHF |
| `ProjectsTableToolbar` | Projects |

---

### Toolbar Components

| Component | Purpose |
|-----------|---------|
| `TableToolbarBulkActions` | Bulk action buttons |
| `TableToolbarColumnVisibility` | Column toggle dropdown |
| `BudgetColumnVisibilityMenu` | Budget-specific visibility |

---

## Integration Guide

### Adding Print Preview to a Table

```tsx
import { PrintPreviewModal } from "@/components/features/ppdo/table/print-preview";
import { BudgetPrintAdapter } from "@/app/dashboard/project/[year]/lib/print-adapters";

function BudgetPage() {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const budgetItems = useQuery(api.budgetItems.getByYear, { year: 2025 });
  
  const handlePrint = () => {
    const adapter = new BudgetPrintAdapter({
      budgetItems,
      columns: VISIBLE_COLUMNS,
      year: 2025,
    });
    
    setPrintData(adapter.toPrintFormat());
    setShowPrintPreview(true);
  };
  
  return (
    <>
      <BudgetTable
        data={budgetItems}
        onPrint={handlePrint}
      />
      
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        data={printData}
        title="Budget Items 2025"
        onPrint={handleBrowserPrint}
        onSavePDF={handleSavePDF}
      />
    </>
  );
}
```

---

## Types

```typescript
// toolbar/types.ts

interface ColumnConfig {
  id: string;
  label: string;
  type: "text" | "number" | "currency" | "date" | "status" | "actions";
  align: "left" | "center" | "right";
  width: number;
  minWidth?: number;
  maxWidth?: number;
  visible: boolean;
  sortable: boolean;
  resizable: boolean;
}

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: (selectedIds: string[]) => void;
  variant?: "default" | "destructive";
}

interface SelectionState {
  selectedIds: string[];
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

interface PrintData {
  headers: string[];
  rows: (string | number)[][];
  columnWidths: number[];
  title: string;
  subtitle?: string;
  pageSize: "A4" | "Letter" | "Legal";
  orientation: "portrait" | "landscape";
}
```

---

## Related Documentation

- [Breakdown Components](./02-breakdown-components.md)
- [Projects Components](./04-projects-components.md)
- [Funds Components](./05-funds-components.md)