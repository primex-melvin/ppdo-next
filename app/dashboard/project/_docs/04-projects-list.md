# Projects List (Particular View)

> Level 2: Managing projects under a budget item

---

## Overview

The Projects page displays all projects under a specific budget item (particular). Projects are grouped by category.

**Route:** `/dashboard/project/[year]/[particularId]`  
**File:** `app/dashboard/project/[year]/[particularId]/page.tsx`

---

## Features

### 1. Particular Page Header

**ParticularPageHeader Component**

Displays:
- Breadcrumb navigation
- Particular name with code
- Statistics summary
- Action buttons (Add Project, Expand, Trash)

```typescript
interface ParticularPageHeaderProps {
  particular: BudgetParticular;
  year: number;
  stats: {
    projectCount: number;
    totalBudget: number;
    utilizationRate: number;
  };
  onAddProject: () => void;
  onToggleDetails: () => void;
}
```

### 2. Project Summary Stats

**ProjectSummaryStats Component**

Cards showing:
- Total Projects
- Total Budget
- Projects by Status
- Projects by Category

### 3. Status Info Cards

**StatusInfoCard Component**

Visual indicators for:
- Completed projects (green)
- Ongoing projects (blue)
- Delayed projects (red)
- Pending projects (yellow)

### 4. Projects Table

**ProjectsTable Component**

Features:
- Category grouping (collapsible)
- Sortable columns
- Row selection
- Bulk actions
- Expandable rows
- Context menu

**Columns:**
- Project Name
- Category
- Total Budget
- Status
- Description
- Actions

### 5. Project Form

**ProjectForm Component**

Fields:
- Project Name
- Category (combobox with categories)
- Total Budget
- Description
- Remarks
- Status

---

## Component Structure

```
ParticularProjectsPage
│
├── ParticularPageHeader
│   ├── Breadcrumbs
│   ├── Title (Particular name)
│   ├── Stats
│   └── Actions
│
├── ProjectSummaryStats
│   ├── Total Projects Card
│   ├── Total Budget Card
│   └── Status Distribution
│
├── ProjectsTable
│   ├── ProjectsTableToolbar
│   │   ├── Search
│   │   ├── Category Filter
│   │   └── Bulk Actions
│   ├── ProjectCategoryGroup (for each category)
│   │   ├── Category Header
│   │   └── ProjectsTableRow (for each project)
│   └── ProjectsTableFooter
│       └── Pagination
│
├── ProjectExpandModal (conditional)
│   └── Project details
│
└── ProjectForm (conditional)
    └── Form fields
```

---

## Project Categories

Default categories:

| Category | Description |
|----------|-------------|
| Infrastructure | Roads, bridges, buildings |
| Social Services | Education, health, welfare |
| Economic Development | Agriculture, tourism, business |
| Environment | Conservation, waste management |
| Administrative | Office equipment, supplies |
| Others | Uncategorized projects |

---

## Project Status Values

| Status | Description | Color |
|--------|-------------|-------|
| draft | Initial state | Gray |
| pending | Pending approval | Yellow |
| ongoing | Active implementation | Blue |
| completed | Finished | Green |
| delayed | Behind schedule | Red |
| cancelled | Cancelled | Gray |

---

## Hooks

### useParticularData

Fetches particular and projects data.

```typescript
const {
  budgetItem,
  projects,
  breakdownStats,
  isLoading,
  error,
} = useParticularData(particularId);
```

### useParticularAccess

Permission checking for particular.

```typescript
const {
  canAccess,
  canCreate,
  canEdit,
  canDelete,
} = useParticularAccess(particularId);
```

### useProjectMutations

CRUD operations for projects.

```typescript
const {
  handleAddProject,
  handleEditProject,
  handleDeleteProject,
  handleRecalculate,
} = useProjectMutations(budgetItemId);
```

---

## Types

```typescript
// types.ts

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
// utils.ts

// Get full particular name with code
getParticularFullName(particular: BudgetParticular): string;

// Calculate project statistics
calculateProjectStats(projects: GovtProject[]): {
  totalBudget: number;
  byStatus: Record<ProjectStatus, number>;
  byCategory: Record<string, number>;
};

// Group projects by category
groupProjectsByCategory(projects: GovtProject[]): GroupedProjects;
```

---

## Usage Example

```tsx
"use client";

export default function ParticularProjectsPage() {
  const params = useParams();
  const particular = decodeURIComponent(params.particularId as string);
  
  const { canAccess } = useParticularAccess(particular);
  const { budgetItem, projects, isLoading } = useParticularData(particular);
  const mutations = useProjectMutations(budgetItem?._id);
  
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<GovtProject | null>(null);
  
  if (isLoading) return <LoadingState />;
  if (!canAccess) return <AccessDeniedPage />;
  
  const stats = calculateProjectStats(projects);
  
  return (
    <div className="space-y-6">
      <ParticularPageHeader
        particular={budgetItem}
        year={parseInt(params.year)}
        stats={{
          projectCount: projects.length,
          totalBudget: stats.totalBudget,
          utilizationRate: calculateUtilization(projects),
        }}
        onAddProject={() => setShowForm(true)}
      />
      
      <ProjectSummaryStats {...stats} />
      
      <ProjectsTable
        projects={projects}
        categories={PROJECT_CATEGORIES}
        onEdit={(project) => {
          setEditingProject(project);
          setShowForm(true);
        }}
        onDelete={mutations.handleDeleteProject}
      />
      
      {showForm && (
        <ProjectForm
          initialData={editingProject}
          particularId={budgetItem.particularId}
          year={parseInt(params.year)}
          availableBudget={getAvailableBudget()}
          onSubmit={editingProject 
            ? mutations.handleEditProject 
            : mutations.handleAddProject
          }
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
```

---

## Related Documentation

- [Budget Items](./03-budget-items.md)
- [Breakdowns List](./05-breakdowns-list.md)
