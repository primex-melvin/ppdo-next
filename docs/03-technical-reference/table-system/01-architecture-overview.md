# Architecture Overview

## System Design

The PPDO table toolbar system follows a layered architecture that promotes code reuse while allowing domain-specific customization.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Application Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Budget    │  │  Projects   │  │    Funds    │  │ Trust Fund  │ │
│  │   Table     │  │   Table     │  │   Table     │  │   Table     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
└─────────┼────────────────┼────────────────┼────────────────┼────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Adapter Layer                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   Budget    │  │  Projects   │  │    Funds    │  (Backward-     │
│  │  Toolbar    │  │  Toolbar    │  │  Toolbar    │   Compatible)   │
│  │  Adapter    │  │  Adapter    │  │  Adapter    │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │
└─────────┼────────────────┼────────────────┼─────────────────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Unified Core Layer                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      TableToolbar                             │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  │   │
│  │  │  Search   │  │  Column   │  │   Bulk    │  │  Export   │  │   │
│  │  │  Input    │  │ Visibility│  │  Actions  │  │   Menu    │  │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Foundation Layer                                │
│  ┌───────────┐  ┌───────────────┐  ┌─────────────────────────────┐  │
│  │   Hooks   │  │   UI Kit      │  │    Shared Components        │  │
│  │           │  │   (shadcn)    │  │                             │  │
│  │ • Search  │  │ • Button      │  │ • ResponsiveMoreMenu        │  │
│  │ • Select  │  │ • Dropdown    │  │ • Tooltip                   │  │
│  │ • Columns │  │ • Badge       │  │ • Separator                 │  │
│  └───────────┘  └───────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Architectural Decisions

### 1. Unified vs. Domain-Specific

The system supports two patterns:

**Pattern A: Unified + Adapters (Recommended)**
- Use `TableToolbar` core component
- Create thin adapter wrappers for domain-specific props
- Benefits: Code reuse, consistent behavior, easier maintenance

**Pattern B: Standalone Implementations**
- Domain-specific toolbars with complete implementations
- Benefits: Maximum flexibility, no shared dependencies
- Drawback: Code duplication

### 2. Props Flow

```typescript
// Domain-specific props flow through adapters
TableComponent
    └── BudgetTableToolbar (Adapter)
            └── TableToolbar (Core)
                    ├── TableToolbarColumnVisibility
                    ├── TableToolbarBulkActions
                    └── ResponsiveMoreMenu
```

### 3. Feature Flags via Props

The unified `TableToolbar` uses optional props as feature flags:

| Feature | Props |
|---------|-------|
| Search | `searchQuery`, `onSearchChange` |
| Selection | `selectedCount`, `onClearSelection` |
| Column Visibility | `hiddenColumns`, `onToggleColumn` |
| Bulk Actions | `bulkActions` array |
| Export | `onExportCSV`, `onPrint`, `onOpenPrintPreview` |
| Admin Share | `isAdmin`, `onOpenShare` |
| Add New | `onAddNew` |

## Data Flow

```
User Interaction
       │
       ▼
┌──────────────┐
│   Toolbar    │ ──────────────────────────────────────┐
│  Component   │                                        │
└──────┬───────┘                                        │
       │                                                │
       ▼                                                ▼
┌──────────────┐                              ┌─────────────────┐
│    Hooks     │                              │   Callbacks     │
│              │                              │                 │
│ useSearch    │◄─────────────────────────────│ onSearchChange  │
│ useSelection │◄─────────────────────────────│ onClearSelection│
│ useColumns   │◄─────────────────────────────│ onToggleColumn  │
└──────┬───────┘                              └─────────────────┘
       │
       ▼
┌──────────────┐
│  Parent      │
│  Table       │
│  Component   │
└──────────────┘
```

## File Organization

```
components/ppdo/
├── table/
│   └── toolbar/
│       ├── TableToolbar.tsx              # Core unified component
│       ├── TableToolbarColumnVisibility.tsx
│       ├── TableToolbarBulkActions.tsx
│       ├── types.ts                      # Shared types
│       ├── index.ts                      # Public exports
│       ├── INTEGRATION_GUIDE.md
│       └── adapters/
│           ├── BudgetTableToolbar.tsx
│           ├── ProjectsTableToolbar.tsx
│           └── FundsTableToolbar.tsx
│
├── projects/
│   └── components/
│       └── ProjectsTable/
│           ├── ProjectsTableToolbar.tsx   # Standalone implementation
│           └── ColumnVisibilityMenu.tsx
│
├── funds/
│   └── components/
│       └── toolbar/
│           └── FundsTableToolbar.tsx      # Standalone implementation
│
├── twenty-percent-df/
│   └── components/
│       └── TwentyPercentDFTable/
│           └── TwentyPercentDFTableToolbar.tsx
│
└── 11_project_plan/
    └── table/
        └── BudgetTableToolbar.tsx         # Legacy standalone
```

## Migration Path

For legacy toolbars migrating to the unified system:

1. **Phase 1**: Create adapter that wraps `TableToolbar`
2. **Phase 2**: Update imports to use adapter
3. **Phase 3**: Remove legacy standalone implementation
4. **Phase 4**: Optionally simplify adapter if full unification desired
