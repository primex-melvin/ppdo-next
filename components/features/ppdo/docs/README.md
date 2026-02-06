# PPDO Components Documentation

> Reusable component library for the Provincial Planning and Development Office (Philippines)

---

## Table of Contents

1. [Architecture Overview](./01-architecture-overview.md)
2. [Breakdown Components](./02-breakdown-components.md)
3. [Dashboard Components](./03-dashboard-components.md)
4. [Projects Components](./04-projects-components.md)
5. [Funds Components](./05-funds-components.md)
6. [Table Components](./06-table-components.md)
7. [Shared Components](./07-shared-components.md)
8. [Static Components](./08-static-components.md)
9. [Component Patterns](./09-component-patterns.md)

---

## Quick Start

### Import Patterns

```typescript
// Barrel imports (preferred)
import {
  BreakdownForm,
  BreakdownHistoryTable,
  useTableSettings,
} from "@/components/features/ppdo/breakdown";

import {
  DashboardChartCard,
  KPICardsRow,
} from "@/components/features/ppdo/dashboard";

import {
  ProjectForm,
  ProjectsTable,
} from "@/components/features/ppdo/projects";
```

---

## Component Categories

```
components/ppdo/
â”‚
â”œâ”€â”€ breakdown/           # Project/Fund breakdown components
â”‚   â”œâ”€â”€ form/           # Breakdown form fields
â”‚   â”œâ”€â”€ table/          # Breakdown data tables
â”‚   â”œâ”€â”€ kanban/         # Kanban board view
â”‚   â”œâ”€â”€ shared/         # Shared breakdown UI
â”‚   â”œâ”€â”€ hooks/          # Custom hooks
â”‚   â”œâ”€â”€ types/          # TypeScript types
â”‚   â””â”€â”€ utils/          # Utilities
â”‚
â”œâ”€â”€ dashboard/          # Dashboard landing & analytics
â”‚   â”œâ”€â”€ charts/         # Data visualization
â”‚   â”œâ”€â”€ landing/        # Fiscal year landing
â”‚   â””â”€â”€ summary/        # Dashboard summary
â”‚
â”œâ”€â”€ fiscal-years/       # Fiscal year shared components
â”‚
â”œâ”€â”€ funds/              # Trust Funds, SEF, SHF components
â”‚
â”œâ”€â”€ projects/           # Project management components
â”‚
â”œâ”€â”€ shared/             # Cross-module shared components
â”‚   â”œâ”€â”€ kanban/         # Reusable kanban
â”‚   â””â”€â”€ toolbar/        # Shared toolbar
â”‚
â”œâ”€â”€ static/             # Landing page (marketing) components
â”‚
â”œâ”€â”€ table/              # Table system components
â”‚   â”œâ”€â”€ implementing-office/
â”‚   â”œâ”€â”€ print-preview/
â”‚   â””â”€â”€ toolbar/
â”‚
â”œâ”€â”€ twenty-percent-df/  # 20% Development Fund components
â”‚
â””â”€â”€ [standalone files]  # Individual components
    â”œâ”€â”€ LoadingState.tsx
    â”œâ”€â”€ BaseShareModal.tsx
    â””â”€â”€ ...
```

---

## Component Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    COMPONENT HIERARCHY                       â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚                                                             â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚                  PAGE LEVEL                          â”‚   â”‚
â”‚  â”‚  (app/dashboard/.../page.tsx)                        â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                       â”‚                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚               MODULE COMPONENTS                      â”‚   â”‚
â”‚  â”‚  (components/ppdo/breakdown, projects, funds)        â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                       â”‚                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚               SHARED COMPONENTS                      â”‚   â”‚
â”‚  â”‚  (components/ppdo/shared, table)                     â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                       â”‚                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚                 UI COMPONENTS                        â”‚   â”‚
â”‚  â”‚  (components/ui - shadcn/ui base)                    â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                                             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Key Features

### 1. Modular Architecture
Each module (breakdown, projects, funds) is self-contained with:
- Components
- Hooks
- Types
- Utilities
- Constants

### 2. Table System
Comprehensive table system with:
- Sorting
- Filtering
- Column resize
- Column reorder
- Print preview
- Bulk actions

### 3. Form System
Standardized forms with:
- React Hook Form
- Zod validation
- Field components
- Auto-calculation
- Budget validation

### 4. Print System
Canvas-based print preview with:
- PDF generation
- Template system
- Draft saving

---

## Related Documentation

- [Dashboard Docs](../../app/dashboard/_docs/README.md)
- [Project README](../../../README.md)

---

*Maintained by: Product & Documentation Lead*  
*Part of: PPDO Next.js + Convex Project*