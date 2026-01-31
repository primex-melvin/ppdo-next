# Hooks & Data Flow

> Understanding data fetching, mutations, and state management

---

## Data Flow Architecture

```
Page Component
    │
    ├── useQuery (Convex) ──→ Real-time data
    │
    ├── useMutation (Convex) ──→ CRUD operations
    │
    └── Custom Hooks ──→ Business logic
         │
         ├── useBudgetData
         ├── useBudgetMutations
         ├── useParticularData
         ├── useProjectMutations
         └── useTableSettings
```

---

## Custom Hooks Reference

### Level 1: Budget Items Hooks

#### useBudgetData

Fetches budget data for a fiscal year.

```typescript
// _lib/useBudgetData.ts

function useBudgetData(year: number) {
  const budgetItems = useQuery(api.budgetItems.getByYear, { year });
  
  const statistics = useMemo(() => {
    if (!budgetItems) return null;
    
    const totalAllocated = budgetItems.reduce(
      (sum, item) => sum + item.totalBudgetAllocated, 0
    );
    const totalUtilized = budgetItems.reduce(
      (sum, item) => sum + item.totalBudgetUtilized, 0
    );
    const totalObligated = budgetItems.reduce(
      (sum, item) => sum + (item.obligatedBudget || 0), 0
    );
    
    return {
      totalAllocated,
      totalUtilized,
      totalObligated,
      averageUtilizationRate: totalAllocated > 0 
        ? (totalUtilized / totalAllocated) * 100 
        : 0,
      totalProjects: budgetItems.length,
    };
  }, [budgetItems]);
  
  return {
    budgetItems,
    statistics,
    isLoading: budgetItems === undefined,
  };
}
```

#### useBudgetMutations

CRUD operations for budget items.

```typescript
// _lib/useBudgetMutations.ts

function useBudgetMutations() {
  const create = useMutation(api.budgetItems.create);
  const update = useMutation(api.budgetItems.update);
  const remove = useMutation(api.budgetItems.remove);
  
  const handleAdd = async (data: BudgetFormValues) => {
    try {
      const id = await create(data);
      toast.success("Budget item created");
      return id;
    } catch (error) {
      toast.error("Failed to create budget item");
      throw error;
    }
  };
  
  const handleEdit = async (id: string, data: Partial<BudgetFormValues>) => {
    try {
      await update({ id, ...data });
      toast.success("Budget item updated");
    } catch (error) {
      toast.error("Failed to update budget item");
      throw error;
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      await remove({ id });
      toast.success("Budget item deleted");
    } catch (error) {
      toast.error("Failed to delete budget item");
      throw error;
    }
  };
  
  return {
    handleAdd,
    handleEdit,
    handleDelete,
  };
}
```

#### useBudgetAccess

Permission checking.

```typescript
// _lib/useBudgetAccess.ts

function useBudgetAccess() {
  const { user, isLoading: loadingUser } = useCurrentUser();
  const accessCheck = useQuery(
    api.access.checkBudgetAccess,
    user ? { userId: user._id } : "skip"
  );
  
  const canAccess = accessCheck?.granted ?? false;
  const canCreate = user?.role === "admin" || user?.role === "super_admin";
  const canEdit = canCreate;
  const canDelete = canCreate;
  
  return {
    accessCheck,
    canAccess,
    canCreate,
    canEdit,
    canDelete,
    isLoading: loadingUser || accessCheck === undefined,
  };
}
```

---

### Level 2: Projects Hooks

#### useParticularData

Fetches particular and projects data.

```typescript
// components/ppdo/projects/hooks/useParticularData.ts

function useParticularData(particularId: string) {
  const budgetItem = useQuery(api.budgetItems.getByParticularId, {
    particularId,
  });
  
  const projects = useQuery(api.projects.getByParticular, {
    particularId,
  });
  
  const breakdownStats = useMemo(() => {
    if (!projects) return null;
    
    return {
      totalProjects: projects.length,
      totalBudget: projects.reduce((s, p) => s + p.totalBudget, 0),
      byStatus: groupBy(projects, "status"),
      byCategory: groupBy(projects, "category"),
    };
  }, [projects]);
  
  return {
    budgetItem,
    projects,
    breakdownStats,
    isLoading: budgetItem === undefined || projects === undefined,
  };
}
```

#### useProjectMutations

CRUD operations for projects.

```typescript
// components/ppdo/projects/hooks/useProjectMutations.ts

function useProjectMutations(budgetItemId?: string) {
  const create = useMutation(api.projects.create);
  const update = useMutation(api.projects.update);
  const remove = useMutation(api.projects.remove);
  const recalculate = useMutation(api.projects.recalculateBudget);
  
  const handleAddProject = async (data: ProjectFormValues) => {
    const id = await create({ ...data, budgetItemId });
    await recalculate({ budgetItemId });
    return id;
  };
  
  const handleEditProject = async (id: string, data: Partial<ProjectFormValues>) => {
    await update({ id, ...data });
    await recalculate({ budgetItemId });
  };
  
  const handleDeleteProject = async (id: string) => {
    await remove({ id });
    await recalculate({ budgetItemId });
  };
  
  return {
    handleAddProject,
    handleEditProject,
    handleDeleteProject,
    handleRecalculate,
  };
}
```

---

### Level 3: Breakdowns Hooks

#### useTableSettings

Manages table configuration with persistence.

```typescript
// _lib/useTableSettings.ts

function useTableSettings() {
  const [settings, setSettings] = useState<TableSettings>(() => {
    // Load from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("breakdown-table-settings");
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    }
    return DEFAULT_SETTINGS;
  });
  
  const updateColumnWidth = (columnId: string, width: number) => {
    setSettings(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === columnId ? { ...col, width } : col
      ),
    }));
  };
  
  const updateColumnOrder = (newOrder: string[]) => {
    setSettings(prev => ({
      ...prev,
      columnOrder: newOrder,
    }));
  };
  
  const toggleColumnVisibility = (columnId: string) => {
    setSettings(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      ),
    }));
  };
  
  // Save to localStorage when settings change
  useEffect(() => {
    localStorage.setItem("breakdown-table-settings", JSON.stringify(settings));
  }, [settings]);
  
  return {
    settings,
    updateColumnWidth,
    updateColumnOrder,
    toggleColumnVisibility,
    resetSettings: () => setSettings(DEFAULT_SETTINGS),
  };
}
```

---

## Convex API Integration

### Queries

```typescript
// Budget Items
api.budgetItems.list                    // List all
api.budgetItems.getByYear               // By year
api.budgetItems.getById                 // Single item
api.budgetItems.getByParticularId       // By particular

// Projects
api.projects.list                       // List all
api.projects.getByParticular            // By particular
api.projects.getById                    // Single project

// Breakdowns
api.govtProjectBreakdowns.getByProject  // By project
api.govtProjectBreakdowns.getById       // Single breakdown

// Inspections
api.inspections.getByBreakdown          // By breakdown

// Remarks
api.remarks.getByBreakdown              // By breakdown
```

### Mutations

```typescript
// Budget Items
api.budgetItems.create
api.budgetItems.update
api.budgetItems.remove
api.budgetItems.bulkDelete
api.budgetItems.toggleStatus

// Projects
api.projects.create
api.projects.update
api.projects.remove
api.projects.recalculateBudget

// Breakdowns
api.govtProjectBreakdowns.create
api.govtProjectBreakdowns.update
api.govtProjectBreakdowns.remove

// Inspections
api.inspections.create
api.inspections.update
api.inspections.remove

// Remarks
api.remarks.create
api.remarks.update
api.remarks.remove
```

---

## Error Handling

### Query Error Pattern

```typescript
const data = useQuery(api.items.list, {});

if (data === undefined) {
  return <LoadingState />;  // Still loading
}

if (data === null) {
  return <ErrorState message="Failed to load data" />;  // Error
}

return <DataView data={data} />;  // Success
```

### Mutation Error Pattern

```typescript
const handleSubmit = async (data: FormValues) => {
  try {
    await mutation(data);
    toast.success("Success!");
    onSuccess?.();
  } catch (error) {
    if (error.message.includes("duplicate")) {
      toast.error("Item already exists");
    } else if (error.message.includes("unauthorized")) {
      toast.error("You don't have permission");
    } else {
      toast.error("An unexpected error occurred");
    }
    console.error(error);
  }
};
```

---

## Optimistic Updates

```typescript
function useOptimisticMutation() {
  const [items, setItems] = useState<Item[]>([]);
  const mutation = useMutation(api.items.update);
  
  const updateItem = async (id: string, newData: Partial<Item>) => {
    const original = items.find(i => i._id === id);
    
    // Optimistic update
    setItems(prev =>
      prev.map(i => (i._id === id ? { ...i, ...newData } : i))
    );
    
    try {
      await mutation({ id, ...newData });
    } catch (error) {
      // Rollback on error
      setItems(prev =>
        prev.map(i => (i._id === id ? original! : i))
      );
      throw error;
    }
  };
  
  return { items, updateItem };
}
```

---

## Related Documentation

- [Budget Items](./03-budget-items.md)
- [Projects List](./04-projects-list.md)
- [Breakdowns List](./05-breakdowns-list.md)
