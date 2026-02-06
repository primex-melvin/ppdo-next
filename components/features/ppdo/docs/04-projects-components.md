# Projects Components

> Project management table, forms, and utilities

---

## Overview

Projects components manage the project lifecycle within budget items. This module provides:
- Project data tables
- Project forms
- Statistics display
- Bulk operations

**File Location:** `components/ppdo/projects/`

---

## Main Components

### ProjectsTable

Main table component for displaying projects.

```typescript
interface ProjectsTableProps {
  projects: GovtProject[];
  categories: string[];
  onEdit?: (project: GovtProject) => void;
  onDelete?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onToggleStatus?: (ids: string[], status: string) => void;
}
```

**Features:**
- Category grouping
- Sortable columns
- Row selection
- Bulk actions
- Expandable rows
- Context menu

---

### ProjectsTable Subcomponents

| Component | Purpose |
|-----------|---------|
| `ProjectsTableHeader` | Table header with sorting |
| `ProjectsTableBody` | Table body with rows |
| `ProjectsTableRow` | Individual row |
| `ProjectsTableFooter` | Pagination footer |
| `ProjectsTableToolbar` | Search, filters, actions |
| `ColumnVisibilityMenu` | Show/hide columns |
| `ProjectBulkActions` | Bulk operation buttons |
| `ProjectCategoryFilter` | Category filter dropdown |
| `ProjectCategoryGroup` | Category grouping header |
| `ProjectContextMenu` | Right-click context menu |
| `SortIcon` | Sort indicator icon |

---

### ProjectForm

Form for creating/editing projects.

```typescript
interface ProjectFormProps {
  initialData?: Partial<GovtProject>;
  particularId: string;
  year: number;
  availableBudget: number;
  onSubmit: (data: ProjectFormValues) => Promise<void>;
  onCancel?: () => void;
}
```

**Fields:**
- Project Name
- Category (with combobox)
- Total Budget
- Description
- Remarks
- Status

---

### Form Subcomponents

| Component | Purpose |
|-----------|---------|
| `AllocatedBudgetField` | Budget input with validation |
| `CategoryField` | Category selector |
| `ImplementingOfficeField` | Office selector |
| `ManualInputSection` | Manual entry section |
| `ParticularField` | Particular selector |
| `RemarksField` | Textarea for notes |
| `AutoCalculateSwitch` | Toggle auto-calculation |
| `UtilizationDisplay` | Shows utilization |
| `YearField` | Year selector |
| `FormActions` | Submit/Cancel buttons |

---

### ProjectSummaryStats

Statistics cards for projects.

```typescript
interface ProjectSummaryStatsProps {
  totalProjects: number;
  totalBudget: number;
  byStatus: {
    status: string;
    count: number;
    budget: number;
  }[];
  byCategory: {
    category: string;
    count: number;
    budget: number;
  }[];
}
```

---

### StatusInfoCard

Display card for project status information.

```typescript
interface StatusInfoCardProps {
  status: ProjectStatus;
  count: number;
  percentage: number;
  trend?: "up" | "down" | "neutral";
  trendValue?: number;
}
```

---

### ParticularPageHeader

Header for particular detail pages.

```typescript
interface ParticularPageHeaderProps {
  particular: BudgetParticular;
  year: number;
  stats: {
    projectCount: number;
    totalBudget: number;
    utilizationRate: number;
  };
  actions?: React.ReactNode;
}
```

---

### Modal Components

#### ProjectExpandModal
Expanded view for project details.

```typescript
interface ProjectExpandModalProps {
  project: GovtProject;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (project: GovtProject) => void;
}
```

#### ProjectShareModal
Share project via link or email.

```typescript
interface ProjectShareModalProps {
  project: GovtProject;
  isOpen: boolean;
  onClose: () => void;
}
```

#### ProjectBulkToggleDialog
Bulk status change confirmation.

```typescript
interface ProjectBulkToggleDialogProps {
  selectedIds: string[];
  targetStatus: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

---

## Combobox Components

### ProjectCategoryCombobox

Category selector with search.

```typescript
interface ProjectCategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  disabled?: boolean;
}
```

### ProjectParticularCombobox

Particular selector for projects.

```typescript
interface ProjectParticularComboboxProps {
  value: string;
  onChange: (value: string) => void;
  particulars: BudgetParticular[];
  disabled?: boolean;
}
```

---

## Hooks

### useParticularData

Fetches particular and related projects data.

```typescript
const {
  particular,
  projects,
  isLoading,
  error,
  refetch,
} = useParticularData({
  particularId: string;
  year: number;
});
```

### useParticularAccess

Permission checking for particular operations.

```typescript
const {
  canView,
  canCreate,
  canEdit,
  canDelete,
  isLoading,
} = useParticularAccess();
```

### useProjectMutations

CRUD operations for projects.

```typescript
const {
  createProject,
  updateProject,
  deleteProject,
  bulkDelete,
  toggleStatus,
  isLoading,
} = useProjectMutations();
```

---

## Types

```typescript
// types/index.ts

interface GovtProject {
  _id: Id<"govtProjects">;
  _creationTime: number;
  year: number;
  particularId: Id<"budgetParticulars">;
  projectName: string;
  category: string;
  status: ProjectStatus;
  totalBudget: number;
  description?: string;
  remarks?: string;
  isActive: boolean;
  createdBy: Id<"users">;
}

type ProjectStatus = 
  | "draft"
  | "pending"
  | "ongoing"
  | "completed"
  | "delayed"
  | "cancelled";

interface ProjectFormValues {
  projectName: string;
  category: string;
  totalBudget: number;
  description?: string;
  remarks?: string;
  status: ProjectStatus;
}
```

---

## Utilities

```typescript
// utils/index.ts

// Get full particular name with code
getParticularFullName(particular: BudgetParticular): string;
// Returns: "Roads & Bridges (01-01-001)"

// Calculate project statistics
calculateProjectStats(projects: GovtProject[]): {
  totalBudget: number;
  byStatus: Record<ProjectStatus, number>;
  byCategory: Record<string, number>;
  averageBudget: number;
};
```

---

## Constants

```typescript
// constants/projectSpreadsheetConfig.ts

export const PROJECT_COLUMNS = [
  { key: "projectName", label: "Project Name", width: 300 },
  { key: "category", label: "Category", width: 150 },
  { key: "totalBudget", label: "Budget", width: 150, type: "currency" },
  { key: "status", label: "Status", width: 120 },
  { key: "description", label: "Description", width: 400 },
];

export const PROJECT_CATEGORIES = [
  "Infrastructure",
  "Social Services",
  "Economic Development",
  "Environment",
  "Administrative",
  "Others",
];
```

---

## Usage Example

### Complete Projects Page

```tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  ProjectsTable,
  ProjectForm,
  ProjectSummaryStats,
  ParticularPageHeader,
} from "@/components/features/ppdo/projects";
import { useState } from "react";

export default function ProjectsPage({
  params,
}: {
  params: { year: string; particularId: string };
}) {
  const [showForm, setShowForm] = useState(false);
  
  const particular = useQuery(api.budgetParticulars.getById, {
    id: params.particularId,
  });
  
  const projects = useQuery(api.projects.getByParticular, {
    particularId: params.particularId,
    year: parseInt(params.year),
  });
  
  const createProject = useMutation(api.projects.create);
  
  const handleSubmit = async (data: ProjectFormValues) => {
    await createProject({
      ...data,
      particularId: params.particularId,
      year: parseInt(params.year),
    });
    setShowForm(false);
  };
  
  if (!particular || !projects) return <LoadingState />;
  
  return (
    <div className="space-y-6">
      <ParticularPageHeader
        particular={particular}
        year={parseInt(params.year)}
        stats={{
          projectCount: projects.length,
          totalBudget: projects.reduce((s, p) => s + p.totalBudget, 0),
          utilizationRate: calculateUtilization(projects),
        }}
        actions={
          <Button onClick={() => setShowForm(true)}>
            Add Project
          </Button>
        }
      />
      
      <ProjectSummaryStats
        totalProjects={projects.length}
        totalBudget={projects.reduce((s, p) => s + p.totalBudget, 0)}
        byStatus={groupByStatus(projects)}
        byCategory={groupByCategory(projects)}
      />
      
      <ProjectsTable
        projects={projects}
        categories={PROJECT_CATEGORIES}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
      />
      
      {showForm && (
        <ProjectForm
          particularId={params.particularId}
          year={parseInt(params.year)}
          availableBudget={getAvailableBudget()}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
```

---

## Related Documentation

- [Breakdown Components](./02-breakdown-components.md)
- [Table Components](./06-table-components.md)