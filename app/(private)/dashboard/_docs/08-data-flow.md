# Data Flow & Convex

> Understanding how data flows between the Dashboard and Convex backend

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Dashboard)                          │
│                                                                     │
│  ┌─────────────────┐      ┌─────────────────┐                      │
│  │   React Hook    │──────│   useQuery()    │                      │
│  │   useBudgetData │      │   useMutation() │                      │
│  └─────────────────┘      └────────┬────────┘                      │
│                                    │                                │
│                         ┌──────────▼──────────┐                    │
│                         │   Convex React SDK  │                    │
│                         │   (Real-time sync)  │                    │
│                         └──────────┬──────────┘                    │
│                                    │                                │
└────────────────────────────────────┼────────────────────────────────┘
                                     │ WebSocket
                                     ▼
┌────────────────────────────────────┼────────────────────────────────┐
│                         CONVEX     │                                │
│                                    ▼                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      Convex Backend                           │  │
│  │                                                               │  │
│  │   ┌──────────┐    ┌──────────┐    ┌──────────┐              │  │
│  │   │  Query   │    │ Mutation │    │  Action  │              │  │
│  │   │  (read)  │    │ (write)  │    │ (async)  │              │  │
│  │   └────┬─────┘    └────┬─────┘    └────┬─────┘              │  │
│  │        │               │               │                     │  │
│  │        └───────────────┼───────────────┘                     │  │
│  │                        ▼                                      │  │
│  │   ┌─────────────────────────────────────────────────────┐    │  │
│  │   │              Convex Database                         │    │  │
│  │   │  • Documents (JSON)                                  │    │  │
│  │   │  • Indexes (performance)                             │    │  │
│  │   │  • Real-time subscriptions                           │    │  │
│  │   └─────────────────────────────────────────────────────┘    │  │
│  │                                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Convex Fundamentals

### What is Convex?
Convex is a backend-as-a-service with:
- **Real-time database** - Live subscriptions to data changes
- **Serverless functions** - Queries, mutations, and actions
- **Type safety** - End-to-end TypeScript support
- **Automatic scaling** - No server management

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Query** | Read-only function, runs on server, cached on client |
| **Mutation** | Write function, transactional, runs on server |
| **Action** | Async function, can call external APIs |
| **Document** | JSON object stored in database |
| **Index** | Optimized lookup structure for queries |

---

## Using Convex in Dashboard

### 1. Queries (Reading Data)
```typescript
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function BudgetPage({ year }: { year: number }) {
  // Auto-subscribes to changes
  const budgetItems = useQuery(api.budgetItems.getByYear, { year });
  
  // Loading state
  if (budgetItems === undefined) {
    return <LoadingState />;
  }
  
  // Render data
  return <BudgetTable data={budgetItems} />;
}
```

### 2. Mutations (Writing Data)
```typescript
"use client";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function BudgetForm() {
  const createBudget = useMutation(api.budgetItems.create);
  
  const handleSubmit = async (data: BudgetFormData) => {
    try {
      const newId = await createBudget({
        year: data.year,
        particularId: data.particularId,
        totalBudgetAllocated: data.allocated,
      });
      toast.success("Budget item created!");
    } catch (error) {
      toast.error("Failed to create budget item");
    }
  };
  
  return <Form onSubmit={handleSubmit} />;
}
```

### 3. Real-time Updates
```typescript
// When data changes in the database:
// 1. Convex pushes update via WebSocket
// 2. React automatically re-renders with new data
// 3. No polling or manual refresh needed!

function LiveBudgetCounter({ year }: { year: number }) {
  const items = useQuery(api.budgetItems.getByYear, { year });
  
  // This number updates in real-time as items are added/removed
  return <div>Count: {items?.length ?? 0}</div>;
}
```

---

## Generated API Client

Convex generates a type-safe API client:

```typescript
// convex/_generated/api.ts

export const api = {
  // Auth
  auth: {
    getCurrentUser: ...
  },
  // Budget Items
  budgetItems: {
    list: ...
    getByYear: ...
    getById: ...
    create: ...
    update: ...
    remove: ...
  },
  // Projects
  projects: {
    list: ...
    getByParticular: ...
    create: ...
    update: ...
  },
  // ...and more
};
```

---

## Common Data Patterns

### Pattern 1: List + Detail
```typescript
// List page
const items = useQuery(api.items.list, {});

// Detail page
const item = useQuery(api.items.getById, { id });
```

### Pattern 2: Filtered List
```typescript
const filtered = useQuery(api.items.getByStatus, { 
  status: "active",
  year: 2025 
});
```

### Pattern 3: Aggregated Data
```typescript
// Server-side aggregation
const stats = useQuery(api.items.getStats, { year: 2025 });

// Returns pre-calculated aggregates
// { total: 1000000, count: 50, avg: 20000 }
```

### Pattern 4: Related Data
```typescript
// Fetch related data in parallel
const projects = useQuery(api.projects.list, {});
const departments = useQuery(api.departments.list, {});

// Combine on client
const enrichedProjects = useMemo(() => {
  if (!projects || !departments) return undefined;
  return projects.map(p => ({
    ...p,
    department: departments.find(d => d._id === p.departmentId)
  }));
}, [projects, departments]);
```

---

## Optimistic Updates

Make UI feel instant with optimistic updates:

```typescript
const updateBudget = useMutation(api.budgetItems.update);

const handleUpdate = async (id, newData) => {
  // Store original for rollback
  const original = budgetItems.find(b => b._id === id);
  
  // Optimistically update UI
  setLocalBudgetItems(items => 
    items.map(b => b._id === id ? { ...b, ...newData } : b)
  );
  
  try {
    await updateBudget({ id, ...newData });
  } catch (error) {
    // Rollback on error
    setLocalBudgetItems(items => 
      items.map(b => b._id === id ? original : b)
    );
    toast.error("Update failed");
  }
};
```

---

## Caching Strategy

Convex automatically caches queries:

```
1. First call → Fetches from server
2. Subsequent calls → Returns cached data
3. Background revalidation → Updates cache
4. Real-time updates → Invalidates and refreshes
```

### Cache Invalidation
```typescript
// Convex handles this automatically!
// When any mutation modifies data:
// - Related queries are re-fetched
// - Subscribers receive updates
```

---

## Error Handling

### Query Errors
```typescript
const data = useQuery(api.items.list, {});

// undefined = still loading
// null = error occurred
// data = success

if (data === undefined) return <Loading />;
if (data === null) return <Error message="Failed to load" />;
return <List items={data} />;
```

### Mutation Errors
```typescript
const createItem = useMutation(api.items.create);

const handleCreate = async (data) => {
  try {
    await createItem(data);
    toast.success("Created!");
  } catch (error) {
    // Handle specific errors
    if (error.message.includes("duplicate")) {
      toast.error("Item already exists");
    } else {
      toast.error("Something went wrong");
    }
  }
};
```

---

## Loading States

### Pattern 1: Skeleton Loading
```typescript
const data = useQuery(api.items.list, {});
const isLoading = data === undefined;

return (
  <>
    {isLoading ? (
      <Skeleton count={5} />
    ) : (
      <List items={data} />
    )}
  </>
);
```

### Pattern 2: Suspense (Future)
```typescript
// With React Suspense
<Suspense fallback={<Loading />}>
  <BudgetContent year={2025} />
</Suspense>
```

---

## Data Relationships

### One-to-Many
```typescript
// Budget Item → Projects
const budgetItem = useQuery(api.budgetItems.getById, { id });
const projects = useQuery(api.projects.getByParticular, { 
  particularId: id 
});
```

### Many-to-One
```typescript
// Project → Budget Item
const project = useQuery(api.projects.getById, { id });
const budgetItem = useQuery(api.budgetItems.getById, { 
  id: project?.particularId 
});
```

---

## Best Practices

### 1. Co-locate Queries
```typescript
// Good: Query in component that needs data
function BudgetTable({ year }) {
  const items = useQuery(api.budgetItems.getByYear, { year });
  // ...
}

// Bad: Passing data through many props
```

### 2. Use Selective Queries
```typescript
// Good: Server filters data
const activeItems = useQuery(api.items.getByStatus, { 
  status: "active" 
});

// Bad: Client filters all data
const allItems = useQuery(api.items.list, {});
const activeItems = allItems?.filter(i => i.status === "active");
```

### 3. Handle Loading States
```typescript
// Always handle undefined (loading) state
const data = useQuery(api.items.list, {});
if (data === undefined) return <Loading />;
```

### 4. Type Safety
```typescript
// Types are generated automatically
import { Doc } from "@/convex/_generated/dataModel";

type BudgetItem = Doc<"budgetItems">;
```

---

## Convex Schema Reference

### Key Tables
| Table | Purpose |
|-------|---------|
| `users` | User accounts and roles |
| `departments` | Department/Office entities |
| `fiscalYears` | Fiscal year definitions |
| `budgetItems` | Top-level budget allocations |
| `govtProjects` | Projects under budget items |
| `govtProjectBreakdowns` | Project breakdown items |
| `budgetParticulars` | Budget classification |
| `projectParticulars` | Project classification |
| `trustFunds` | Trust fund records |
| `specialEducationFunds` | SEF records |
| `specialHealthFunds` | SHF records |
| `inspections` | Project inspection records |
| `bugReports` | Bug tracking |
| `suggestions` | Feature requests |

---

## Related Documentation

- [Convex Official Docs](https://docs.convex.dev)
- [Module: Projects](./04-module-projects.md) - Complex data patterns
- [Development Guide](./10-development-guide.md) - Coding standards
