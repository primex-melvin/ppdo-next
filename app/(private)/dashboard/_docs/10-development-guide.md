# Development Guide

> Coding standards, patterns, and best practices for Dashboard development

---

## Code Organization

### File Structure
```
app/dashboard/
├── page.tsx                    # Route component
├── layout.tsx                  # Layout wrapper
├── components/                 # Shared components (within module)
│   ├── ComponentName/
│   │   ├── index.tsx          # Main component
│   │   ├── ComponentName.tsx  # Component logic
│   │   ├── hooks.ts           # Component-specific hooks
│   │   ├── utils.ts           # Helper functions
│   │   └── types.ts           # TypeScript types
│   └── ...
├── hooks/                      # Shared hooks
├── types/                      # Shared types
├── utils/                      # Shared utilities
├── constants/                  # Constants
└── [subroute]/                 # Nested routes
    └── ...
```

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `BudgetTable.tsx` |
| Hooks | camelCase, use prefix | `useBudgetData.ts` |
| Utilities | camelCase | `formatCurrency.ts` |
| Types | PascalCase, .types.ts | `budget.types.ts` |
| Constants | UPPER_SNAKE_CASE | `TABLE_CONSTANTS.ts` |
| Folders | kebab-case | `budget-table/` |

---

## Component Patterns

### 1. Functional Components
```typescript
// Use function declarations for components
export function BudgetTable({ items }: BudgetTableProps) {
  return (
    <table>
      {items.map(item => (
        <BudgetRow key={item._id} item={item} />
      ))}
    </table>
  );
}

// Default export for page components
export default function BudgetPage() {
  // ...
}
```

### 2. Props Interface
```typescript
interface BudgetTableProps {
  items: BudgetItem[];
  onEdit?: (item: BudgetItem) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

// Destructure in function params
export function BudgetTable({ 
  items, 
  onEdit, 
  onDelete, 
  isLoading = false 
}: BudgetTableProps) {
  // ...
}
```

### 3. Client Components
```typescript
// Always add "use client" for client components
"use client";

import { useState } from "react";

export function InteractiveComponent() {
  const [count, setCount] = useState(0);
  // ...
}
```

### 4. Loading States
```typescript
export function DataComponent() {
  const data = useQuery(api.items.list, {});
  
  // Handle loading
  if (data === undefined) {
    return <Skeleton count={5} />;
  }
  
  // Handle empty
  if (data.length === 0) {
    return <EmptyState />;
  }
  
  // Render data
  return <List items={data} />;
}
```

---

## Hook Patterns

### Custom Hooks
```typescript
// hooks/useBudgetData.ts
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UseBudgetDataOptions {
  year: number;
  includeInactive?: boolean;
}

interface UseBudgetDataReturn {
  budgetItems: BudgetItem[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function useBudgetData(
  options: UseBudgetDataOptions
): UseBudgetDataReturn {
  const { year, includeInactive = false } = options;
  
  const budgetItems = useQuery(
    api.budgetItems.getByYear, 
    { year, includeInactive }
  );
  
  return {
    budgetItems,
    isLoading: budgetItems === undefined,
    error: null,
  };
}
```

### Hook Rules
1. Always start with `use`
2. Call hooks at the top level
3. Call hooks from React functions only
4. Return typed objects
5. Document with JSDoc

---

## Styling Standards

### Tailwind CSS
```typescript
// Use class-variance-authority for variants
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-input bg-background",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
  }
);
```

### Common Classes
```typescript
// Container
className="space-y-4"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Cards
className="bg-white dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"

// Text
className="text-2xl font-bold text-zinc-900 dark:text-zinc-100"
className="text-sm text-zinc-600 dark:text-zinc-400"

// Interactive
className="hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
```

### Conditional Classes
```typescript
import { cn } from "@/lib/utils";

className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes",
  size === "large" ? "text-lg" : "text-sm"
)}
```

---

## Form Handling

### React Hook Form + Zod
```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  amount: z.number().min(0, "Amount must be positive"),
  year: z.number().int().min(2000).max(2100),
});

type FormData = z.infer<typeof formSchema>;

export function BudgetForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: 0,
      year: new Date().getFullYear(),
    },
  });
  
  const onSubmit = async (data: FormData) => {
    // Handle submit
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

---

## Error Handling

### Try-Catch Pattern
```typescript
const handleCreate = async (data: FormData) => {
  try {
    setIsSubmitting(true);
    const id = await createItem(data);
    toast.success("Item created successfully!");
    router.push(`/dashboard/project/2025/${id}`);
  } catch (error) {
    console.error("Create failed:", error);
    toast.error(
      error instanceof Error 
        ? error.message 
        : "Failed to create item"
    );
  } finally {
    setIsSubmitting(false);
  }
};
```

### Error Boundaries
```typescript
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

---

## Performance Optimization

### 1. Memoization
```typescript
import { useMemo, useCallback } from "react";

// Memoize expensive calculations
const stats = useMemo(() => {
  return items.reduce((acc, item) => ({
    total: acc.total + item.amount,
    count: acc.count + 1,
  }), { total: 0, count: 0 });
}, [items]);

// Memoize callbacks
const handleEdit = useCallback((id: string) => {
  router.push(`/dashboard/project/2025/${id}/edit`);
}, [router]);
```

### 2. Virtualization (for long lists)
```typescript
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualTable({ rows }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  
  // Render only visible rows
}
```

### 3. Code Splitting
```typescript
// Dynamic imports for heavy components
const HeavyChart = dynamic(
  () => import("./HeavyChart"),
  { 
    loading: () => <Skeleton height={300} />,
    ssr: false 
  }
);
```

---

## Testing

### Component Testing
```typescript
// __tests__/components/BudgetTable.test.tsx

import { render, screen } from "@testing-library/react";
import { BudgetTable } from "@/app/dashboard/project/[year]/components/BudgetTable";

describe("BudgetTable", () => {
  const mockItems = [
    { _id: "1", name: "Item 1", amount: 1000 },
    { _id: "2", name: "Item 2", amount: 2000 },
  ];
  
  it("renders items correctly", () => {
    render(<BudgetTable items={mockItems} />);
    
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });
  
  it("shows loading state", () => {
    render(<BudgetTable items={undefined} isLoading />);
    
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });
});
```

### Hook Testing
```typescript
// __tests__/hooks/useBudgetData.test.ts

import { renderHook, waitFor } from "@testing-library/react";
import { useBudgetData } from "@/app/dashboard/project/[year]/hooks/useBudgetData";

describe("useBudgetData", () => {
  it("fetches budget data", async () => {
    const { result } = renderHook(() => 
      useBudgetData({ year: 2025 })
    );
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.budgetItems).toBeDefined();
  });
});
```

---

## Git Workflow

### Branch Naming
```
feature/dashboard-project-table
fix/budget-calculation-bug
refactor/particulars-hooks
docs/api-documentation
```

### Commit Messages
```
feat: add column resize to budget table
fix: correct utilization rate calculation
refactor: extract useBudgetData hook
docs: update project module documentation
style: fix indentation in BudgetTable
test: add tests for useBudgetMutations
```

---

## Environment Variables

### Client-Side (Accessible in Browser)
```env
# .env.local
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### Server-Side Only
```env
CONVEX_DEPLOY_KEY=your-deploy-key
```

---

## Debugging Tips

### 1. React DevTools
- Use Components tab to inspect props
- Use Profiler to find slow renders

### 2. Convex Dashboard
- View real-time data
- Test queries/mutations
- Check function logs

### 3. Console Logging
```typescript
// Structured logging
console.log("[BudgetTable] Render:", { 
  itemsCount: items?.length,
  isLoading,
  selectedRow 
});
```

### 4. VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    }
  ]
}
```

---

## Related Documentation

- [Architecture Overview](./01-architecture-overview.md)
- [Data Flow & Convex](./08-data-flow.md)
- [Module: Projects](./04-module-projects.md) - Complex examples
