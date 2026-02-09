# Implementation Plan - Table Enhancements

## Goal Description
Enhance the data tables with "Google Sheets-like" capabilities:
1.  **Draggable Column Reorder**: Verify and ensure this is functional across all tables using the shared system.
2.  **Custom Column Renaming**: Allow admin users to rename column headers via inline double-click editing, with persistence to the backend.

## User Review Required
> [!IMPORTANT]
> **Schema Change**: `userTableSettings` will be updated to store `customLabel` for each column.
> **UI Behavior**: Right-clicking a header will now show a custom context menu (to revert name) instead of the browser default.

## Target Scope (Routes & Components)

### 1. Project Breakdown
- **Route**: `/dashboard/project/[year]/[slug]`
- **Table Component**: `BreakdownHistoryTable`
- **Controller**: `components/features/ppdo/odpp/table-pages/breakdown/table/BreakdownHistoryTable.tsx`
- **Identifier**: `govtProjectBreakdowns`

### 2. Trust Funds
- **Route**: `/dashboard/trust-funds/[year]/[slug]`
- **Table Component**: `BreakdownHistoryTable` (Shared)
- **Identifier**: `trustFundBreakdowns`

### 3. Special Education Funds (SEF)
- **Route**: `/dashboard/special-education-funds/[year]/[slug]`
- **Table Component**: `BreakdownHistoryTable` (Shared)
- **Identifier**: `specialEducationFundBreakdowns`

### 4. Special Health Funds (SHF)
- **Route**: `/dashboard/special-health-funds/[year]/[slug]`
- **Table Component**: `BreakdownHistoryTable` (Shared)
- **Identifier**: `specialHealthFundBreakdowns`

### 5. 20% Development Fund
- **Route**: `/dashboard/20_percent_df/[year]/[slug]`
- **Table Component**: `BreakdownHistoryTable` (Shared)
- **Identifier**: `twentyPercentDFBreakdowns`

## Proposed Changes

### Backend (Backend/Convex Architect)
#### [convex/tableSettings.ts](file:///c:/ppdo/ppdo-next/convex/tableSettings.ts)
- Update `saveSettings` mutation validator to include `customLabel: v.optional(v.string())` in the `columns` array objects.
- Add `updateColumnLabel` mutation for efficient single-column updates (similar to `updateColumnWidth`).

### Frontend (Consolidation Architect & Frontend Specialist)
#### [Utilities] Core Table Hooks
- Update `useTableSettings.ts` (Core) to:
    - Handle `customLabel` in the `columns` state.
    - Merge `customLabel` from saved settings with default columns.
    - Expose `updateColumnLabel` function.
    - Path: `components/features/ppdo/odpp/utilities/data-tables/core/hooks/useTableSettings.ts`

#### [Components] Table Header
*Target: `components/features/ppdo/odpp/table-pages/breakdown/table/TableHeader.tsx`*
- **Render**: Display `column.customLabel ?? column.label`.
- **Interaction**:
    - `onDoubleClick`: Switch to `<input>` mode for Admin users.
    - `onKeyDown`: Listen for `Enter` to save the new label via `updateColumnLabel`.
    - `onContextMenu`: Custom context menu with "Revert to original name" option.
- **Style**: Ensure input matches the header styling (font, padding).

#### [Consolidation] Propagate to All Tables
- Ensure `ProjectsTable` and `BudgetItemsTable` also use the enhanced header if they share the same component.
- The `BreakdownHistoryTable` is the primary target as it powers 5 major sections of the app.

## Verification Plan

### Manual Verification
1.  **Reorder**: Drag "Status" column to the left of "Particulars". Refresh page. Verify order persists.
2.  **Rename**: Double-click "PARTICULARS" header. Rename to "Program Name". Press Enter. Verify change. Refresh page. Verify persistence.
3.  **Revert**: Right-click "Program Name". Select "Revert to original". Verify it goes back to "PARTICULARS".
4.  **Permissions**: Log in as non-admin. Verify double-click does nothing.
