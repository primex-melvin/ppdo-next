# Implementation Plan: Add AIP Ref. Code to Trust Funds, SEF, and SHF

> **Assignee:** [Colleague Name]  
> **Related:** Projects table AIP Ref. Code implementation (commit `b5d7490`)

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture Understanding](#architecture-understanding)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [The `seedDefaultWidths` Command Explained](#the-seeddefaultwidths-command-explained)
5. [Testing Checklist](#testing-checklist)
6. [Reference: Projects Implementation](#reference-projects-implementation)

---

## Overview

### Goal
Add the "AIP Ref. Code" column to three fund tables:
- **Trust Funds** (`trustFundsTable`)
- **Special Education Fund (SEF)** (`sefTable`)
- **Special Health Fund (SHF)** (`shfTable`)

### What is AIP Ref. Code?
AIP = Annual Investment Program. This is an optional reference code that can contain any characters. It appears:
- In the table as the **second column** (right after "#" row number, and before "Project Name")
- In the Add/Edit form as the **first input field**

### Files You'll Modify

#### Backend (Convex)
| File | Purpose |
|------|---------|
| `convex/schema/trustFunds.ts` | Add `aipRefCode` field to trustFunds table |
| `convex/schema/specialEducationFunds.ts` | Add `aipRefCode` field to sef table |
| `convex/schema/specialHealthFunds.ts` | Add `aipRefCode` field to shf table |
| `convex/trustFunds.ts` | Update create/update mutations |
| `convex/specialEducationFunds.ts` | Update create/update mutations |
| `convex/specialHealthFunds.ts` | Update create/update mutations |
| `convex/tableSettings.ts` | Add defaults for table column widths |

#### Frontend (React/Next.js)
| File | Purpose |
|------|---------|
| `components/features/ppdo/odpp/table-pages/trust-funds/types/index.ts` | Add to TrustFund and TrustFundFormData interfaces |
| `components/features/ppdo/odpp/table-pages/special-education-funds/types/index.ts` | Add to SEF interfaces |
| `components/features/ppdo/odpp/table-pages/special-health-funds/types/index.ts` | Add to SHF interfaces |
| `components/features/ppdo/odpp/utilities/data-tables/configs/trustFundsColumns.ts` | Add column config |
| `components/features/ppdo/odpp/utilities/data-tables/configs/sefColumns.ts` | Add column config |
| `components/features/ppdo/odpp/utilities/data-tables/configs/shfColumns.ts` | Add column config |
| Form validation files | Add to Zod schemas |
| Form components | Add AipRefCodeField to each form |
| Mutation hooks | Pass aipRefCode to API calls |

---

## Architecture Understanding

### How Table Column Widths Work

The column resizing system involves three layers:

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: Column Config (Frontend)                              │
│  File: projectsColumns.ts, trustFundsColumns.ts, etc.           │
│  - Defines default widths, min/max, flex values                 │
│  - Used when no user settings exist                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: Default Widths DB (Convex)                            │
│  Table: tableColumnDefaults                                     │
│  - Seeded via seedDefaultWidths mutation                        │
│  - Provides system-wide defaults for each table type            │
│  - Used when creating new user settings                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: User Settings (Convex)                                │
│  Table: userTableSettings                                       │
│  - Stores each user's custom widths and visibility              │
│  - Per-table, per-user                                          │
│  - Updated when user resizes columns                            │
└─────────────────────────────────────────────────────────────────┘
```

### The Problem We Fixed

When adding a NEW column to an EXISTING table:
- Old user settings don't have the new column
- The `updateColumnWidth` mutation used to just map over existing columns
- New columns were ignored → resizing didn't persist

**The Fix:** Modified `updateColumnWidth` to detect missing columns and add them:
```typescript
const existingColumn = existing.columns.find((c) => c.fieldKey === args.columnKey);
if (existingColumn) {
  // Update existing
} else {
  // Add new column with default values
  columns = [...existing.columns, { fieldKey: args.columnKey, ... }];
}
```

---

## Step-by-Step Implementation

### Phase 1: Backend Schema Updates

#### 1.1 Add Field to Trust Funds Schema
**File:** `convex/schema/trustFunds.ts`

Find the `trustFunds` table definition. Add the `aipRefCode` field in the "FUND IDENTIFICATION" or similar section:

```typescript
// Around line 15-25 (in the fields object)
aipRefCode: v.optional(v.string()), // 🆕 AIP Reference Code
```

Add an index if you want to query/search by this field:
```typescript
.index("aipRefCode", ["aipRefCode"])
```

#### 1.2 Add Field to SEF Schema
**File:** `convex/schema/specialEducationFunds.ts`

Same change as above:
```typescript
aipRefCode: v.optional(v.string()), // 🆕 AIP Reference Code
```

#### 1.3 Add Field to SHF Schema
**File:** `convex/schema/specialHealthFunds.ts`

Same change as above:
```typescript
aipRefCode: v.optional(v.string()), // 🆕 AIP Reference Code
```

#### 1.4 Update Trust Funds Mutations
**File:** `convex/trustFunds.ts`

Find the `create` mutation:
1. Add `aipRefCode: v.optional(v.string())` to the `args` object
2. Add `aipRefCode: args.aipRefCode` to the `ctx.db.insert()` call

Find the `update` mutation:
1. Add `aipRefCode: v.optional(v.string())` to the `args` object
2. Add `aipRefCode: args.aipRefCode` to the `ctx.db.patch()` call

#### 1.5 Update SEF Mutations
**File:** `convex/specialEducationFunds.ts`

Same pattern as Trust Funds.

#### 1.6 Update SHF Mutations
**File:** `convex/specialHealthFunds.ts`

Same pattern as Trust Funds.

#### 1.7 Add Default Column Widths
**File:** `convex/tableSettings.ts`

Find the `seedDefaultWidths` internalMutation. In the `allDefaults` array, add entries for each table:

```typescript
// Trust Funds
{ tableId: "trustFundsTable", col: "aipRefCode", width: 140, flex: 2, minW: 100, maxW: 250 },

// Special Education Fund
{ tableId: "sefTable", col: "aipRefCode", width: 140, flex: 2, minW: 100, maxW: 250 },

// Special Health Fund
{ tableId: "shfTable", col: "aipRefCode", width: 140, flex: 2, minW: 100, maxW: 250 },
```

> **Note:** Insert these BEFORE the `projectTitle` column entry for each table.

---

### Phase 2: Frontend Type Definitions

#### 2.1 Trust Funds Types
**File:** `components/features/ppdo/odpp/table-pages/trust-funds/types/index.ts`

Find the `TrustFund` interface, add:
```typescript
aipRefCode?: string;
```

Find the `TrustFundFormData` interface, add:
```typescript
aipRefCode?: string;
```

#### 2.2 SEF Types
**File:** `components/features/ppdo/odpp/table-pages/special-education-funds/types/index.ts`

Same changes as Trust Funds.

#### 2.3 SHF Types
**File:** `components/features/ppdo/odpp/table-pages/special-health-funds/types/index.ts`

Same changes as Trust Funds.

---

### Phase 3: Form Validation Schemas

Find the Zod validation schemas for each fund type. They should be in:
- `components/features/ppdo/odpp/table-pages/trust-funds/components/form/utils/`
- Or a shared location like `components/features/ppdo/odpp/utilities/common/utils/`

Add to each schema:
```typescript
aipRefCode: z.string().optional(),
```

---

### Phase 4: Table Column Configurations

#### 4.1 Trust Funds Columns
**File:** `components/features/ppdo/odpp/utilities/data-tables/configs/trustFundsColumns.ts`

The column config array order determines display order. Insert `aipRefCode` **AFTER** the row index (which is usually handled separately by the table component) and **BEFORE** the project/particular name column.

Since the "#" column is typically auto-generated by the table component, add `aipRefCode` as the **FIRST entry in your column config array**:

```typescript
{
    key: "aipRefCode",
    label: "AIP Ref. Code",
    width: 140,
    flex: 2,
    minWidth: 100,
    maxWidth: 250,
    type: "text",
    align: "left"
},
// ... rest of columns (projectTitle, status, etc.)
```

**Visual Order in Table:**
```
[#] | [AIP Ref. Code] | [Project Name] | [Status] | ...
```

#### 4.2 SEF Columns
**File:** `components/features/ppdo/odpp/utilities/data-tables/configs/sefColumns.ts`

Same change - insert `aipRefCode` **before** `projectTitle` (or equivalent) column.

**Visual Order in Table:**
```
[#] | [AIP Ref. Code] | [Project Title] | [Status] | ...
```

#### 4.3 SHF Columns
**File:** `components/features/ppdo/odpp/utilities/data-tables/configs/shfColumns.ts`

Same change - insert `aipRefCode` **before** `projectTitle` (or equivalent) column.

**Visual Order in Table:**
```
[#] | [AIP Ref. Code] | [Project Title] | [Status] | ...
```

---

### Phase 5: Form Components

For each fund type, you'll need to:

1. **Create or update form field components**
   - Either create a new `AipRefCodeField.tsx` component
   - Or reuse the existing one from projects if it's shared

2. **Update the main form component**
   - Import the AipRefCodeField
   - Add it as the FIRST field in the form JSX
   - Add `aipRefCode` to the defaultValues in useForm

3. **Update mutation hooks**
   - Find `useTrustFundMutations.ts`, `useSEFMutations.ts`, etc.
   - Pass `aipRefCode` to the create and update mutation calls

---

## The `seedDefaultWidths` Command Explained

### What It Does
```bash
npx convex dev --run tableSettings:seedDefaultWidths
```

This command runs the `seedDefaultWidths` internal mutation, which:
1. **Clears** all existing entries in the `tableColumnDefaults` table
2. **Re-inserts** all default column width definitions from the `allDefaults` array

### Why It's Needed

When you add a NEW column to an existing table type, you must:

1. **Add the column to the defaults array** in `tableSettings.ts`
2. **Run `seedDefaultWidths`** to populate the database

Without this:
- New users won't have the column in their default settings
- The `updateColumnWidth` mutation won't find default values for the new column
- Column resizing may not work correctly

### When to Run It

Run this command after:
- ✅ Adding a new column to `tableColumnDefaults` array
- ✅ Modifying default widths of existing columns
- ❌ NOT needed for frontend-only changes
- ❌ NOT needed for user settings updates (those are automatic)

### What Happens to Existing Users?

- Their **saved settings remain intact**
- When they resize the new column, the fixed `updateColumnWidth` mutation will add it to their settings
- If they "Reset to Defaults", they'll get the new column widths

---

## Testing Checklist

### Backend Tests
- [ ] Convex compiles without errors (`npx convex dev`)
- [ ] Can create new Trust Fund with AIP Ref. Code
- [ ] Can create new Trust Fund without AIP Ref. Code (optional field)
- [ ] Can edit existing Trust Fund to add AIP Ref. Code
- [ ] Same tests for SEF and SHF

### Frontend Tests
- [ ] AIP Ref. Code column appears as FIRST column in each table
- [ ] Column is resizable and width persists after refresh
- [ ] AIP Ref. Code field appears as FIRST field in each Add/Edit form
- [ ] Form submits correctly with AIP Ref. Code
- [ ] Form submits correctly without AIP Ref. Code
- [ ] Existing data loads correctly (AIP Ref. Code shows as empty)

### Database Tests
- [ ] Run `seedDefaultWidths` successfully
- [ ] Check `tableColumnDefaults` table has new entries:
  ```javascript
  // In Convex dashboard query
  db.query("tableColumnDefaults")
    .filter(q => q.eq(q.field("columnKey"), "aipRefCode"))
    .collect()
  ```

---

## Reference: Projects Implementation

For reference, here's what was done for Projects:

### Schema (`convex/schema/projects.ts`)
```typescript
aipRefCode: v.optional(v.string()), // Around line 84
```

### Mutation (`convex/projects.ts`)
```typescript
// In create mutation args:
aipRefCode: v.optional(v.string()),

// In create mutation insert:
aipRefCode: args.aipRefCode,

// Same for update mutation
```

### Types (`components/features/ppdo/odpp/table-pages/projects/types/index.ts`)
```typescript
// In Project interface
aipRefCode?: string;

// In ProjectFormData interface
aipRefCode?: string;
```

### Column Config (`components/features/ppdo/odpp/utilities/data-tables/configs/projectsColumns.ts`)
```typescript
{
    key: "aipRefCode",
    label: "AIP Ref. Code",
    width: 140,
    flex: 2,
    minWidth: 100,
    maxWidth: 250,
    type: "text",
    align: "left"
},
```

### Form Component (`components/features/ppdo/odpp/table-pages/projects/components/form/AipRefCodeField.tsx`)
Standard React Hook Form field with Input component.

---

## Questions?

If you encounter issues:
1. Check the Projects implementation (commit `b5d7490`) as a working reference
2. Verify the `tableColumnDefaults` table has the new entries after running `seedDefaultWidths`
3. Check browser console for errors when resizing columns
4. Verify the mutation hooks are passing `aipRefCode` to the Convex mutations

Good luck! 🚀
