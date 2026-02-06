# Component Patterns

> Common patterns and best practices for PPDO components

---

## Component Design Principles

### 1. Single Responsibility
Each component should do one thing well.

```tsx
// Good: Focused component
function BudgetAmount({ amount }: { amount: number }) {
  return (
    <span className="font-mono">
      {formatCurrency(amount)}
    </span>
  );
}

// Bad: Too many responsibilities
function BudgetCard({ item }) {
  // Data fetching
  // Formatting
  // Editing
  // Deleting
  // Chart rendering
}
```

### 2. Composition over Configuration
Use children and composition instead of many props.

```tsx
// Good: Composable
<Card>
  <CardHeader>
    <CardTitle>Budget Overview</CardTitle>
  </CardHeader>
  <CardContent>
    <BudgetAmount amount={1000000} />
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>

// Bad: Too many props
<BudgetCard
  title="Budget Overview"
  amount={1000000}
  showButton={true}
  buttonText="View Details"
  onButtonClick={handleClick}
/>
```

### 3. Controlled vs Uncontrolled
Support both patterns when appropriate.

```tsx
// Controlled
function Input({ value, onChange }: InputProps) {
  return <input value={value} onChange={onChange} />;
}

// Uncontrolled with ref
function Input({ defaultValue }: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return <input ref={inputRef} defaultValue={defaultValue} />;
}
```

---

## Common Patterns

### Container/Presentational Pattern

```tsx
// Container: Handles data and logic
"use client";

function BudgetContainer({ year }: { year: number }) {
  const data = useQuery(api.budgetItems.getByYear, { year });
  const mutations = useBudgetMutations();
  
  if (data === undefined) return <Skeleton />;
  
  return (
    <BudgetTable 
      data={data} 
      onEdit={mutations.update}
      onDelete={mutations.remove}
    />
  );
}

// Presentational: Pure UI
function BudgetTable({ 
  data, 
  onEdit, 
  onDelete 
}: BudgetTableProps) {
  return (
    <table>
      {data.map(item => (
        <BudgetRow 
          key={item._id}
          item={item}
          onEdit={() => onEdit(item)}
          onDelete={() => onDelete(item._id)}
        />
      ))}
    </table>
  );
}
```

---

### Custom Hooks Pattern

```tsx
// Extract logic into hooks
function useBudgetData(year: number) {
  const data = useQuery(api.budgetItems.getByYear, { year });
  const [filter, setFilter] = useState("");
  
  const filtered = useMemo(() => {
    if (!data) return undefined;
    return data.filter(d => 
      d.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [data, filter]);
  
  return { data: filtered, filter, setFilter };
}

// Use in component
function BudgetPage({ year }: { year: number }) {
  const { data, filter, setFilter } = useBudgetData(year);
  
  return (
    <>
      <input 
        value={filter} 
        onChange={e => setFilter(e.target.value)}
      />
      <BudgetTable data={data} />
    </>
  );
}
```

---

### Render Props Pattern

```tsx
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

// Usage
<List
  items={budgetItems}
  keyExtractor={item => item._id}
  renderItem={item => (
    <BudgetCard item={item} />
  )}
/>
```

---

### Compound Components Pattern

```tsx
// Table compound component
const Table = {
  Root: function TableRoot({ children }: { children: React.ReactNode }) {
    return <table className="w-full">{children}</table>;
  },
  
  Header: function TableHeader({ children }: { children: React.ReactNode }) {
    return <thead>{children}</thead>;
  },
  
  Body: function TableBody({ children }: { children: React.ReactNode }) {
    return <tbody>{children}</tbody>;
  },
  
  Row: function TableRow({ children }: { children: React.ReactNode }) {
    return <tr className="border-b">{children}</tr>;
  },
  
  Cell: function TableCell({ children }: { children: React.ReactNode }) {
    return <td className="p-4">{children}</td>;
  },
};

// Usage
<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Cell>Name</Table.Cell>
      <Table.Cell>Amount</Table.Cell>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {items.map(item => (
      <Table.Row key={item._id}>
        <Table.Cell>{item.name}</Table.Cell>
        <Table.Cell>{item.amount}</Table.Cell>
      </Table.Row>
    ))}
  </Table.Body>
</Table.Root>
```

---

## State Management Patterns

### Local State
```tsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Lifted State
```tsx
function Parent() {
  const [value, setValue] = useState("");
  return (
    <>
      <Input value={value} onChange={setValue} />
      <Display value={value} />
    </>
  );
}
```

### State Reducer
```tsx
type Action = 
  | { type: "add"; item: Item }
  | { type: "remove"; id: string }
  | { type: "update"; id: string; item: Partial<Item> };

function itemsReducer(state: Item[], action: Action): Item[] {
  switch (action.type) {
    case "add":
      return [...state, action.item];
    case "remove":
      return state.filter(i => i._id !== action.id);
    case "update":
      return state.map(i => 
        i._id === action.id ? { ...i, ...action.item } : i
      );
  }
}

function ItemList() {
  const [items, dispatch] = useReducer(itemsReducer, []);
  
  return (
    <>
      <button onClick={() => dispatch({ type: "add", item: newItem })}>
        Add
      </button>
      {items.map(item => (
        <button 
          key={item._id}
          onClick={() => dispatch({ type: "remove", id: item._id })}
        >
          Remove
        </button>
      ))}
    </>
  );
}
```

---

## Form Patterns

### React Hook Form + Zod
```tsx
const schema = z.object({
  name: z.string().min(2, "Name is required"),
  amount: z.number().min(0, "Amount must be positive"),
});

type FormData = z.infer<typeof schema>;

function BudgetForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", amount: 0 },
  });
  
  const onSubmit = async (data: FormData) => {
    await createBudget(data);
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

## Error Handling Patterns

### Error Boundary
```tsx
"use client";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Async Error Handling
```tsx
function DataComponent() {
  const [error, setError] = useState<Error | null>(null);
  
  const handleAction = async () => {
    try {
      await riskyOperation();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    }
  };
  
  if (error) return <ErrorDisplay error={error} onRetry={() => setError(null)} />;
  
  return <button onClick={handleAction}>Action</button>;
}
```

---

## Performance Patterns

### Memoization
```tsx
// Memoize expensive calculations
const stats = useMemo(() => {
  return data.reduce((acc, item) => ({
    total: acc.total + item.amount,
    count: acc.count + 1,
  }), { total: 0, count: 0 });
}, [data]);

// Memoize callbacks
const handleEdit = useCallback((id: string) => {
  router.push(`/edit/${id}`);
}, [router]);

// Memoize components
const MemoizedRow = memo(function Row({ item }: { item: Item }) {
  return <tr>{/* ... */}</tr>;
});
```

### Code Splitting
```tsx
import dynamic from "next/dynamic";

const HeavyChart = dynamic(
  () => import("./HeavyChart"),
  { loading: () => <Skeleton /> }
);
```

---

## Styling Patterns

### Conditional Classes
```tsx
import { cn } from "@/lib/utils";

function Button({ 
  variant, 
  size, 
  isLoading 
}: ButtonProps) {
  return (
    <button
      className={cn(
        "base-button-styles",
        {
          primary: "bg-blue-600 text-white",
          secondary: "bg-gray-200 text-gray-800",
        }[variant],
        {
          sm: "px-2 py-1 text-sm",
          md: "px-4 py-2",
          lg: "px-6 py-3 text-lg",
        }[size],
        isLoading && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );
}
```

### CSS Variables for Theming
```tsx
// globals.css
:root {
  --color-primary: #15803D;
  --color-secondary: #2563EB;
}

// Component
<div style={{ backgroundColor: "var(--color-primary)" }} />
```

---

## Testing Patterns

### Component Testing
```tsx
import { render, screen, fireEvent } from "@testing-library/react";

describe("BudgetCard", () => {
  it("renders budget information", () => {
    render(<BudgetCard item={mockItem} />);
    
    expect(screen.getByText(mockItem.name)).toBeInTheDocument();
    expect(screen.getByText(/₱1,000,000/)).toBeInTheDocument();
  });
  
  it("calls onEdit when edit button clicked", () => {
    const onEdit = jest.fn();
    render(<BudgetCard item={mockItem} onEdit={onEdit} />);
    
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    expect(onEdit).toHaveBeenCalledWith(mockItem);
  });
});
```

---

## File Organization Patterns

### Barrel Exports
```typescript
// components/ppdo/breakdown/index.ts
export { BreakdownForm } from "./form/BreakdownForm";
export { BreakdownTable } from "./table/BreakdownTable";
export { useBreakdownData } from "./hooks/useBreakdownData";
export type { Breakdown } from "./types";
```

### Co-location
```
ComponentName/
├── ComponentName.tsx      # Main component
├── ComponentName.test.tsx # Tests
├── ComponentName.stories.tsx # Storybook (if used)
├── hooks.ts               # Component-specific hooks
├── utils.ts               # Component-specific utils
└── types.ts               # Component-specific types
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `BudgetTable.tsx` |
| Hooks | camelCase, `use` prefix | `useBudgetData.ts` |
| Utils | camelCase | `formatCurrency.ts` |
| Types | PascalCase | `BudgetItem.ts` |
| Constants | UPPER_SNAKE_CASE | `TABLE_CONFIG.ts` |
| Folders | kebab-case | `budget-table/` |

---

## Related Documentation

- [Architecture Overview](./01-architecture-overview.md)
- [Development Guide](../../app/dashboard/_docs/10-development-guide.md)
