# Dashboard Architecture Overview

> Understanding the high-level architecture of the PPDO Dashboard

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Browser)                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js 16 (App Router)                      │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │   │
│  │  │  App Router  │ │  React 19    │ │  Server Components       │ │   │
│  │  │  (App Dir)   │ │  Components  │ │  + Client Components     │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────────────────┘ │   │
│  │                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │              Context Providers (Client)                   │   │   │
│  │  │  - SidebarContext        - AccentColorContext            │   │   │
│  │  │  - SearchContext         - BreadcrumbContext             │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Convex Client (Real-time)                    │   │
│  │         useQuery, useMutation, useConvexAuth                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ WebSocket (Real-time)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND LAYER (Convex)                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Convex Backend                             │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │   │
│  │  │   Queries    │ │  Mutations   │ │      Actions             │ │   │
│  │  │  (Read)      │ │   (Write)    │ │   (External APIs)        │ │   │
│  │  └──────────────┘ └──────────────┘ └──────────────────────────┘ │   │
│  │                                                                  │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │                    Database (Convex DB)                   │   │   │
│  │  │  - Users, Departments    - Budget Items                  │   │   │
│  │  │  - Projects              - Particulars                   │   │   │
│  │  │  - Trust Funds           - SEF/SHF                       │   │   │
│  │  │  - Breakdowns            - Inspections                   │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Dashboard Module Hierarchy

```
app/dashboard/
│
├── layout.tsx                    # Root layout with providers
├── page.tsx                      # Dashboard landing page
│
├── [year]/                       # Year-specific routes
│   └── page.tsx                  # Year overview
│
├── components/                   # Shared dashboard components
│   └── print/                    # Print-related components
│
├── cms/                          # Content Management System
│   └── page.tsx
│
├── implementing-agencies/        # Agency management
│   ├── page.tsx
│   ├── [id]/page.tsx
│   └── components/
│
├── office/                       # Office management
│   ├── page.tsx
│   └── [code]/page.tsx
│
├── particulars/                  # Budget & Project particulars
│   ├── page.tsx
│   ├── _components/              # Private components
│   ├── _constants/               # Constants
│   └── _hooks/                   # Custom hooks
│
├── personal-kpi/                 # Personal KPI tracking
│   └── page.tsx
│
├── project/                      # Projects module (COMPLEX)
│   ├── page.tsx                  # Fiscal year landing
│   ├── components/               # Shared project components
│   │   └── FiscalYearModal.tsx
│   │
│   └── [year]/                   # Year-specific project routes
│       ├── page.tsx              # Budget items for year
│       │
│       ├── components/           # Year-level components
│       │   ├── hooks/            # Custom hooks
│       │   ├── table/            # Table components
│       │   └── form/             # Form components
│       │
│       ├── [particularId]/       # Particular-specific
│       │   ├── page.tsx          # Projects list
│       │   └── components/       # Project components
│       │
│       └── [particularId]/[projectbreakdownId]/
│           ├── page.tsx          # Breakdown list
│           └── components/       # Breakdown components
│
├── settings/                     # Settings module
│   ├── layout.tsx
│   ├── user-management/          # User management
│   │   ├── page.tsx
│   │   ├── components/
│   │   └── hooks/
│   │
│   └── updates/                  # Updates module
│       ├── page.tsx
│       ├── changelogs/
│       ├── bugs-report/
│       └── suggestions/
│
├── trust-funds/                  # Trust Funds module
│   ├── page.tsx                  # Year landing
│   └── [year]/
│       ├── page.tsx
│       └── components/
│
├── special-education-funds/      # SEF module
│   ├── page.tsx
│   └── [year]/
│       ├── page.tsx
│       └── [slug]/page.tsx
│
├── special-health-funds/         # SHF module
│   ├── page.tsx
│   └── [year]/
│       ├── page.tsx
│       └── [slug]/page.tsx
│
└── 20_percent_df/                # 20% DF module
    ├── page.tsx
    └── [year]/
        ├── page.tsx
        └── [slug]/page.tsx
```

---

## Key Architectural Patterns

### 1. Layout Hierarchy
```
Root Layout (app/layout.tsx)
    └── Dashboard Layout (app/dashboard/layout.tsx)
            ├── Header Component
            ├── Sidebar Component
            └── Page Content (varies by route)
```

### 2. Data Fetching Pattern (Convex)
```typescript
// Server Component (if using)
// OR Client Component with hooks
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function MyPage() {
  const data = useQuery(api.myModule.getData, {});
  // Real-time updates automatically
}
```

### 3. Component Organization
```
Module/
├── page.tsx              # Route entry point
├── layout.tsx            # Module-specific layout (optional)
├── components/           # Shared module components
│   └── ComponentName.tsx
├── [subroute]/           # Nested routes
│   ├── page.tsx
│   └── components/       # Route-specific components
│       └── SubComponent.tsx
├── _components/          # Private components (Next.js convention)
├── _hooks/               # Custom hooks
└── _constants/           # Constants
```

### 4. State Management Stack
| Level | Technology | Purpose |
|-------|------------|---------|
| Global Server | Convex | Database, auth, real-time sync |
| Global Client | React Context | UI state (sidebar, search, theme) |
| Local | useState/useReducer | Component-level state |
| Forms | React Hook Form | Form state and validation |

---

## Technology Stack Details

### Frontend
```
┌────────────────────────────────────────┐
│  Next.js 16 (App Router)               │
│  ├── React 19                          │
│  ├── Server Components (default)       │
│  ├── Client Components ("use client")  │
│  └── Route handlers                    │
├────────────────────────────────────────┤
│  Styling                               │
│  ├── Tailwind CSS 4                    │
│  ├── Shadcn/ui components              │
│  ├── Radix UI primitives               │
│  └── CSS Variables (theming)           │
├────────────────────────────────────────┤
│  State Management                      │
│  ├── Convex React hooks                │
│  ├── React Context (UI state)          │
│  └── React Hook Form (forms)           │
├────────────────────────────────────────┤
│  Utilities                             │
│  ├── Zod (validation)                  │
│  ├── date-fns (dates)                  │
│  ├── lucide-react (icons)              │
│  └── framer-motion (animations)        │
└────────────────────────────────────────┘
```

### Backend (Convex)
```
┌────────────────────────────────────────┐
│  Convex Backend                        │
│  ├── Schema Definition (schema.ts)     │
│  ├── Queries (read operations)         │
│  ├── Mutations (write operations)      │
│  ├── Actions (external APIs)           │
│  └── Auth (@convex-dev/auth)           │
├────────────────────────────────────────┤
│  Database                              │
│  ├── Documents (NoSQL)                 │
│  ├── Indexes (performance)             │
│  └── Relationships (foreign keys)      │
└────────────────────────────────────────┘
```

---

## Component Types

### 1. Server Components (Default)
- No "use client" directive
- Can access backend directly (in server context)
- Cannot use browser APIs or React hooks
- Used for: Static content, initial data fetch

### 2. Client Components
```typescript
"use client";
// Can use:
// - React hooks (useState, useEffect)
// - Browser APIs (window, document)
// - Convex hooks (useQuery, useMutation)
// - Event handlers
```

### 3. Shared Components (from /components)
Located outside `app/dashboard/`, can be used anywhere:
- `/components/ui/*` - Shadcn/ui base components
- `/components/ppdo/*` - PPDO-specific shared components
- `/components/sidebar/*` - Navigation components
- `/components/header/*` - Header components

---

## File Naming Conventions

| Pattern | Usage | Example |
|---------|-------|---------|
| `page.tsx` | Route page component | `app/dashboard/page.tsx` |
| `layout.tsx` | Layout wrapper | `app/dashboard/layout.tsx` |
| `loading.tsx` | Loading UI | `app/dashboard/loading.tsx` |
| `error.tsx` | Error boundary | `app/dashboard/error.tsx` |
| `not-found.tsx` | 404 page | `app/dashboard/not-found.tsx` |
| `*.tsx` | React components | `BudgetTable.tsx` |
| `use*.ts` | Custom hooks | `useBudgetData.ts` |
| `*.types.ts` | Type definitions | `budget.types.ts` |
| `*.utils.ts` | Utility functions | `budget.utils.ts` |
| `*.constants.ts` | Constants | `table.constants.ts` |
| `*.config.ts` | Configuration | `spreadsheet.config.ts` |

---

## Next Steps

- [Routing Structure](./02-routing-structure.md) - Detailed route definitions
- [Layout & Navigation](./03-layout-and-navigation.md) - Sidebar and layout system
- [Development Guide](./10-development-guide.md) - Coding standards and best practices
