# Implementation Plan: Persisted Column Widths

> **Goal**: Store default and user-customized column widths in Convex database, replacing runtime flex calculation with persisted pixel values.

---

## 📊 Phase 1: Analysis & Default Width Standards

### 1.1 Recommended Default Widths by Column Type

Based on content analysis and UX best practices:

| Column Type | Default Width | Min Width | Typical Content |
|-------------|---------------|-----------|-----------------|
| **text (long)** | 280px | 180px | Project names, descriptions, particulars |
| **text (medium)** | 180px | 120px | Office names, fund sources, categories |
| **text (short)** | 120px | 80px | Status labels, short IDs |
| **currency** | 140px | 100px | ₱1,234,567.89 |
| **number** | 100px | 70px | 99.5%, 1,234 |
| **date** | 120px | 100px | Jan 15, 2024 |
| **percentage** | 110px | 80px | 85.5% |
| **status** | 130px | 90px | Completed, Ongoing, Delayed |
| **actions** | 64px | 64px | Edit/Delete buttons |
| **row number** | 48px | 48px | #1, #2, #3 |

### 1.2 Table-Specific Width Configurations

#### Projects Table
```typescript
const PROJECTS_DEFAULT_WIDTHS: Record<string, number> = {
  "particular": 320,        // Long project names
  "particularCategoryId": 160,  // Category names
  "implementingOffice": 200,    // Office names
  "allocatedBudget": 140,       // Currency
  "obligatedBudget": 140,       // Currency  
  "budgetUtilized": 140,        // Currency
  "utilizationRate": 100,       // Percentage
  "balance": 140,               // Currency
  "year": 80,                   // Year number
  "remarks": 250,               // Long text
  "status": 120,                // Status badge
  "actions": 64                 // Action buttons
};
```

#### 20% DF Table
```typescript
const TWENTY_PERCENT_DF_DEFAULT_WIDTHS: Record<string, number> = {
  "fundTitle": 300,             // Fund titles
  "fundCategoryId": 160,        // Category
  "sourceOfFund": 180,          // Source text
  "allocatedFund": 140,         // Currency
  "obligatedFund": 140,         // Currency
  "utilizedFund": 140,          // Currency
  "utilizationRate": 100,       // Percentage
  "balance": 140,               // Currency
  "completed": 110,             // Number
  "ongoing": 110,               // Number
  "delayed": 110,               // Number
  "year": 80,
  "remarks": 250,
  "actions": 64
};
```

#### Budget Table
```typescript
const BUDGET_DEFAULT_WIDTHS: Record<string, number> = {
  "particular": 280,
  "particularType": 140,
  "year": 80,
  "annualBudget": 140,
  "cumulativeAllotment": 150,
  "totalObligation": 150,
  "totalExpenditure": 150,
  "unobligatedBalance": 160,
  "fundStatus": 130,
  "remarks": 250,
  "actions": 64
};
```

#### Funds Table (Trust/SEF/SHF)
```typescript
const FUNDS_DEFAULT_WIDTHS: Record<string, number> = {
  "fundTitle": 300,
  "sourceOfFund": 180,
  "implementingOffice": 180,
  "allocatedFund": 140,
  "obligatedFund": 140,
  "utilizedFund": 140,
  "balance": 140,
  "utilizationRate": 100,
  "dateStarted": 120,
  "targetDate": 120,
  "completionDate": 120,
  "projectAccomplishment": 130,
  "status": 120,
  "remarks": 250,
  "actions": 64
};
```

#### Breakdown Table
```typescript
const BREAKDOWN_DEFAULT_WIDTHS: Record<string, number> = {
  "projectTitle": 280,
  "implementingOffice": 180,
  "allocatedBudget": 140,
  "obligatedBudget": 140,
  "budgetUtilized": 140,
  "utilizationRate": 100,
  "balance": 140,
  "dateStarted": 120,
  "targetDate": 120,
  "completionDate": 120,
  "projectAccomplishment": 130,
  "status": 120,
  "remarks": 250,
  "actions": 64
};
```

---

## 🗄️ Phase 2: Database Schema Updates

### 2.1 Schema Changes (convex/schema.ts)

```typescript
// BEFORE (current)
userTableSettings: defineTable({
  userId: v.id("users"),
  tableIdentifier: v.string(),
  columns: v.array(v.object({
    fieldKey: v.string(),
    width: v.number(),        // Currently always 0, not used
    isVisible: v.boolean(),
    pinned: v.optional(v.union(v.literal("left"), v.literal("right"), v.null())),
  })),
  customRowHeights: v.optional(v.string()),
  defaultRowHeight: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user_and_table", ["userId", "tableIdentifier"]),

// AFTER (new)
userTableSettings: defineTable({
  userId: v.id("users"),
  tableIdentifier: v.string(),
  columns: v.array(v.object({
    fieldKey: v.string(),
    width: v.number(),        // NOW USED: actual pixel width
    isVisible: v.boolean(),
    pinned: v.optional(v.union(v.literal("left"), v.literal("right"), v.null())),
    flex: v.optional(v.number()),  // NEW: for proportional resize
  })),
  customRowHeights: v.optional(v.string()),
  defaultRowHeight: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user_and_table", ["userId", "tableIdentifier"]),

// NEW: Default widths table (seed data)
tableColumnDefaults: defineTable({
  tableIdentifier: v.string(),
  columnKey: v.string(),
  defaultWidth: v.number(),
  minWidth: v.number(),
  maxWidth: v.optional(v.number()),
  flex: v.number(),  // For proportional calculations
  updatedAt: v.number(),
})
  .index("by_table", ["tableIdentifier"])
  .index("by_table_column", ["tableIdentifier", "columnKey"]),
```

### 2.2 Convex Mutations (convex/tableSettings.ts)

```typescript
// NEW: Seed default widths (run once per deployment)
export const seedDefaultWidths = internalMutation({
  args: {},
  handler: async (ctx) => {
    const defaults = [
      // Projects
      { tableId: "projects", col: "particular", width: 320, flex: 3 },
      { tableId: "projects", col: "allocatedBudget", width: 140, flex: 1.5 },
      // ... all columns for all tables
    ];
    
    for (const def of defaults) {
      await ctx.db.insert("tableColumnDefaults", {
        tableIdentifier: def.tableId,
        columnKey: def.col,
        defaultWidth: def.width,
        minWidth: Math.floor(def.width * 0.5),
        maxWidth: Math.floor(def.width * 2),
        flex: def.flex,
        updatedAt: Date.now(),
      });
    }
  },
});

// NEW: Get default widths for a table
export const getDefaultWidths = query({
  args: { tableIdentifier: v.string() },
  handler: async (ctx, args) => {
    const defaults = await ctx.db
      .query("tableColumnDefaults")
      .withIndex("by_table", (q) => q.eq("tableIdentifier", args.tableIdentifier))
      .collect();
    
    return defaults.reduce((acc, def) => {
      acc[def.columnKey] = {
        width: def.defaultWidth,
        minWidth: def.minWidth,
        maxWidth: def.maxWidth,
        flex: def.flex,
      };
      return acc;
    }, {} as Record<string, { width: number; minWidth: number; maxWidth?: number; flex: number }>);
  },
});

// MODIFIED: Save settings now includes actual widths
export const saveSettings = mutation({
  args: {
    tableIdentifier: v.string(),
    columns: v.array(
      v.object({
        fieldKey: v.string(),
        width: v.number(),        // NOW REQUIRED and USED
        isVisible: v.boolean(),
        pinned: v.optional(v.union(v.literal("left"), v.literal("right"), v.null())),
        flex: v.optional(v.number()),
      })
    ),
    defaultRowHeight: v.optional(v.number()),
    customRowHeights: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("userTableSettings")
      .withIndex("by_user_and_table", (q) =>
        q.eq("userId", userId).eq("tableIdentifier", args.tableIdentifier)
      )
      .first();

    const now = Date.now();
    const patchData = {
      columns: args.columns.map(c => ({
        fieldKey: c.fieldKey,
        width: c.width,           // ACTUAL WIDTH NOW SAVED
        isVisible: c.isVisible,
        pinned: c.pinned,
        flex: c.flex,
      })),
      defaultRowHeight: args.defaultRowHeight,
      customRowHeights: args.customRowHeights,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, patchData);
    } else {
      await ctx.db.insert("userTableSettings", {
        ...patchData,
        userId,
        tableIdentifier: args.tableIdentifier,
        createdAt: now,
      });
    }
  },
});

// NEW: Update single column width (for resize)
export const updateColumnWidth = mutation({
  args: {
    tableIdentifier: v.string(),
    columnKey: v.string(),
    width: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("userTableSettings")
      .withIndex("by_user_and_table", (q) =>
        q.eq("userId", userId).eq("tableIdentifier", args.tableIdentifier)
      )
      .first();

    if (!existing) {
      // Create new settings with just this column
      const defaults = await ctx.db
        .query("tableColumnDefaults")
        .withIndex("by_table", (q) => 
          q.eq("tableIdentifier", args.tableIdentifier)
        )
        .collect();
      
      const columns = defaults.map(def => ({
        fieldKey: def.columnKey,
        width: def.columnKey === args.columnKey ? args.width : def.defaultWidth,
        isVisible: true,
        flex: def.flex,
      }));

      await ctx.db.insert("userTableSettings", {
        userId,
        tableIdentifier: args.tableIdentifier,
        columns,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      // Update existing
      const columns = existing.columns.map(c => 
        c.fieldKey === args.columnKey 
          ? { ...c, width: args.width }
          : c
      );
      
      await ctx.db.patch(existing._id, {
        columns,
        updatedAt: Date.now(),
      });
    }
  },
});
```

---

## 🎨 Phase 3: Frontend Updates

### 3.1 Updated Types (core/types/table.types.ts)

```typescript
export interface ColumnConfig<T = any> {
  key: keyof T | string;
  label: string;
  width: number;        // RESTORED: actual pixel width
  minWidth?: number;    // Minimum allowed
  maxWidth?: number;    // Maximum allowed
  flex: number;         // For proportional resize
  type: ColumnType;
  align: ColumnAlign;
}

export interface TableSettings {
  tableIdentifier: string;
  columns: Array<{
    fieldKey: string;
    width: number;      // NOW REQUIRED
    isVisible: boolean;
    pinned?: "left" | "right" | null;
    flex?: number;
  }>;
  customRowHeights?: string;
}
```

### 3.2 Updated Hook: useTableSettings

```typescript
// core/hooks/useTableSettings.ts
export function useTableSettings(options: UseTableSettingsOptions) {
  const { tableIdentifier, defaultColumns } = options;

  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Map<string, number>>(new Map());
  const [rowHeights, setRowHeights] = useState<RowHeights>({});

  // Query both user settings AND defaults
  const userSettings = useQuery(api.tableSettings.getSettings, { tableIdentifier });
  const defaultWidths = useQuery(api.tableSettings.getDefaultWidths, { tableIdentifier });
  const saveSettings = useMutation(api.tableSettings.saveSettings);
  const updateWidth = useMutation(api.tableSettings.updateColumnWidth);

  // Check permissions
  const currentUser = useQuery(api.users.current, {});
  const canEditLayout = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  // Load settings
  useEffect(() => {
    if (!defaultWidths) return;

    if (!userSettings?.columns) {
      // No saved settings - use defaults
      setHiddenColumns(new Set());
      setColumnOrder(defaultColumns.map(c => String(c.key)));
      
      // Apply default widths
      const widths = new Map<string, number>();
      defaultColumns.forEach(col => {
        const def = defaultWidths[String(col.key)];
        widths.set(String(col.key), def?.width || col.width || 150);
      });
      setColumnWidths(widths);
      return;
    }

    // Restore from saved settings
    const hidden = new Set<string>();
    const widths = new Map<string, number>();
    
    userSettings.columns.forEach(savedCol => {
      if (!savedCol.isVisible) {
        hidden.add(savedCol.fieldKey);
      }
      widths.set(savedCol.fieldKey, savedCol.width);
    });
    
    setHiddenColumns(hidden);
    setColumnWidths(widths);

    // Restore order
    const savedOrder = userSettings.columns.map(c => c.fieldKey);
    const hasAllColumns = defaultColumns.every(col => 
      savedOrder.includes(String(col.key))
    );
    
    if (hasAllColumns) {
      setColumnOrder(savedOrder);
    } else {
      setColumnOrder(defaultColumns.map(c => String(c.key)));
    }

    // Restore row heights
    if (userSettings.customRowHeights) {
      setRowHeights(JSON.parse(userSettings.customRowHeights));
    }
  }, [userSettings, defaultWidths, defaultColumns]);

  // Build final columns with widths
  const columns = useMemo(() => {
    const defaultMap = new Map(defaultColumns.map(c => [String(c.key), c]));
    
    const ordered = columnOrder
      .map(key => {
        const col = defaultMap.get(key);
        if (!col) return null;
        
        // Apply saved width or default
        const savedWidth = columnWidths.get(key);
        const defaultWidth = defaultWidths?.[key]?.width;
        
        return {
          ...col,
          width: savedWidth || defaultWidth || col.width || 150,
          minWidth: col.minWidth || defaultWidths?.[key]?.minWidth || 60,
          maxWidth: col.maxWidth || defaultWidths?.[key]?.maxWidth || 600,
        };
      })
      .filter((col): col is ColumnConfig => col !== undefined);
    
    // Add new columns not in order
    defaultColumns.forEach(col => {
      if (!columnOrder.includes(String(col.key))) {
        const key = String(col.key);
        const defaultWidth = defaultWidths?.[key]?.width;
        ordered.push({
          ...col,
          width: defaultWidth || col.width || 150,
        });
      }
    });
    
    return ordered;
  }, [defaultColumns, columnOrder, columnWidths, defaultWidths]);

  // Update single column width (called during resize)
  const updateColumnWidth = useCallback(async (columnKey: string, width: number) => {
    // Clamp to min/max
    const col = columns.find(c => String(c.key) === columnKey);
    if (!col) return;
    
    const minW = col.minWidth || 60;
    const maxW = col.maxWidth || 600;
    const clamped = Math.max(minW, Math.min(maxW, width));
    
    // Optimistic update
    setColumnWidths(prev => new Map(prev).set(columnKey, clamped));
    
    // Save to database
    if (canEditLayout) {
      await updateWidth({ tableIdentifier, columnKey, width: clamped });
    }
  }, [columns, canEditLayout, tableIdentifier, updateWidth]);

  // Save full layout
  const saveLayout = useCallback((heights: RowHeights) => {
    if (!canEditLayout) return;
    
    saveSettings({
      tableIdentifier,
      columns: columns.map(c => ({
        fieldKey: String(c.key),
        width: columnWidths.get(String(c.key)) || c.width || 150,
        isVisible: !hiddenColumns.has(String(c.key)),
        flex: c.flex,
      })),
      customRowHeights: JSON.stringify(heights),
    });
  }, [saveSettings, canEditLayout, tableIdentifier, columns, columnWidths, hiddenColumns]);

  return {
    columns,
    hiddenColumns,
    columnWidths,
    rowHeights,
    canEditLayout,
    setHiddenColumns,
    setRowHeights,
    setColumnOrder,
    updateColumnWidth,
    saveLayout,
  };
}
```

### 3.3 Updated Hook: useResizableColumns

```typescript
// core/hooks/useResizableColumns.ts
export function useResizableColumns({
  tableIdentifier,
  defaultColumns,
}: UseResizableColumnsOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [resizingColumn, setResizingColumn] = useState<number | null>(null);

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Settings hook now provides widths
  const {
    columns,
    hiddenColumns,
    columnWidths,
    rowHeights,
    setRowHeights,
    setColumnOrder,
    toggleColumnVisibility,
    canEditLayout,
    updateColumnWidth,
    saveLayout,
  } = useTableSettings({
    tableIdentifier,
    defaultColumns,
  });

  // ACTIVE COLUMN RESIZE (now functional!)
  const startResizeColumn = useCallback((e: React.MouseEvent, index: number) => {
    if (!canEditLayout) return;
    
    e.preventDefault();
    setResizingColumn(index);
    
    const startX = e.clientX;
    const col = columns[index];
    const startWidth = columnWidths.get(String(col.key)) || col.width;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = startWidth + delta;
      updateColumnWidth(String(col.key), newWidth);
    };
    
    const handleMouseUp = () => {
      setResizingColumn(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [canEditLayout, columns, columnWidths, updateColumnWidth]);

  // Row resize
  const startResizeRow = useCallback((e: React.MouseEvent, rowId: string) => {
    if (!canEditLayout) return;
    // ... similar implementation
  }, [canEditLayout]);

  // Drag & Drop
  const { onDragStart, onDrop, onDragOver, draggedCol } = useColumnDragDrop({
    columns,
    setColumns: setColumnOrder as any,
    rowHeights,
    canEditLayout,
    saveLayout,
  });

  return {
    columns,
    hiddenColumns,
    columnWidths,
    rowHeights,
    canEditLayout,
    draggedCol,
    resizingColumn,
    containerRef,
    containerWidth,
    setRowHeights,
    toggleColumnVisibility,
    saveLayout,
    startResizeColumn,
    startResizeRow,
    onDragStart,
    onDrop,
    onDragOver,
  };
}
```

### 3.4 Updated Configs (Example: projectsColumns.ts)

```typescript
// configs/projectsColumns.ts
export const PROJECTS_COLUMNS: ColumnConfig<Project>[] = [
  {
    key: "particular",
    label: "Particular",
    width: 320,        // DEFAULT WIDTH (pixels)
    minWidth: 180,     // Can't resize smaller
    maxWidth: 500,     // Can't resize larger
    flex: 3,           // For proportional calculations
    type: "text",
    align: "left"
  },
  {
    key: "particularCategoryId",
    label: "Category",
    width: 160,
    minWidth: 100,
    maxWidth: 250,
    flex: 1.5,
    type: "text",
    align: "left"
  },
  {
    key: "allocatedBudget",
    label: "Allocated Budget",
    width: 140,
    minWidth: 100,
    maxWidth: 200,
    flex: 1.5,
    type: "currency",
    align: "right"
  },
  // ... all columns with width/minWidth/maxWidth
];
```

---

## 🔄 Phase 4: Migration Strategy

### 4.1 Migration Script (convex/migrations/seedColumnDefaults.ts)

```typescript
// One-time migration to seed default widths
export const runMigration = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allDefaults = [
      // === PROJECTS TABLE ===
      { tableId: "projects", col: "particular", width: 320, flex: 3, minW: 180 },
      { tableId: "projects", col: "particularCategoryId", width: 160, flex: 1.5, minW: 100 },
      { tableId: "projects", col: "implementingOffice", width: 200, flex: 2, minW: 120 },
      { tableId: "projects", col: "allocatedBudget", width: 140, flex: 1.5, minW: 100 },
      { tableId: "projects", col: "obligatedBudget", width: 140, flex: 1.5, minW: 100 },
      { tableId: "projects", col: "budgetUtilized", width: 140, flex: 1.5, minW: 100 },
      { tableId: "projects", col: "utilizationRate", width: 100, flex: 1, minW: 80 },
      { tableId: "projects", col: "balance", width: 140, flex: 1.5, minW: 100 },
      { tableId: "projects", col: "year", width: 80, flex: 0.8, minW: 60 },
      { tableId: "projects", col: "remarks", width: 250, flex: 2.5, minW: 150 },
      { tableId: "projects", col: "status", width: 120, flex: 1.2, minW: 90 },
      
      // === 20% DF TABLE ===
      { tableId: "twentyPercentDF", col: "fundTitle", width: 300, flex: 3, minW: 180 },
      { tableId: "twentyPercentDF", col: "fundCategoryId", width: 160, flex: 1.5, minW: 100 },
      { tableId: "twentyPercentDF", col: "sourceOfFund", width: 180, flex: 1.8, minW: 120 },
      { tableId: "twentyPercentDF", col: "allocatedFund", width: 140, flex: 1.5, minW: 100 },
      { tableId: "twentyPercentDF", col: "obligatedFund", width: 140, flex: 1.5, minW: 100 },
      { tableId: "twentyPercentDF", col: "utilizedFund", width: 140, flex: 1.5, minW: 100 },
      { tableId: "twentyPercentDF", col: "utilizationRate", width: 100, flex: 1, minW: 80 },
      { tableId: "twentyPercentDF", col: "balance", width: 140, flex: 1.5, minW: 100 },
      { tableId: "twentyPercentDF", col: "completed", width: 110, flex: 1.1, minW: 80 },
      { tableId: "twentyPercentDF", col: "ongoing", width: 110, flex: 1.1, minW: 80 },
      { tableId: "twentyPercentDF", col: "delayed", width: 110, flex: 1.1, minW: 80 },
      
      // === BUDGET TABLE ===
      { tableId: "budget", col: "particular", width: 280, flex: 2.8, minW: 180 },
      { tableId: "budget", col: "particularType", width: 140, flex: 1.4, minW: 100 },
      { tableId: "budget", col: "year", width: 80, flex: 0.8, minW: 60 },
      { tableId: "budget", col: "annualBudget", width: 140, flex: 1.5, minW: 100 },
      { tableId: "budget", col: "cumulativeAllotment", width: 150, flex: 1.5, minW: 100 },
      { tableId: "budget", col: "totalObligation", width: 150, flex: 1.5, minW: 100 },
      { tableId: "budget", col: "totalExpenditure", width: 150, flex: 1.5, minW: 100 },
      { tableId: "budget", col: "unobligatedBalance", width: 160, flex: 1.6, minW: 110 },
      { tableId: "budget", col: "fundStatus", width: 130, flex: 1.3, minW: 90 },
      { tableId: "budget", col: "remarks", width: 250, flex: 2.5, minW: 150 },
      
      // === FUNDS TABLE ===
      { tableId: "funds", col: "fundTitle", width: 300, flex: 3, minW: 180 },
      { tableId: "funds", col: "sourceOfFund", width: 180, flex: 1.8, minW: 120 },
      { tableId: "funds", col: "implementingOffice", width: 180, flex: 1.8, minW: 120 },
      { tableId: "funds", col: "allocatedFund", width: 140, flex: 1.5, minW: 100 },
      { tableId: "funds", col: "obligatedFund", width: 140, flex: 1.5, minW: 100 },
      { tableId: "funds", col: "utilizedFund", width: 140, flex: 1.5, minW: 100 },
      { tableId: "funds", col: "balance", width: 140, flex: 1.5, minW: 100 },
      { tableId: "funds", col: "utilizationRate", width: 100, flex: 1, minW: 80 },
      { tableId: "funds", col: "dateStarted", width: 120, flex: 1.2, minW: 90 },
      { tableId: "funds", col: "targetDate", width: 120, flex: 1.2, minW: 90 },
      { tableId: "funds", col: "completionDate", width: 120, flex: 1.2, minW: 90 },
      { tableId: "funds", col: "projectAccomplishment", width: 130, flex: 1.3, minW: 90 },
      { tableId: "funds", col: "status", width: 120, flex: 1.2, minW: 90 },
      { tableId: "funds", col: "remarks", width: 250, flex: 2.5, minW: 150 },
      
      // === BREAKDOWN TABLE ===
      { tableId: "breakdown", col: "projectTitle", width: 280, flex: 2.8, minW: 180 },
      { tableId: "breakdown", col: "implementingOffice", width: 180, flex: 1.8, minW: 120 },
      { tableId: "breakdown", col: "allocatedBudget", width: 140, flex: 1.5, minW: 100 },
      { tableId: "breakdown", col: "obligatedBudget", width: 140, flex: 1.5, minW: 100 },
      { tableId: "breakdown", col: "budgetUtilized", width: 140, flex: 1.5, minW: 100 },
      { tableId: "breakdown", col: "utilizationRate", width: 100, flex: 1, minW: 80 },
      { tableId: "breakdown", col: "balance", width: 140, flex: 1.5, minW: 100 },
      { tableId: "breakdown", col: "dateStarted", width: 120, flex: 1.2, minW: 90 },
      { tableId: "breakdown", col: "targetDate", width: 120, flex: 1.2, minW: 90 },
      { tableId: "breakdown", col: "completionDate", width: 120, flex: 1.2, minW: 90 },
      { tableId: "breakdown", col: "projectAccomplishment", width: 130, flex: 1.3, minW: 90 },
      { tableId: "breakdown", col: "status", width: 120, flex: 1.2, minW: 90 },
      { tableId: "breakdown", col: "remarks", width: 250, flex: 2.5, minW: 150 },
    ];

    // Clear existing defaults
    const existing = await ctx.db.query("tableColumnDefaults").collect();
    for (const e of existing) {
      await ctx.db.delete(e._id);
    }

    // Insert new defaults
    for (const def of allDefaults) {
      await ctx.db.insert("tableColumnDefaults", {
        tableIdentifier: def.tableId,
        columnKey: def.col,
        defaultWidth: def.width,
        minWidth: def.minW,
        maxWidth: Math.floor(def.width * 2),
        flex: def.flex,
        updatedAt: Date.now(),
      });
    }

    return { inserted: allDefaults.length };
  },
});
```

### 4.2 Migration Checklist

```markdown
## Pre-Migration
- [ ] Backup database
- [ ] Deploy schema changes
- [ ] Run seed migration
- [ ] Verify defaults in Convex dashboard

## Frontend Deployment
- [ ] Update ColumnConfig types
- [ ] Update all column configs with width/minWidth/maxWidth
- [ ] Deploy useTableSettings hook changes
- [ ] Deploy useResizableColumns hook changes
- [ ] Update ResizableTableHeader to use persisted widths
- [ ] Test on staging environment

## Post-Migration
- [ ] Verify existing users get default widths
- [ ] Test column resize functionality
- [ ] Verify widths persist after refresh
- [ ] Monitor for errors in logs
```

---

## 📋 Phase 5: Testing Plan

### 5.1 Unit Tests

```typescript
// Test width calculations
describe("useTableSettings", () => {
  it("should apply default widths on first load", () => {
    // Mock no user settings
    // Expect columns to have default widths
  });
  
  it("should clamp widths to min/max", () => {
    // Try to set width below minWidth
    // Expect clamped to minWidth
  });
  
  it("should persist width changes to database", async () => {
    // Resize column
    // Verify updateColumnWidth mutation called
  });
});
```

### 5.2 Integration Tests

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| First visit | Clear settings, load table | Columns use default widths |
| Resize column | Drag resize handle | Width updates in real-time, saves to DB |
| Refresh page | After resizing | Column retains custom width |
| Hide column | Toggle visibility | Width preserved when re-shown |
| New column added | Add field to schema | Gets default width automatically |

---

## 📅 Implementation Timeline

| Phase | Task | Duration | Owner |
|-------|------|----------|-------|
| **Day 1** | Schema design & review | 2h | Backend Architect |
| **Day 1** | Convex schema update | 1h | Backend Architect |
| **Day 2** | Backend mutations | 3h | Backend Architect |
| **Day 2** | Migration script | 2h | Backend Architect |
| **Day 3** | Frontend types update | 1h | Frontend Specialist |
| **Day 3** | Column config updates (5 tables) | 4h | Frontend Specialist |
| **Day 4** | useTableSettings refactor | 4h | Frontend Specialist |
| **Day 4** | useResizableColumns refactor | 3h | Frontend Specialist |
| **Day 5** | ResizableTableHeader update | 2h | Frontend Specialist |
| **Day 5** | Integration testing | 3h | QA Testing |
| **Day 6** | Bug fixes & polish | 4h | Frontend + QA |
| **Day 6** | Deploy to production | 2h | Team Lead |

**Total: 6 days, ~31 hours**

---

## 🎯 Success Metrics

| Metric | Before | Target After |
|--------|--------|--------------|
| Column resize | Non-functional | Smooth, saves to DB |
| Default widths | None (flex-based) | Optimized per column type |
| User preference persistence | Order only | Order + width |
| Time to add new table | 2 hours | 30 minutes |
| Migration downtime | N/A | < 5 minutes |

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data migration failure | High | Backup before migration, idempotent script |
| Performance degradation | Medium | Debounce resize saves, optimistic UI |
| User confusion | Low | Maintain visual appearance, gradual rollout |
| Schema compatibility | Medium | Keep flex field, add width as primary |

---

## 📝 Summary

This implementation plan provides:

1. **Best-practice default widths** based on content analysis
2. **Complete schema design** with migration path
3. **Full frontend updates** for all 5 table types
4. **Testing strategy** and timeline
5. **Risk mitigation** strategies

The result: Users can resize columns, widths persist across sessions, and the system remains maintainable with DRY principles.
