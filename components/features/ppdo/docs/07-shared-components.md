# Shared Components

> Cross-module reusable components

---

## Overview

Shared components are used across multiple modules in the PPDO system.

**File Location:** `components/ppdo/shared/`

---

## Kanban Components (`shared/kanban/`)

### KanbanBoard

Reusable kanban board component.

```typescript
interface KanbanBoardProps {
  columns: KanbanColumn[];
  items: KanbanItem[];
  onMove: (itemId: string, targetColumnId: string) => void;
  renderCard: (item: KanbanItem) => React.ReactNode;
  renderColumn?: (column: KanbanColumn) => React.ReactNode;
}

interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  itemIds: string[];
}

interface KanbanItem {
  id: string;
  columnId: string;
  data: unknown;
}
```

**Features:**
- Drag-drop cards between columns
- Customizable card rendering
- Column customization
- Field visibility toggle

---

### KanbanColumn

Individual kanban column.

```typescript
interface KanbanColumnProps {
  column: KanbanColumn;
  items: KanbanItem[];
  renderCard: (item: KanbanItem) => React.ReactNode;
  onDrop: (itemId: string) => void;
}
```

---

### KanbanCard

Individual kanban card.

```typescript
interface KanbanCardProps {
  item: KanbanItem;
  onDragStart: () => void;
  fields: {
    id: string;
    label: string;
    render: (data: unknown) => React.ReactNode;
  }[];
}
```

---

### SortableKanbanCard

Draggable kanban card using @dnd-kit.

```typescript
interface SortableKanbanCardProps extends KanbanCardProps {
  onDragEnd: (event: DragEndEvent) => void;
}
```

---

### KanbanFieldVisibilityMenu

Toggle visibility of fields on kanban cards.

```typescript
interface KanbanFieldVisibilityMenuProps {
  fields: string[];
  visibleFields: string[];
  onToggle: (field: string) => void;
}
```

---

## Usage Example: Kanban

```tsx
import {
  KanbanBoard,
  KanbanCard,
} from "@/components/features/ppdo/shared/kanban";

function ProjectKanban({ projects }: { projects: Project[] }) {
  const columns = [
    { id: "not_started", title: "Not Started", color: "#94a3b8" },
    { id: "ongoing", title: "In Progress", color: "#3b82f6" },
    { id: "completed", title: "Completed", color: "#22c55e" },
  ];
  
  const items = projects.map(p => ({
    id: p._id,
    columnId: p.status,
    data: p,
  }));
  
  const handleMove = async (itemId: string, columnId: string) => {
    await updateProjectStatus(itemId, columnId);
  };
  
  const renderCard = (item: KanbanItem) => (
    <KanbanCard
      item={item}
      fields={[
        { id: "name", label: "Project", render: d => d.projectName },
        { id: "budget", label: "Budget", render: d => formatCurrency(d.totalBudget) },
      ]}
    />
  );
  
  return (
    <KanbanBoard
      columns={columns}
      items={items}
      onMove={handleMove}
      renderCard={renderCard}
    />
  );
}
```

---

## Toolbar Components (`shared/toolbar/`)

### StatusVisibilityMenu

Toggle visibility of status filters.

```typescript
interface StatusVisibilityMenuProps {
  statuses: string[];
  visibleStatuses: string[];
  onToggle: (status: string) => void;
  statusColors: Record<string, string>;
}
```

---

## Base Components

### BaseShareModal

Generic share modal used across modules.

```typescript
interface BaseShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareUrl: string;
  shareTitle: string;
  shareDescription?: string;
}
```

---

### LoadingState

Consistent loading indicator.

```typescript
interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}
```

---

## Related Documentation

- [Breakdown Components](./02-breakdown-components.md) - Kanban usage
- [Funds Components](./05-funds-components.md) - Kanban usage