# Bulk Actions System

The bulk actions system allows users to perform operations on multiple selected items simultaneously.

## Core Types

**Location**: `components/ppdo/table/toolbar/types.ts`

```typescript
/**
 * Pluggable bulk action for the toolbar
 */
export interface BulkAction {
  /** Unique identifier for the action */
  id: string;

  /** Display label */
  label: string;

  /** Icon component to display */
  icon: React.ReactNode;

  /** Handler function when action is triggered */
  onClick: () => void;

  /** Optional: Show this action only if condition is met */
  showWhen?: (selectedCount: number) => boolean;

  /** Optional: Disable action if condition is met */
  isDisabled?: (selectedCount: number) => boolean;

  /** Optional: Custom CSS variant for Button component */
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost";
}
```

---

## TableToolbarBulkActions Component

**Location**: `components/ppdo/table/toolbar/TableToolbarBulkActions.tsx`

Renders a list of pluggable bulk actions for the toolbar.

```typescript
interface TableToolbarBulkActionsProps {
  actions: BulkAction[];
}
```

**Usage**:
```tsx
const bulkActions = [
  {
    id: "auto-calculate",
    label: "Toggle Auto-Calculate",
    icon: <Calculator className="w-4 h-4" />,
    onClick: () => toggleAutoCalc(),
    showWhen: (count) => count > 0,
  },
  {
    id: "category",
    label: "Change Category",
    icon: <Folder className="w-4 h-4" />,
    onClick: () => openCategoryModal(),
  }
];

<TableToolbarBulkActions actions={bulkActions} />
```

---

## Built-in Bulk Actions

### 1. Trash Selected

Always available in the toolbar when items are selected:

```tsx
<Button
  onClick={selectedCount > 0 ? onBulkTrash : onOpenTrash}
  variant={selectedCount > 0 ? "destructive" : "outline"}
>
  <Trash2 className="w-4 h-4" />
  {selectedCount > 0 ? `To Trash (${selectedCount})` : "Recycle Bin"}
</Button>
```

### 2. Toggle Auto-Calculate (Budget Tables)

```tsx
{
  id: "auto-calculate",
  label: "Toggle Auto-Calculate",
  icon: <Calculator className="w-4 h-4" />,
  onClick: onBulkToggleAutoCalculate,
  showWhen: (count) => count > 0,
}
```

### 3. Bulk Category Change (Projects)

Implemented via `ProjectBulkActions` component:

```tsx
<ProjectBulkActions
  selectedCount={selectedCount}
  onCategoryChange={onBulkCategoryChange}
/>
```

---

## Domain-Specific Bulk Action Components

### ProjectBulkActions

**Location**: `components/ppdo/projects/components/ProjectsTable/ProjectBulkActions.tsx`

Provides a dropdown menu for bulk category changes on projects.

```typescript
interface ProjectBulkActionsProps {
  selectedCount: number;
  onCategoryChange: (categoryId: string) => void;
}
```

### TwentyPercentDFBulkActions

**Location**: `components/ppdo/twenty-percent-df/components/TwentyPercentDFTable/TwentyPercentDFBulkActions.tsx`

Similar to ProjectBulkActions but for 20% Development Fund items.

---

## Implementation Patterns

### Pattern 1: Via bulkActions Prop (Recommended)

Pass bulk actions array to the unified toolbar:

```tsx
const bulkActions: BulkAction[] = [
  {
    id: "archive",
    label: "Archive Selected",
    icon: <Archive className="w-4 h-4" />,
    onClick: () => {
      const ids = Array.from(selection.selectedIds);
      archiveItems(ids);
      selection.clearAll();
    },
    showWhen: (count) => count > 0,
    isDisabled: (count) => count > 100, // Limit to 100 items
  },
];

<TableToolbar
  selectedCount={selection.count}
  bulkActions={bulkActions}
  // ...
/>
```

### Pattern 2: Legacy Props (Backward Compatible)

Use legacy props that adapters convert internally:

```tsx
<BudgetTableToolbar
  selectedCount={selection.count}
  onBulkToggleAutoCalculate={() => handleToggle()}
  // Adapter converts this to bulkActions internally
/>
```

### Pattern 3: Custom Component Integration

Render custom bulk action components alongside toolbar:

```tsx
<div className="flex items-center gap-2">
  {selectedCount > 0 && (
    <ProjectBulkActions
      selectedCount={selectedCount}
      onCategoryChange={handleCategoryChange}
    />
  )}
  <TableToolbar
    selectedCount={selectedCount}
    // ...
  />
</div>
```

---

## Conditional Display

### Show When Condition

```tsx
{
  id: "approve",
  label: "Approve Selected",
  showWhen: (count) => count > 0 && count <= 10, // Only show for 1-10 items
}
```

### Disable When Condition

```tsx
{
  id: "delete",
  label: "Delete Selected",
  isDisabled: (count) => count > 50, // Disable for > 50 items
}
```

---

## Best Practices

### 1. Clear Selection After Action

```tsx
const handleBulkAction = async () => {
  const ids = Array.from(selection.selectedIds);
  await performAction(ids);
  selection.clearAll(); // Clear selection after successful action
};
```

### 2. Show Loading State

```tsx
const [isProcessing, setIsProcessing] = useState(false);

{
  id: "process",
  label: isProcessing ? "Processing..." : "Process Selected",
  isDisabled: () => isProcessing,
}
```

### 3. Confirm Destructive Actions

```tsx
{
  id: "delete",
  label: "Delete Selected",
  variant: "destructive",
  onClick: () => {
    if (confirm(`Delete ${selection.count} items?`)) {
      handleDelete();
    }
  },
}
```

### 4. Batch Large Operations

```tsx
const handleBulkOperation = async () => {
  const ids = Array.from(selection.selectedIds);
  const batchSize = 10;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    await processBatch(batch);
  }
};
```

---

## Mobile Responsiveness

Bulk actions in the mobile "More" menu:

```tsx
<ResponsiveMoreMenu>
  {selectedCount > 0 && onBulkToggleAutoCalculate && (
    <DropdownMenuItem onClick={onBulkToggleAutoCalculate}>
      <Calculator className="w-4 h-4 mr-2" />
      Toggle Auto-Calculate
    </DropdownMenuItem>
  )}
</ResponsiveMoreMenu>
```
