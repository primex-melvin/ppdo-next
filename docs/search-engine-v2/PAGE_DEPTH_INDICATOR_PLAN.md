# Search Engine V2 - "Found in X page" Indicator Implementation Plan

## 📋 Overview

**Goal**: Display the navigation depth level in search result cards to help users understand where each result is located in the application hierarchy.

**Example**: `"Found in 1st page"`, `"Found in 2nd page"`, `"Found in 3rd page"`

---

## 🏗️ Architecture Decision: Option B - Join During Search Query

### Approach
Fetch author/creator information during the search query execution by looking up user data for each result.

### Why Option B for this implementation?
- **Fresh data**: Always get current user profile info
- **No denormalization complexity**: Don't need to maintain sync between users table and search index
- **Simpler migration**: No backfill needed for existing data
- **Acceptable trade-off**: For search results, a few extra DB lookups are acceptable vs. the complexity of maintaining denormalized data

### Implementation Strategy
```typescript
// In search query handler
const results = await Promise.all(
  filtered.map(async (entry) => {
    // Fetch author info if needed
    let authorName: string | undefined;
    let authorImage: string | undefined;
    
    if (entry.createdBy) {
      const user = await ctx.db.get(entry.createdBy as Id<"users">);
      if (user) {
        authorName = user.name || user.email;
        authorImage = user.image;
      }
    }
    
    // Calculate page depth from entity type
    const pageDepthText = getPageDepthDisplay(entry.entityType);
    
    return {
      indexEntry: entry,
      authorName,
      authorImage,
      pageDepthText,
      // ... other fields
    };
  })
);
```

---

## 🎯 Feature: "Found in X page" Indicator

### Page Depth Mapping Reference

| Entity Type | Page Level | Display Text | Route Example |
|-------------|------------|--------------|---------------|
| **Budget Items** | 1st page | "Found in 1st page" | `/dashboard/project/[year]` |
| **Projects** | 2nd page | "Found in 2nd page" | `/dashboard/project/[year]/[particularId]` |
| **Govt Project Breakdown** | 3rd page | "Found in 3rd page" | `/dashboard/project/[year]/[particularId]/[breakdownId]` |
| **20% DF Items** | 1st page | "Found in 1st page" | `/dashboard/20_percent_df/[year]` |
| **20% DF Breakdown** | 2nd page | "Found in 2nd page" | `/dashboard/20_percent_df/[year]/[slug]` |
| **Trust Fund Items** | 1st page | "Found in 1st page" | `/dashboard/trust-funds/[year]` |
| **Trust Fund Breakdown** | 2nd page | "Found in 2nd page" | `/dashboard/trust-funds/[year]/[slug]` |
| **Special Ed Items** | 1st page | "Found in 1st page" | `/dashboard/special-education-funds/[year]` |
| **Special Ed Breakdown** | 2nd page | "Found in 2nd page" | `/dashboard/special-education-funds/[year]/[slug]` |
| **Special Health Items** | 1st page | "Found in 1st page" | `/dashboard/special-health-funds/[year]` |
| **Special Health Breakdown** | 2nd page | "Found in 2nd page" | `/dashboard/special-health-funds/[year]/[slug]` |
| **Departments** | 1st page | "Found in 1st page" | `/dashboard/departments` |
| **Agencies/Offices** | 1st page | "Found in 1st page" | `/dashboard/office` |
| **Users** | 1st page | "Found in 1st page" | `/dashboard/settings/user-management` |

---

## 📁 Phase 1: Add Page Depth Utilities

### 1.1 Update Types File
**File**: `convex/search/types.ts`

Add page depth utility functions:

```typescript
/**
 * Page depth levels for entity types
 * Used to display "Found in X page" in search results
 */
export const ENTITY_PAGE_DEPTHS: Record<EntityType, number> = {
  // 1st page - List views
  project: 1,
  twentyPercentDF: 1,
  trustFund: 1,
  specialEducationFund: 1,
  specialHealthFund: 1,
  department: 1,
  agency: 1,
  user: 1,
  
  // Note: Breakdown items are typically part of their parent's detail page
  // If you have separate breakdown entity types, add them here:
  // projectBreakdown: 2,
  // twentyPercentDFBreakdown: 2,
  // trustFundBreakdown: 2,
  // specialEducationFundBreakdown: 2,
  // specialHealthFundBreakdown: 2,
};

/**
 * Get the page depth level for an entity type
 * Returns 1, 2, or 3
 */
export function getEntityPageDepth(entityType: EntityType): number {
  return ENTITY_PAGE_DEPTHS[entityType] || 1;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, 4th, etc.)
 */
export function getOrdinalSuffix(n: number): string {
  const suffixes: Record<number, string> = {
    1: "st",
    2: "nd",
    3: "rd",
  };
  
  // Special case for 11, 12, 13 (they use "th")
  if (n >= 11 && n <= 13) {
    return `${n}th`;
  }
  
  const lastDigit = n % 10;
  return `${n}${suffixes[lastDigit] || "th"}`;
}

/**
 * Get display text for page depth
 * Example: "Found in 1st page", "Found in 2nd page"
 */
export function getPageDepthDisplay(entityType: EntityType): string {
  const depth = getEntityPageDepth(entityType);
  const ordinal = getOrdinalSuffix(depth);
  return `Found in ${ordinal} page`;
}
```

---

## 📁 Phase 2: Update Search Query

### 2.1 Modify Search Handler
**File**: `convex/search/index.ts`

Update the search query to include page depth info:

```typescript
export const search = query({
  args: {
    // ... existing args ...
  },
  handler: async (ctx, args) => {
    // ... existing filtering logic ...
    
    // Process results with page depth
    const rankedResults = filtered
      .map((entry) => {
        // ... existing scoring logic ...
        
        return {
          entry,
          relevanceScore,
          matchedFields,
          highlights,
          pageDepthText: getPageDepthDisplay(entry.entityType),
        };
      })
      .filter((result) => result.matchedFields.length > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Return with page depth
    return {
      results: paginatedResults.map((r) => ({
        indexEntry: r.entry,
        relevanceScore: r.relevanceScore,
        matchedFields: r.matchedFields,
        highlights: r.highlights,
        sourceUrl: getEntityUrl(r.entry.entityType, r.entry.entityId, r.entry.year),
        pageDepthText: r.pageDepthText, // NEW
      })),
      totalCount: rankedResults.length,
      offset,
      limit,
      hasMore: offset + limit < rankedResults.length,
    };
  },
});
```

---

## 📁 Phase 3: Update Frontend Types

### 3.1 Update Search Result Type
**File**: `convex/search/types.ts`

Add page depth to the API result type:

```typescript
export interface SearchApiResult {
  indexEntry: SearchIndexEntry;
  relevanceScore: number;
  matchedFields: string[];
  highlights?: {
    primaryText?: string;
    secondaryText?: string;
  };
  sourceUrl: string;
  pageDepthText: string; // NEW: "Found in 1st page"
}
```

---

## 📁 Phase 4: Update SearchResultCard Component

### 4.1 Display Page Depth Indicator
**File**: `components/search/SearchResultCard.tsx`

Add page depth display in the card header:

```tsx
export function SearchResultCard({ result, index, onClick }: SearchResultCardProps) {
  const { indexEntry, pageDepthText } = result; // Extract pageDepthText
  const { entityType } = indexEntry;
  
  // ... rest of component ...
  
  return (
    <Card
      // ... existing props ...
    >
      {/* Card Header */}
      <div className="px-3 sm:px-6 pt-3 sm:pt-5 pb-2">
        <div className="flex items-center justify-between gap-3">
          {/* Left side: Badge + Page Depth */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Entity Type Badge */}
            <Badge
              variant="secondary"
              className="bg-[#15803D]/10 text-[#15803D] hover:bg-[#15803D]/20 font-medium text-xs sm:text-sm px-2.5 py-1 sm:py-0.5"
            >
              {getEntityTypeLabel(entityType)}
            </Badge>
            
            {/* Page Depth Indicator - NEW */}
            <span className="text-xs text-muted-foreground/80 italic">
              {pageDepthText}
            </span>
          </div>
          
          {/* Right side: Match Score */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
            <span className="font-medium text-[#15803D]">
              {Math.round(result.relevanceScore * 100)}%
            </span>
            <span>match</span>
          </div>
        </div>
      </div>
      
      {/* ... rest of card content ... */}
    </Card>
  );
}
```

### 4.2 Styling Options

**Option A: Inline text (subtle)**
```tsx
<span className="text-xs text-muted-foreground/80 italic">
  {pageDepthText}
</span>
```

**Option B: Small badge**
```tsx
<Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
  {pageDepthText}
</Badge>
```

**Option C: Icon + text**
```tsx
<div className="flex items-center gap-1 text-xs text-muted-foreground">
  <Layers className="h-3 w-3" />
  <span>{pageDepthText}</span>
</div>
```

**Recommended**: Option A (inline text) for clean, minimal look

---

## 📁 Phase 5: Testing

### 5.1 Test Cases

| Test Case | Expected Result |
|-----------|-----------------|
| Search for "city" in Trust Funds | Shows "Found in 1st page" |
| Search for project in Projects | Shows "Found in 1st page" |
| Search for breakdown item | Shows "Found in 2nd page" (if applicable) |
| Dark mode | Page depth text uses muted-foreground color |
| Mobile view | Text wraps correctly with badge |

### 5.2 Verify All Entity Types

- [ ] `project` → "Found in 1st page"
- [ ] `twentyPercentDF` → "Found in 1st page"
- [ ] `trustFund` → "Found in 1st page"
- [ ] `specialEducationFund` → "Found in 1st page"
- [ ] `specialHealthFund` → "Found in 1st page"
- [ ] `department` → "Found in 1st page"
- [ ] `agency` → "Found in 1st page"
- [ ] `user` → "Found in 1st page"

---

## 📁 File Changes Summary

### Backend Files
| File | Changes |
|------|---------|
| `convex/search/types.ts` | Add `ENTITY_PAGE_DEPTHS`, `getEntityPageDepth()`, `getOrdinalSuffix()`, `getPageDepthDisplay()` |
| `convex/search/index.ts` | Import and use `getPageDepthDisplay()` in search query, add to results |

### Frontend Files
| File | Changes |
|------|---------|
| `convex/search/types.ts` | Add `pageDepthText` to `SearchApiResult` interface |
| `components/search/SearchResultCard.tsx` | Display `pageDepthText` in card header |

---

## ⏱️ Estimated Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Add page depth utilities | 20 min |
| 2 | Update search query | 15 min |
| 3 | Update types | 10 min |
| 4 | Update SearchResultCard | 20 min |
| 5 | Testing | 15 min |
| **Total** | | **~80 minutes** |

---

## ✅ Success Criteria

1. ✅ Every search result shows "Found in X page" indicator
2. ✅ Page depth is correct for all entity types:
   - List views (projects, trust funds, etc.) → 1st page
   - Detail/breakdown views → 2nd or 3rd page
3. ✅ Text is subtle but readable (muted color, italic)
4. ✅ Works in both light and dark mode
5. ✅ Mobile responsive
6. ✅ No performance degradation (simple lookup)

---

## 📋 Card Layout Preview (After Implementation)

```
┌─────────────────────────────────────────────────────────┐
│ [Trust Fund]  Found in 1st page          85% match      │
│                                                         │
│ SUPREME COURT - <mark>CITY</mark> HALL OF JUSTICE      │
│ PEO                                                     │
│                                                         │
│ Matched in: [Title]                                     │
│                                                         │
│ Created: Feb 8, 2026                                    │
│ 🔗 /dashboard/trust-funds/2026                          │
│                                                         │
│ [Open]                                                  │
└─────────────────────────────────────────────────────────┘
               ↑
        "Found in 1st page" indicator
```

---

## 🚦 Status

**Architecture**: Option B - Join During Search Query ✅  
**Feature Scope**: "Found in X page" Indicator ONLY ✅  
**Implementation Ready**: ⏳ Awaiting GO signal

---

**Next Step**: Provide GO signal to begin implementation
