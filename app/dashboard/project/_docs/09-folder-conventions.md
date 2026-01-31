# Folder Conventions

> Next.js App Router folder structure and naming conventions for the Projects module

---

## Overview

This module follows **Next.js App Router best practices** for organizing code:

- **Route Groups** `(group)` - Organize code without changing URLs
- **Private Folders** `_folder` - Colocate non-routable files

---

## Private Folders

Folders prefixed with underscore (`_`) are excluded from the routing system. Use these for:

| Folder | Purpose | Example Contents |
|--------|---------|------------------|
| `_components/` | Page-specific UI components | `StatusChainCard.tsx`, `FiscalYearModal.tsx` |
| `_lib/` | Utilities, helpers, data fetching | `page-helpers.ts`, `data.ts`, `utils.ts` |
| `_types/` | TypeScript type definitions | `inspection.ts` |
| `_docs/` | Documentation files | `*.md` files |

### Why Private Folders?

```
Before (problematic):
app/dashboard/project/components/FiscalYearModal.tsx
→ Creates URL: /dashboard/project/components  ❌

After (correct):
app/dashboard/project/_components/FiscalYearModal.tsx
→ No URL created, component is private  ✅
```

---

## Route Structure

```
app/dashboard/project/
│
├── page.tsx                          # /dashboard/project
│
├── _components/                      # Private: Shared components
│   └── FiscalYearModal.tsx
│
├── _docs/                            # Private: Documentation
│   └── *.md
│
└── [year]/                           # /dashboard/project/:year
    ├── page.tsx
    └── [particularId]/               # /dashboard/project/:year/:particularId
        ├── page.tsx
        └── [projectbreakdownId]/     # /dashboard/project/:year/:particularId/:projectbreakdownId
            ├── page.tsx
            ├── _components/          # Private: Page-specific components
            │   └── StatusChainCard.tsx
            ├── _lib/                 # Private: Utilities
            │   └── page-helpers.ts
            └── [inspectionId]/       # /dashboard/project/.../:inspectionId
                ├── page.tsx
                ├── _lib/             # Private: Data & utils
                │   ├── data.ts
                │   └── utils.ts
                └── _types/           # Private: TypeScript types
                    └── inspection.ts
```

---

## Import Patterns

### Relative Imports (Within Same Route)

```tsx
// From: app/dashboard/project/[year]/[particularId]/[projectbreakdownId]/page.tsx

// Import from _components
import { StatusChainCard } from "./_components/StatusChainCard";

// Import from _lib
import { getStatusColor } from "./_lib/page-helpers";
```

### Absolute Imports (From Shared)

```tsx
// Import from shared component library
import { BreakdownHeader } from "@/components/ppdo/breakdown";
import { Modal } from "@/components/ppdo/11_project_plan";

// Import from shared hooks
import { useEntityStats } from "@/lib/hooks/useEntityStats";
```

---

## File Organization Rules

### 1. Keep Routes Clean

```
❌ Bad:
[projectbreakdownId]/
├── page.tsx
├── StatusChainCard.tsx      # Creates route!
├── utils.ts                 # Creates route!
└── types.ts                 # Creates route!

✅ Good:
[projectbreakdownId]/
├── page.tsx
├── _components/
│   └── StatusChainCard.tsx
└── _lib/
    └── page-helpers.ts
```

### 2. Colocate Related Files

```
[inspectionId]/
├── page.tsx                  # Main page
├── _lib/
│   ├── data.ts              # Data fetching
│   └── utils.ts             # Utilities
└── _types/
    └── inspection.ts        # Type definitions
```

### 3. Use `_lib/` for Utilities

Rename `utils/` to `_lib/` to follow Next.js conventions:

```
❌ Old:
utils/page-helpers.ts

✅ New:
_lib/page-helpers.ts
```

---

## Migration Guide

### From Old Structure

| Old Path | New Path |
|----------|----------|
| `components/FiscalYearModal.tsx` | `_components/FiscalYearModal.tsx` |
| `docs/*.md` | `_docs/*.md` |
| `[breakdown]/components/*.tsx` | `[breakdown]/_components/*.tsx` |
| `[breakdown]/utils/*.ts` | `[breakdown]/_lib/*.ts` |
| `[breakdown]/types/*.ts` | `[breakdown]/_types/*.ts` |

### Update Imports

```tsx
// Before
import { StatusChainCard } from "./components/StatusChainCard";
import { getStatusColor } from "./utils/page-helpers";

// After
import { StatusChainCard } from "./_components/StatusChainCard";
import { getStatusColor } from "./_lib/page-helpers";
```

---

## Benefits

1. **No Accidental Routes** - Private folders can't be accessed via URL
2. **Clean URLs** - Only intended routes are exposed
3. **Colocation** - Related files stay together
4. **Clear Intent** - Underscore prefix signals "not a route"
5. **Next.js Native** - Follows official App Router conventions

---

## Related Documentation

- [Route Structure](./02-route-structure.md)
- [Next.js App Router: Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Next.js App Router: Private Folders](https://nextjs.org/docs/app/building-your-application/routing/colocation#private-folders)
