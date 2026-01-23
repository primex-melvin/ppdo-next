# Proposal: Reusable PrintPreviewModal Architecture (DRY Refactoring)

## Executive Summary
This proposal outlines how to refactor `PrintPreviewModal` into a reusable, generic component to eliminate code duplication when integrating print preview capabilities into `BreakdownHistoryTable` and other data-driven components.

---

## 1. Current State Analysis

### 1.1 PrintPreviewModal (Budget-Specific)
**Location:** `app/dashboard/project/[year]/components/PrintPreviewModal.tsx`
- **Responsibility:** Print preview for budget items with full canvas editing
- **Dependencies:**
  - `BudgetItem` type (budget-specific)
  - `BudgetTotals` interface (budget-specific)
  - Canvas editing components (generic UI layer)
- **Reusability:** ❌ Currently coupled to budget domain
- **Size:** ~389 lines with heavy business logic

### 1.2 BreakdownHistoryTable (Data Table)
**Location:** `app/dashboard/project/[year]/[particularId]/[projectbreakdownId]/components/BreakdownHistoryTable.tsx`
- **Responsibility:** Display and manage breakdown history data
- **Features:**
  - Column visibility management
  - Row resizing
  - Drag-drop reordering
  - Filtering/search
  - Print capability (currently missing implementation)
- **Current Print Implementation:** Basic `onPrint` callback (unfulfilled)

### 1.3 Code Duplication Risk Areas
1. **Data transformation logic** - Converting table data to canvas elements
2. **Draft management** - Saving/loading print state
3. **Canvas state management** - Pages, header, footer management
4. **UI orchestration** - Toolbar, canvas, panels integration

---

## 2. Proposed Architecture: Generic PrintPreviewModal

### 2.1 Core Principle
Extract domain-specific logic from PrintPreviewModal into **adapters** and **converters**, leaving the modal generic and reusable.

### 2.2 Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│        GenericPrintPreviewModal (UI Container Layer)        │
│        - Manages modal state (open/close, dirty, etc)       │
│        - Orchestrates canvas, toolbar, panels               │
│        - Handles user interactions                          │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┬──────────────────┐
        │                         │                  │
        ▼                         ▼                  ▼
┌───────────────┐    ┌──────────────────┐   ┌──────────────┐
│ DataAdapter   │    │ CanvasRenderer   │   │ DraftManager │
│ (Domain)      │    │ (Generic)        │   │ (Generic)    │
│               │    │                  │   │              │
│ - Converts    │    │ - Converts data  │   │ - Save draft │
│   table data  │    │   to canvas      │   │ - Load draft │
│   to items[]  │    │   elements       │   │              │
│ - Builds      │    │ - Manages pages  │   │              │
│   totals      │    │   headers/footer │   │              │
└───────────────┘    └──────────────────┘   └──────────────┘
```

---

## 3. Implementation Proposal

### 3.1 Create Generic Type System

```typescript
// lib/print/types.ts
/**
 * Generic printable item interface
 * Any data type can implement this to be printable
 */
export interface PrintableItem {
  id: string;
  [key: string]: any; // Flexible for different data structures
}

export interface PrintableData {
  items: PrintableItem[];
  totals?: Record<string, number>;
  metadata?: {
    title?: string;
    subtitle?: string;
    timestamp?: number;
  };
}

export interface PrintDataAdapter<T = any> {
  /**
   * Convert domain data to printable format
   */
  toPrintableData(data: T): PrintableData;
  
  /**
   * Get column definitions for the data
   */
  getColumnDefinitions(): ColumnDefinition[];
  
  /**
   * Optional: Custom row markers (for grouping)
   */
  getRowMarkers?(): RowMarker[];
}
```

### 3.2 Create Domain-Specific Adapters

#### Budget Adapter (Existing)
```typescript
// app/dashboard/project/[year]/lib/print-adapters/BudgetPrintAdapter.ts
import { PrintDataAdapter, PrintableData } from '@/lib/print/types';
import { BudgetItem, BudgetTotals } from '../types';

export class BudgetPrintAdapter implements PrintDataAdapter<BudgetItem[]> {
  constructor(
    private budgetItems: BudgetItem[],
    private totals: BudgetTotals,
    private year: number,
    private particular?: string
  ) {}

  toPrintableData(): PrintableData {
    return {
      items: this.budgetItems,
      totals: this.totals,
      metadata: {
        title: `Budget Tracking ${this.year}`,
        subtitle: this.particular ? `Particular: ${this.particular}` : undefined,
        timestamp: Date.now(),
      },
    };
  }

  getColumnDefinitions() {
    // Return budget-specific columns
    return BUDGET_COLUMNS;
  }
}
```

#### Breakdown Adapter (New)
```typescript
// app/dashboard/project/[year]/[particularId]/[projectbreakdownId]/lib/print-adapters/BreakdownPrintAdapter.ts
import { PrintDataAdapter, PrintableData } from '@/lib/print/types';
import { Breakdown } from '../types/breakdown.types';

export class BreakdownPrintAdapter implements PrintDataAdapter<Breakdown[]> {
  constructor(
    private breakdowns: Breakdown[],
    private breakdownId: string
  ) {}

  toPrintableData(): PrintableData {
    // Transform breakdowns to printable format
    return {
      items: this.breakdowns.map(breakdown => ({
        ...breakdown,
        // Normalize fields as needed
      })),
      totals: this.calculateBreakdownTotals(),
      metadata: {
        title: `Breakdown History`,
        subtitle: `ID: ${this.breakdownId}`,
        timestamp: Date.now(),
      },
    };
  }

  getColumnDefinitions() {
    // Return breakdown-specific columns
    return BREAKDOWN_COLUMNS;
  }

  private calculateBreakdownTotals() {
    // Domain-specific calculation
    return {
      totalAmount: this.breakdowns.reduce((sum, bd) => sum + bd.amount, 0),
      totalItems: this.breakdowns.length,
    };
  }
}
```

### 3.3 Refactor PrintPreviewModal to GenericPrintPreviewModal

```typescript
// app/dashboard/components/print/GenericPrintPreviewModal.tsx
import { useState, useEffect, useCallback } from 'react';
import { PrintDataAdapter, PrintableData } from '@/lib/print/types';

interface GenericPrintPreviewModalProps<T extends PrintDataAdapter = PrintDataAdapter> {
  isOpen: boolean;
  onClose: () => void;
  
  // The adapter handles all domain-specific logic
  adapter: T;
  
  // Optional draft management
  existingDraft?: PrintDraft | null;
  onDraftSaved?: (draft: PrintDraft) => void;
  
  // Optional custom context
  context?: {
    draftStorageKey?: string; // For localStorage persistence
    onPrintComplete?: () => void;
  };
}

export function GenericPrintPreviewModal<T extends PrintDataAdapter>({
  isOpen,
  onClose,
  adapter,
  existingDraft,
  onDraftSaved,
  context,
}: GenericPrintPreviewModalProps<T>) {
  // Canvas state
  const [pages, setPages] = useState<Page[]>([]);
  const [header, setHeader] = useState<HeaderFooter>({ elements: [] });
  const [footer, setFooter] = useState<HeaderFooter>({ elements: [] });
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isEditingElementId, setIsEditingElementId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('page');

  // Draft state
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Initialize from adapter data or existing draft
  useEffect(() => {
    if (!isOpen) return;

    if (existingDraft) {
      setPages(existingDraft.canvasState.pages);
      setHeader(existingDraft.canvasState.header);
      setFooter(existingDraft.canvasState.footer);
      setCurrentPageIndex(existingDraft.canvasState.currentPageIndex);
      setLastSavedTime(existingDraft.timestamp);
      setIsDirty(false);
    } else {
      try {
        // Use adapter to get printable data
        const printableData = adapter.toPrintableData();
        const columns = adapter.getColumnDefinitions();
        const rowMarkers = adapter.getRowMarkers?.();

        const result = convertTableToCanvas({
          items: printableData.items,
          totals: printableData.totals,
          columns,
          pageSize: 'A4',
          orientation: 'portrait',
          includeHeaders: true,
          includeTotals: true,
          title: printableData.metadata?.title || 'Print Preview',
          subtitle: printableData.metadata?.subtitle,
          rowMarkers,
        });

        setPages(result.pages);
        setHeader(result.header);
        setFooter(result.footer);
        setCurrentPageIndex(0);
        setIsDirty(false);

        toast.success(`Generated ${result.metadata.totalPages} page(s)`);
      } catch (error) {
        toast.error('Failed to convert data to canvas');
      }
    }
  }, [isOpen, adapter, existingDraft]);

  // ... Rest of handlers remain the same ...

  if (!isOpen) return null;

  // Render canvas UI (identical to current PrintPreviewModal)
  return (
    <>
      <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-900 flex flex-col">
        {/* Toolbar, Canvas, Panels, Controls - SAME AS BEFORE */}
      </div>

      {/* Close Confirmation - SAME AS BEFORE */}
    </>
  );
}
```

### 3.4 Update BreakdownHistoryTable to Use Generic Modal

```typescript
// app/dashboard/project/[year]/[particularId]/[projectbreakdownId]/components/BreakdownHistoryTable.tsx

import { GenericPrintPreviewModal } from '@/app/dashboard/components/print/GenericPrintPreviewModal';
import { BreakdownPrintAdapter } from '../lib/print-adapters/BreakdownPrintAdapter';

export function BreakdownHistoryTable({
  breakdowns,
  onPrint,
  onAdd,
  onEdit,
  onDelete,
  onOpenTrash,
}: BreakdownHistoryTableProps) {
  // ... existing state ...
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printAdapter, setPrintAdapter] = useState<BreakdownPrintAdapter | null>(null);

  // Create adapter when needed
  const handlePrint = useCallback(() => {
    const adapter = new BreakdownPrintAdapter(
      breakdowns,
      params.projectbreakdownId as string
    );
    setPrintAdapter(adapter);
    setIsPrintPreviewOpen(true);
  }, [breakdowns, params.projectbreakdownId]);

  return (
    <div>
      {/* Existing table UI */}
      
      {/* Print Preview Modal */}
      {printAdapter && (
        <GenericPrintPreviewModal
          isOpen={isPrintPreviewOpen}
          onClose={() => setIsPrintPreviewOpen(false)}
          adapter={printAdapter}
          onDraftSaved={(draft) => {
            // Handle draft save if needed
            console.log('Draft saved:', draft);
          }}
        />
      )}
    </div>
  );
}
```

---

## 4. Migration Path

### Phase 1: Foundation (Week 1)
- Create `lib/print/types.ts` with generic interfaces
- Create `lib/print/adapters/` directory structure
- Update TypeScript config if needed

### Phase 2: Adapter Creation (Week 1-2)
- Create `BudgetPrintAdapter`
- Create `BreakdownPrintAdapter`
- Create additional adapters as needed

### Phase 3: Refactoring (Week 2)
- Create `GenericPrintPreviewModal` (copy from existing, make generic)
- Keep old `PrintPreviewModal` temporarily
- Update `BudgetPrintPreview` to use generic modal

### Phase 4: Integration (Week 2-3)
- Update `BreakdownHistoryTable` to use modal
- Update other tables/data components
- Remove old `PrintPreviewModal`

### Phase 5: Testing & Optimization (Week 3)
- Integration testing
- Performance testing
- Documentation update

---

## 5. Benefits

| Benefit | Impact |
|---------|--------|
| **Code Reuse** | Eliminate ~300+ lines of duplication | 
| **Consistency** | Same print UX across all tables | 
| **Maintainability** | Single modal = single source of truth |
| **Scalability** | Add new printable components with just an adapter |
| **Type Safety** | Generic types ensure correctness |
| **Testability** | Easier to unit test adapters separately |

---

## 6. Alternative Approaches

### Alternative A: Shared Hook
**Concept:** Extract canvas state logic into `usePrintCanvas()` hook

**Pros:** Lightweight, less refactoring
**Cons:** Doesn't solve all duplication, still domain-specific
**Recommendation:** ⚠️ Partial solution, not comprehensive

### Alternative B: Higher-Order Component
**Concept:** Wrap GenericPrintPreviewModal with adapter factory

**Pros:** No wrapper components needed
**Cons:** More complex React patterns, harder to debug
**Recommendation:** ❌ Overcomplicated for this use case

### Alternative C: Event-Driven System
**Concept:** Print adapter registers via event system

**Pros:** Decoupled, extensible
**Cons:** Runtime discovery, harder to trace
**Recommendation:** ❌ Overkill, increases complexity

---

## 7. Implementation Checklist

- [ ] Create `lib/print/types.ts`
- [ ] Create `PrintDataAdapter` interface
- [ ] Create adapter directory structure
- [ ] Implement `BudgetPrintAdapter`
- [ ] Implement `BreakdownPrintAdapter`
- [ ] Create `GenericPrintPreviewModal`
- [ ] Update `BudgetPrintPreview` (if exists)
- [ ] Update `BreakdownHistoryTable`
- [ ] Add unit tests for adapters
- [ ] Add integration tests for modal
- [ ] Update component documentation
- [ ] Remove old duplicated code
- [ ] Performance testing
- [ ] User acceptance testing

---

## 8. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Breaking existing print workflow | Keep old modal during transition, A/B test |
| Adapter complexity | Create template adapter, document examples |
| Performance regression | Profile canvas rendering, optimize DOM updates |
| Type safety issues | Use strict TypeScript, comprehensive unit tests |

---

## 9. Recommended Next Steps

1. **Get approval** on this architecture
2. **Create type definitions** (low risk, high value)
3. **Build first adapter** (`BudgetPrintAdapter`) as proof of concept
4. **Create generic modal** with that adapter
5. **Integrate with BreakdownHistoryTable**
6. **Iterate based on real-world usage**

---

## 10. Questions & Decisions Needed

1. Should adapters be singleton or recreated per render?
   - **Recommendation:** Recreate (fresh data, simpler lifecycle)

2. Where should adapters live in the codebase?
   - **Recommendation:** Near the domain (e.g., `[particularId]/lib/print-adapters/`)

3. Should we support localStorage draft persistence?
   - **Recommendation:** Yes, via optional `context.draftStorageKey`

4. Who owns draft management?
   - **Recommendation:** GenericModal handles it, with optional callbacks

5. Should we support custom canvas components per domain?
   - **Recommendation:** Not initially, extend later if needed

