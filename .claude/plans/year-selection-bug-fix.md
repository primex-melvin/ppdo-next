# Implementation Plan: Fix Year Selection Bug in PPDO Dashboard

## Problem Summary

The dashboard year selection/filtering is not working correctly. The year from the URL (`/dashboard/[year]`) is not properly synchronized with the filter state, causing:
1. Year indicator in dropdown not showing the correct selection
2. Data not filtering based on the selected year

---

## Root Cause Analysis

### Bug #1: Type Mismatch in YearSwitcher (CRITICAL)
**File:** `components/analytics/DashboardFilters.tsx`
**Lines:** 289, 363

```typescript
// Line 289 - displayYear can be number OR string
const displayYear = activeYear || (currentYear ? currentYear.year : "Select");

// Line 363 - Comparing mixed types
displayYear === fy.year  // "Select" === 2024 → ALWAYS FALSE
```

**Impact:** When `activeYear` is undefined and no `currentFiscalYearId` is set, `displayYear` becomes the string `"Select"`. Comparing `"Select" === 2024` always fails, so the checkmark never shows.

### Bug #2: Year State Not Synchronized
**Files:**
- `app/(private)/dashboard/[year]/page.tsx`
- `hooks/useDashboardFilters.ts`

The URL path year (`/dashboard/2024`) and the filter state (`filters.fiscalYearId`) are **independent**:
- `activeYear` prop comes from URL path parameter
- `filters.fiscalYearId` comes from URL search params (`?fy=...`)
- They are never synchronized

**Data Flow:**
```
URL: /dashboard/2024?fy=xyz123
     ↓              ↓
   activeYear    filters.fiscalYearId
   (2024)        (xyz123 - could be different year!)
```

### Bug #3: DashboardContent Uses Fallback Logic
**File:** `components/analytics/DashboardContent.tsx`
**Lines:** 25-29

```typescript
const fiscalYearId = filters.fiscalYearId || (
    year && fiscalYears
        ? fiscalYears.find(fy => fy.year === parseInt(year))?._id
        : undefined
);
```

This fallback only works when `filters.fiscalYearId` is undefined, but if the user had previously set a different fiscal year via filters, it would use that instead of the URL year.

---

## Implementation Plan

### Step 1: Fix Type Mismatch in YearSwitcher

**File:** `components/analytics/DashboardFilters.tsx`

**Change at Line 289:**
```typescript
// BEFORE
const displayYear = activeYear || (currentYear ? currentYear.year : "Select");

// AFTER
const displayYear: number | undefined = activeYear ?? currentYear?.year;
const displayLabel = displayYear ?? "Select";
```

**Change at Line 317:**
```typescript
// BEFORE
<span className="font-bold text-lg">Year: {displayYear}</span>

// AFTER
<span className="font-bold text-lg">Year: {displayLabel}</span>
```

**Change at Line 363:**
```typescript
// BEFORE
displayYear === fy.year

// AFTER
displayYear === fy.year  // Now both are number | undefined, comparison is type-safe
```

### Step 2: Update handleYearChange Check

**File:** `components/analytics/DashboardFilters.tsx`

**Change at Line 292:**
```typescript
// BEFORE
if ((activeYear === year) || (currentYear && currentYear.year === year)) {

// AFTER
if (displayYear === year) {
```

### Step 3: Ensure Year is Passed to DashboardContent Consistently

**File:** `app/(private)/dashboard/[year]/page.tsx`

The current implementation is correct - it passes `year` as a string prop. However, ensure the component re-renders when year changes.

**No change needed** - current implementation is correct:
```typescript
<DashboardContent filters={filters} year={year} />
```

### Step 4: Add Year Validation (Optional Enhancement)

**File:** `app/(private)/dashboard/[year]/page.tsx`

Add validation for invalid year parameters:

```typescript
export default function AnalyticsPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = use(params);
  const { filters, updateFilter, resetFilters } = useDashboardFilters();

  // Optional: Validate year is a 4-digit number
  const parsedYear = parseInt(year);
  const isValidYear = !isNaN(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100;

  if (!isValidYear) {
    // Redirect to current year or show error
    redirect(`/dashboard/${new Date().getFullYear()}`);
  }

  // ... rest of component
}
```

---

## Files to Modify

| # | File | Changes | Priority |
|---|------|---------|----------|
| 1 | `components/analytics/DashboardFilters.tsx` | Fix type mismatch in YearSwitcher (lines 289, 292, 317, 363) | **Critical** |
| 2 | `app/(private)/dashboard/[year]/page.tsx` | Add year validation (optional) | Low |

---

## Detailed Code Changes

### Change 1: DashboardFilters.tsx - YearSwitcher Component

**Location:** Lines 286-320

```typescript
// BEFORE (lines 286-320)
function YearSwitcher({ fiscalYears, currentFiscalYearId, mobile, activeYear }: YearSwitcherProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const currentYear = fiscalYears.find(fy => fy._id === currentFiscalYearId);

    // Priority: activeYear prop > currentFiscalYearId lookup > "Select"
    const displayYear = activeYear || (currentYear ? currentYear.year : "Select");

    const handleYearChange = async (year: number) => {
        if ((activeYear === year) || (currentYear && currentYear.year === year)) {
            setOpen(false);
            return;
        }
        // ... rest
    };

    const TriggerInfo = (
        <div className={cn("flex items-center gap-2", mobile && "w-full justify-between")}>
            <span className="font-bold text-lg">Year: {displayYear}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
    );
    // ...
}

// AFTER
function YearSwitcher({ fiscalYears, currentFiscalYearId, mobile, activeYear }: YearSwitcherProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const currentYear = fiscalYears.find(fy => fy._id === currentFiscalYearId);

    // Priority: activeYear prop > currentFiscalYearId lookup
    // Keep displayYear as number | undefined for type-safe comparisons
    const displayYear: number | undefined = activeYear ?? currentYear?.year;

    const handleYearChange = async (year: number) => {
        if (displayYear === year) {
            setOpen(false);
            return;
        }
        // ... rest unchanged
    };

    const TriggerInfo = (
        <div className={cn("flex items-center gap-2", mobile && "w-full justify-between")}>
            <span className="font-bold text-lg">Year: {displayYear ?? "Select"}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
    );
    // ...
}
```

### Change 2: Comparison at Line 363 (Already Fixed)

With the above change, line 363 now compares:
- `displayYear` (type: `number | undefined`)
- `fy.year` (type: `number`)

When `displayYear` is `undefined`, the comparison `undefined === 2024` correctly returns `false`.
When `displayYear` is `2024`, the comparison `2024 === 2024` correctly returns `true`.

---

## Testing Steps

### Test 1: Year Selection Indicator
1. Navigate to `/dashboard/2024`
2. Open the year dropdown
3. **Expected:** FY 2024 should show a checkmark ✓
4. **Before fix:** No year shows a checkmark

### Test 2: Year Switching
1. Navigate to `/dashboard/2024`
2. Open year dropdown and select 2025
3. **Expected:**
   - URL changes to `/dashboard/2025`
   - Dashboard data refreshes with 2025 data
   - Year dropdown shows 2025 with checkmark

### Test 3: Direct URL Navigation
1. Directly navigate to `/dashboard/2023`
2. **Expected:**
   - Dashboard shows 2023 data
   - Year dropdown shows "Year: 2023"
   - 2023 has checkmark in dropdown

### Test 4: Filter State Independence
1. Navigate to `/dashboard/2024`
2. Apply other filters (department, quarter)
3. Switch year to 2025
4. **Expected:** Other filters persist, only year changes

---

## Summary

The primary fix is in `components/analytics/DashboardFilters.tsx` in the `YearSwitcher` component:

1. Change `displayYear` from `number | "Select"` to `number | undefined`
2. Use nullish coalescing (`??`) instead of logical OR (`||`)
3. Display "Select" only in the UI label, not in comparison logic

This ensures type-safe comparisons and fixes the year selection indicator bug.
