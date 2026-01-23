# Quick Start Guide: Using the Reusable PrintPreviewModal

---

## 📍 File Locations

### Core Files
```
lib/
  └── print/
      └── adapters/
          └── types.ts                          # Generic adapter interfaces

app/dashboard/
  ├── components/
  │   └── print/
  │       └── GenericPrintPreviewModal.tsx     # Reusable modal component
  │
  └── project/[year]/
      ├── components/
      │   └── PrintPreviewModal.tsx             # Original (still works!)
      │
      ├── lib/print-adapters/
      │   └── BudgetPrintAdapter.ts             # Budget domain adapter
      │
      └── [particularId]/[projectbreakdownId]/
          ├── components/
          │   └── BreakdownHistoryTable.tsx    # Now uses GenericPrintPreviewModal
          │
          └── lib/print-adapters/
              └── BreakdownPrintAdapter.ts      # Breakdown domain adapter
```

---

## 🚀 How to Use (For New Components)

### Step 1: Create an Adapter for Your Data Type

```typescript
// my-domain/lib/print-adapters/MyAdapter.ts

import { PrintDataAdapter, PrintableData, PrintColumnDefinition } from '@/lib/print/adapters/types';
import { MyItem } from '../types';

export class MyAdapter implements PrintDataAdapter<MyItem[]> {
  constructor(
    private items: MyItem[],
    private context?: string
  ) {}

  toPrintableData(): PrintableData {
    return {
      items: this.items,
      totals: this.calculateTotals(),
      metadata: {
        title: 'My Report',
        subtitle: this.context,
        timestamp: Date.now(),
      },
    };
  }

  getColumnDefinitions(): PrintColumnDefinition[] {
    return [
      { key: 'name', label: 'Name', align: 'left' },
      { key: 'value', label: 'Value', align: 'right' },
    ];
  }

  private calculateTotals(): Record<string, number> {
    return {
      total: this.items.length,
    };
  }
}
```

### Step 2: Use in Your Component

```typescript
// my-component/MyComponent.tsx

import { GenericPrintPreviewModal } from '@/app/dashboard/components/print/GenericPrintPreviewModal';
import { MyAdapter } from './lib/print-adapters/MyAdapter';

export function MyComponent() {
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [adapter, setAdapter] = useState<MyAdapter | null>(null);

  const handlePrint = () => {
    const adapter = new MyAdapter(items, 'Report Context');
    setAdapter(adapter);
    setIsPrintOpen(true);
  };

  return (
    <>
      <button onClick={handlePrint}>Print</button>
      
      {adapter && (
        <GenericPrintPreviewModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          adapter={adapter}
        />
      )}
    </>
  );
}
```

---

## 📋 PrintDataAdapter Interface

```typescript
interface PrintDataAdapter<T = any> {
  // Required: Convert data to printable format
  toPrintableData(): PrintableData;

  // Required: Define table columns
  getColumnDefinitions(): PrintColumnDefinition[];

  // Optional: Define category/group markers
  getRowMarkers?(): PrintRowMarker[] | undefined;

  // Optional: Unique identifier for drafts
  getDataIdentifier?(): string;
}
```

---

## 🎨 PrintableData Structure

```typescript
interface PrintableData {
  items: PrintableItem[];           // Data rows
  totals?: Record<string, number>;  // Summary totals
  metadata?: {
    title?: string;                 // Report title
    subtitle?: string;              // Report subtitle
    timestamp?: number;             // Generation time
    [key: string]: any;             // Custom properties
  };
}

interface PrintableItem {
  id: string;
  [key: string]: any;               // Any data fields
}
```

---

## 📦 GenericPrintPreviewModal Props

```typescript
interface GenericPrintPreviewModalProps {
  // Required
  isOpen: boolean;                  // Modal visibility
  onClose: () => void;              // Close handler
  adapter: PrintDataAdapter;        // Data adapter

  // Optional
  existingDraft?: PrintDraft | null;  // Load previous draft
  onDraftSaved?: (draft: PrintDraft) => void;  // Draft save callback
  hiddenColumns?: Set<string>;      // Hidden columns
  filterState?: {                   // Filter context
    searchQuery: string;
    statusFilter: string[];
    yearFilter: number[];
    sortField: string | null;
    sortDirection: string | null;
  };
}
```

---

## 💡 Real-World Examples

### Example 1: Budget Tracking
```typescript
const adapter = new BudgetPrintAdapter(
  budgetItems,
  budgetTotals,
  columns,
  2024,
  'Personnel'  // particular
);

<GenericPrintPreviewModal
  isOpen={isOpen}
  onClose={onClose}
  adapter={adapter}
/>
```

### Example 2: Breakdown History
```typescript
const adapter = new BreakdownPrintAdapter(
  breakdowns,
  projectbreakdownId,
  columns
);

<GenericPrintPreviewModal
  isOpen={isOpen}
  onClose={onClose}
  adapter={adapter}
  hiddenColumns={hiddenColumns}
  filterState={filterState}
/>
```

### Example 3: Custom Report
```typescript
class CustomReportAdapter implements PrintDataAdapter {
  constructor(private reportData: any[]) {}

  toPrintableData(): PrintableData {
    return {
      items: this.reportData.map(r => ({ ...r, id: r._id })),
      totals: { count: this.reportData.length },
      metadata: { title: 'Custom Report' }
    };
  }

  getColumnDefinitions(): PrintColumnDefinition[] {
    return [/* your columns */];
  }
}

const adapter = new CustomReportAdapter(data);
<GenericPrintPreviewModal isOpen={isOpen} onClose={onClose} adapter={adapter} />
```

---

## ✨ Features

### For Users
- ✅ Print table data with full formatting
- ✅ Edit canvas before printing (add text, change layout)
- ✅ Save print layouts as drafts
- ✅ Multiple page support
- ✅ Header/footer customization
- ✅ Page size/orientation options

### For Developers
- ✅ Type-safe implementation
- ✅ Adapter pattern for code reuse
- ✅ No styles to override
- ✅ Easy to extend
- ✅ Works with any data type
- ✅ Full backward compatibility

---

## 🔒 Type Safety

All adapters are fully type-checked:

```typescript
// ✅ Correct
const adapter: PrintDataAdapter = new MyAdapter(items);
const modal = <GenericPrintPreviewModal adapter={adapter} />;

// ✅ Correct with specifics
const adapter: PrintDataAdapter<MyItem[]> = new MyAdapter(items);

// ✅ Runtime safe
if (adapter.getRowMarkers) {
  const markers = adapter.getRowMarkers();  // Type-safe optional
}

// ❌ Compile error
const adapter = {} as PrintDataAdapter;  // Must implement interface
```

---

## 🐛 Troubleshooting

### Problem: "Cannot find module 'GenericPrintPreviewModal'"
**Solution:** Use absolute import path:
```typescript
import { GenericPrintPreviewModal } from '@/app/dashboard/components/print/GenericPrintPreviewModal';
```

### Problem: TypeScript error on adapter
**Solution:** Ensure your adapter implements the interface:
```typescript
export class MyAdapter implements PrintDataAdapter {
  // Must implement all required methods
  toPrintableData() { /*...*/ }
  getColumnDefinitions() { /*...*/ }
}
```

### Problem: Data not showing in print preview
**Solution:** Verify adapter's `toPrintableData()` returns items with `id` field:
```typescript
items: this.items.map(item => ({
  ...item,
  id: item._id || item.id,  // Must have 'id' field
}))
```

### Problem: Print preview closes unexpectedly
**Solution:** Check adapter for errors in console, wrap in try-catch:
```typescript
const handlePrint = () => {
  try {
    const adapter = new MyAdapter(items);
    setAdapter(adapter);
    setIsPrintOpen(true);
  } catch (error) {
    console.error('Failed to create adapter:', error);
  }
};
```

---

## 📚 Related Files

- **Original PrintPreviewModal:** `app/dashboard/project/[year]/components/PrintPreviewModal.tsx`
- **Canvas Components:** `app/dashboard/canvas/_components/editor/`
- **Print Utilities:** `lib/print/`
- **Type Definitions:** `lib/print-canvas/types.ts`

---

## 🎯 Migration Path

If you want to migrate existing code to use the new system:

1. Create an adapter for your data type
2. Replace `<PrintPreviewModal>` with `<GenericPrintPreviewModal>`
3. Pass adapter instead of raw data props
4. Test print functionality
5. Remove old modal from component

---

## ✅ Checklist for New Adapters

- [ ] Adapter implements `PrintDataAdapter` interface
- [ ] `toPrintableData()` returns items with `id` field
- [ ] `getColumnDefinitions()` defines all columns
- [ ] Items can be serialized to JSON (for drafts)
- [ ] Totals are calculated correctly
- [ ] Column keys match item field names
- [ ] Adapter is imported with correct path
- [ ] No TypeScript errors in adapter
- [ ] Modal receives adapter as prop
- [ ] Print preview opens without errors

---

## 🚀 Performance Tips

1. **Memoize adapters** if passing same data repeatedly:
   ```typescript
   const adapter = useMemo(() => new MyAdapter(items), [items]);
   ```

2. **Lazy load adapters** for large datasets:
   ```typescript
   const adapter = useCallback(() => new MyAdapter(items), [items]);
   ```

3. **Filter data before passing** to adapter:
   ```typescript
   const filteredItems = items.filter(/* criteria */);
   const adapter = new MyAdapter(filteredItems);
   ```

---

**Ready to create your first adapter? Start with the examples above!**
