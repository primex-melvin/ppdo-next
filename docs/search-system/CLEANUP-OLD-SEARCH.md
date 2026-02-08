# Cleanup: Remove Old Search System

> Step-by-step guide to remove the old search system without breaking existing functionality

## Overview

This document outlines the complete cleanup process for removing the old search system components before the new global search (Phase 3) is fully implemented.

## Old Search System Components

### Frontend Components

| File | Purpose | Action |
|------|---------|--------|
| `components/layout/header/Header.tsx` | Contains search trigger button & overlay | Remove search-related code |
| `components/features/ppdo/dashboard/DashboardSearch.tsx` | Main search modal/overlay | **DELETE FILE** |
| `components/features/analytics/GlobalSearch.tsx` | Old CommandDialog search | **DELETE FILE** |
| `components/features/analytics/DashboardFilters.tsx` | Uses GlobalSearch | Remove GlobalSearch import & usage |
| `contexts/SearchContext.tsx` | Search context provider | **DELETE FILE** |

### Backend (Convex)

| File | Purpose | Action |
|------|---------|--------|
| `convex/dashboardSearch.ts` | Old search queries (searchAll, getCategoryCounts) | **DELETE FILE** |
| `convex/dashboard.ts` | Contains searchAutocomplete query | Remove searchAutocomplete query (lines 694-800+) |

---

## Step-by-Step Cleanup

### Step 1: Remove Search from Header.tsx

**File:** `components/layout/header/Header.tsx`

**Remove:**
1. Import: `import { DashboardSearch } from "@/components/features/ppdo/dashboard/DashboardSearch";`
2. Import: `import { Search } from "lucide-react";` (if only used for search)
3. State: `const [isSearchActive, setIsSearchActive] = useState(false);`
4. Effect: Keyboard shortcut handler for "/" key (lines 66-76)
5. JSX: Search trigger button (lines 272-287)
6. JSX: Search Overlay with AnimatePresence (lines 334-354)

**Keep:**
- Header structure
- User dropdown
- Notifications
- Email dropdown
- Report Concerns button
- Sidebar toggle

---

### Step 2: Delete DashboardSearch Component

**File:** `components/features/ppdo/dashboard/DashboardSearch.tsx`

**Action:** Delete the entire file

This is the main old search modal component with category tabs.

---

### Step 3: Delete GlobalSearch Component

**File:** `components/features/analytics/GlobalSearch.tsx`

**Action:** Delete the entire file

This is the CommandDialog-based search used in dashboard filters.

---

### Step 4: Update DashboardFilters.tsx

**File:** `components/features/analytics/DashboardFilters.tsx`

**Remove:**
1. Import: `import { GlobalSearch } from "./GlobalSearch";`
2. Component usage: `<GlobalSearch />` (around line 147)

**Note:** Keep the rest of DashboardFilters - it handles year, department, date filters.

---

### Step 5: Delete SearchContext

**File:** `contexts/SearchContext.tsx`

**Action:** Delete the entire file

**Also update:** `app/(private)/dashboard/layout.tsx`
- Remove: `import { SearchProvider } from "../../../contexts/SearchContext";`
- Remove: `<SearchProvider>` wrapper from the component tree

---

### Step 6: Delete Backend - dashboardSearch.ts

**File:** `convex/dashboardSearch.ts`

**Action:** Delete the entire file

Contains:
- `searchAll` query
- `getCategoryCounts` query

---

### Step 7: Update Backend - dashboard.ts

**File:** `convex/dashboard.ts`

**Remove:** The `searchAutocomplete` query (lines 694-800+)

This query searches departments, offices, projects, budgets.

---

## Verification Checklist

After cleanup, verify:

### Build & Type Checking
- [ ] `npm run build` succeeds without errors
- [ ] `npx convex dev` generates types successfully
- [ ] No TypeScript errors in affected files

### Functionality Verification
- [ ] Dashboard loads correctly
- [ ] Header displays without search button
- [ ] Sidebar navigation works
- [ ] User dropdown works
- [ ] Notifications work
- [ ] Dashboard filters (year, department, date) still work
- [ ] Report Concerns button still works
- [ ] No console errors

### Pages to Test
- [ ] `/dashboard` - Main dashboard
- [ ] `/dashboard/projects` - Projects page
- [ ] `/dashboard/trust-funds` - Trust funds page
- [ ] `/dashboard/settings` - Settings page

---

## Commit Message Template

```
chore: remove old search system components

Removed deprecated search components in preparation for new global search:

Frontend Cleanup:
- Remove search trigger from Header.tsx
- Delete DashboardSearch component (old modal search)
- Delete GlobalSearch component (CommandDialog search)
- Remove SearchContext and provider
- Update DashboardFilters to remove GlobalSearch usage

Backend Cleanup:
- Delete convex/dashboardSearch.ts (old search queries)
- Remove searchAutocomplete query from convex/dashboard.ts

The new global search system (in development) will replace these
components with a unified search experience.

BREAKING CHANGE: Old search functionality removed. New search
implementation in progress.
```

---

## Rollback Plan

If issues are discovered:

1. **Restore from git:**
   ```bash
   git revert HEAD
   ```

2. **Or manual restore:**
   - Files deleted can be restored from git history
   - Code removed from Header.tsx is in git history
   - Backend queries can be restored

---

## Post-Cleanup Notes

After cleanup, the new search system components should be placed:

1. **New Search Input:** Will be added to Header.tsx (different location/implementation)
2. **New Search Page:** Will be at `app/(dashboard)/search/page.tsx`
3. **New Backend:** Will use `convex/search/` directory

The cleanup ensures no naming conflicts or confusion between old and new systems.

---

*Cleanup Guide v1.0*
