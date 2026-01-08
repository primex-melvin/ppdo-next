# Budget Year Folders — Architecture & Plan

## Goal
Render the budget landing page as a grid of year folders (2024, 2025, 2026, ...), showing only years that have budget data. Clicking a folder navigates to that year view (or expands inline) with paginated items.

## Architecture Choices
- **Hybrid data fetch**: lightweight Convex query for year metadata (distinct years, counts, sums), lazy-load items per year.
- **Routing**: `/dashboard/budget` shows folders; `/dashboard/budget/[year]` (or inline expansion) lists that year’s items. Prefer route for deep links.
- **Data source**: Convex `budgetItems` table; ensure `year` field exists and is indexed for fast lookups.
- **Client hooks**: reuse existing budget hooks for mutations; add a dedicated hook for year metadata and per-year pagination.

## Data Model & API
- **Convex**
  - `getYearsWithCounts`: returns `{ year: number, count: number, totalAllocated?: number, lastUpdated?: number }[]`.
  - `listByYear({ year, paginationOpts })`: paginated items for a year.
  - Index: add `by_year` on `budgetItems.year` if missing.
- **Types**
  - Extend budget item type to require `year: number` (or handle `null` as "Unspecified").
  - Add `YearSummary` type for UI metadata.

## UI Plan
- **Folder grid** (on `/dashboard/budget`): cards ordered desc by year, showing count and totals; click → `/dashboard/budget/[year]`.
- **Year page**: header with year + stats; list/paginate items; hook into existing create/edit flows prefilled with the year.
- **Empty states**: if no data, show CTA to create with preselected year; if items without year, show "Unspecified" folder.
- **Loading**: skeletons for folder cards and per-year table.

## Tasks
1) Convex data
   - Add `getYearsWithCounts` query and `by_year` index if needed.
   - Add `listByYear` paginated query.
2) Types
   - Update `app/dashboard/budget/types.ts` with `YearSummary` and ensure `year` on items.
3) UI routing
   - Add `/dashboard/budget/[year]/page.tsx` that fetches and renders per-year list.
4) Landing page
   - Update `app/dashboard/budget/page.tsx` to render folder grid using `getYearsWithCounts`; navigate to year route.
5) Hooks
   - Add client hooks to fetch year metadata and per-year items (with pagination + invalidation on mutations).
6) UX polish
   - Add empty/loading states, totals formatting, and prefill year on new-item actions.

## Open Questions
- Should items with missing `year` be hidden or shown as "Unspecified"?
- Do we enforce integer years only (no ranges/quarters)?
- Do year folders need access-control filtering beyond existing budget permissions?
