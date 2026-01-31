# Projects Module Architecture

> Understanding the architecture of the Projects module

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PROJECTS MODULE                                    │
│                    Budget Items → Projects → Breakdowns                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      LEVEL 1: BUDGET ITEMS                           │   │
│  │  Route: /dashboard/project/[year]                                    │   │
│  │                                                                      │   │
│  │  Components:                                                         │   │
│  │  ├── BudgetTrackingTable      (Data table with CRUD)                 │   │
│  │  ├── BudgetStatistics         (Summary cards)                        │   │
│  │  ├── BudgetItemForm           (Add/Edit form)                        │   │
│  │  ├── BudgetModal              (Modal wrapper)                        │   │
│  │  └── PrintPreview             (Canvas-based print)                   │   │
│  │                                                                      │   │
│  │  Data: budgetItems, statistics, particulars                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       LEVEL 2: PROJECTS                              │   │
│  │  Route: /dashboard/project/[year]/[particularId]                     │   │
│  │                                                                      │   │
│  │  Components:                                                         │   │
│  │  ├── ProjectsTable            (Category-grouped table)               │   │
│  │  ├── ProjectForm              (Add/Edit project)                     │   │
│  │  ├── ProjectSummaryStats      (Statistics display)                   │   │
│  │  └── ParticularPageHeader     (Header with breadcrumbs)              │   │
│  │                                                                      │   │
│  │  Data: projects, budgetItem, breakdownStats                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      LEVEL 3: BREAKDOWNS                             │   │
│  │  Route: /dashboard/project/[year]/[particularId]/[breakdownId]       │   │
│  │                                                                      │   │
│  │  Components:                                                         │   │
│  │  ├── BreakdownHistoryTable    (Breakdown items table)                │   │
│  │  ├── BreakdownForm            (Add/Edit breakdown)                   │   │
│  │  ├── StatusChainCard          (Status chain UI)                      │   │
│  │  └── TableToolbar             (Actions toolbar)                      │   │
│  │                                                                      │   │
│  │  Data: breakdowns, project, implementingOffices                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      LEVEL 4: PROJECT DETAIL                         │   │
│  │  Route: /dashboard/project/[year]/.../[projectId]                    │   │
│  │                                                                      │   │
│  │  Components:                                                         │   │
│  │  ├── OverviewContent          (Project overview)                     │   │
│  │  ├── InspectionContent        (Inspections + media)                  │   │
│  │  ├── AnalyticsContent         (Charts + stats)                       │   │
│  │  └── RemarksContent           (Comments thread)                      │   │
│  │                                                                      │   │
│  │  Data: breakdownDetails, inspections, remarks                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
User Action
    │
    ▼
┌─────────────────┐
│  Page Component │  ← Uses hooks for data/mutations
│  (page.tsx)     │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│ Hooks  │ │ Components│
│        │ │           │
│ - use  │ │ - Tables  │
│   Budget│ │ - Forms   │
│   Data  │ │ - Modals  │
│ - use  │ │ - Cards   │
│   Mutations│          │
└────┬───┘ └─────┬─────┘
     │           │
     ▼           ▼
┌─────────────────────────┐
│    Convex Backend       │
│  - Queries (read)       │
│  - Mutations (write)    │
│  - Real-time sync       │
└─────────────────────────┘
```

---

## Component Relationships

### Budget Items Level

```
YearBudgetPage (page.tsx)
│
├── YearBudgetPageHeader
│   └── [Title, Stats Summary, Actions]
│
├── BudgetStatistics
│   ├── StatCard (Total Allocated)
│   ├── StatCard (Total Utilized)
│   └── StatCard (Utilization Rate)
│
├── BudgetTrackingTable
│   ├── BudgetTableToolbar
│   │   ├── Search
│   │   ├── ColumnVisibilityMenu
│   │   └── BulkActions
│   ├── BudgetTableHeader (Sortable)
│   ├── BudgetTableRow (Selectable)
│   ├── BudgetTableTotalsRow
│   └── BudgetContextMenu
│
└── BudgetModal (for Add/Edit)
    └── BudgetItemForm
        ├── YearField
        ├── ParticularField
        ├── AllocatedBudgetField
        ├── AutoCalculateSwitch
        └── FormActions
```

### Projects Level

```
ParticularProjectsPage (page.tsx)
│
├── ParticularPageHeader
│   └── [Breadcrumbs, Title, Actions]
│
├── ProjectSummaryStats
│   ├── StatCard (Total Projects)
│   ├── StatCard (Total Budget)
│   └── StatusInfoCard (by status)
│
├── ProjectsTable
│   ├── ProjectsTableToolbar
│   ├── ProjectCategoryGroup
│   │   └── ProjectsTableRow
│   └── ProjectsTableFooter (Pagination)
│
└── ProjectExpandModal
    └── [Project details in modal]
```

### Breakdowns Level

```
BreakdownPage (page.tsx)
│
├── BreakdownHistoryTable
│   ├── TableToolbar
│   ├── TableHeader
│   ├── TableRow (many)
│   └── TableTotalsRow
│
└── BreakdownForm
    ├── ProjectTitleField
    ├── ImplementingOfficeField
    ├── AllocatedBudgetField
    ├── StatusChainCard
    └── FormActions
```

---

## Key Design Patterns

### 1. Container/Presentational Pattern

```tsx
// Container (handles data)
"use client";
export default function YearBudgetPage({ params }: PageProps) {
  const { budgetItems, statistics } = useBudgetData();
  const mutations = useBudgetMutations();
  
  return (
    <BudgetTrackingTable
      data={budgetItems}
      statistics={statistics}
      onEdit={mutations.handleEdit}
      onDelete={mutations.handleDelete}
    />
  );
}

// Presentational (pure UI)
function BudgetTrackingTable({ data, onEdit, onDelete }: Props) {
  return (
    <table>
      {data.map(item => (
        <Row 
          key={item._id}
          item={item}
          onEdit={() => onEdit(item)}
        />
      ))}
    </table>
  );
}
```

### 2. Custom Hooks Pattern

```tsx
// Data hook
function useBudgetData() {
  const data = useQuery(api.budgetItems.getByYear, { year });
  const statistics = useMemo(() => calculateStats(data), [data]);
  return { data, statistics };
}

// Mutations hook
function useBudgetMutations() {
  const update = useMutation(api.budgetItems.update);
  const remove = useMutation(api.budgetItems.remove);
  
  return {
    handleEdit: async (data) => { ... },
    handleDelete: async (id) => { ... },
  };
}
```

### 3. Compound Component Pattern

```tsx
// Table with related components
<BudgetTrackingTable>
  <BudgetTrackingTable.Toolbar>
    <SearchBar />
    <ColumnVisibilityMenu />
  </BudgetTrackingTable.Toolbar>
  
  <BudgetTrackingTable.Header>
    <Column sortable>Particular</Column>
    <Column sortable>Allocated</Column>
  </BudgetTrackingTable.Header>
  
  <BudgetTrackingTable.Body>
    {items.map(item => <Row key={item._id} />)}
  </BudgetTrackingTable.Body>
</BudgetTrackingTable>
```

---

## State Management

### Local State (useState)
- UI state: modals open/closed, expanded rows
- Form state: input values, validation errors
- Selection state: selected rows

### Global State (Convex)
- Budget items data
- Projects data
- Breakdowns data
- Real-time synchronization

### URL State
- Current year
- Particular ID
- Filter parameters

---

## Related Documentation

- [Route Structure](./02-route-structure.md)
- [Hooks & Data Flow](./07-hooks-data-flow.md)
