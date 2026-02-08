# Search Engine V2 - Implementation Plan

## 📋 Executive Summary

**Status**: Current search engine has critical bugs where existing data (e.g., "BOOM" project) is not appearing in search results despite being indexed.

**Goal**: Build a robust, Google-quality search experience with highlighting, animations, and seamless navigation.

**Team**: Google Search Retired Team + Original PPDO Team Agents

---

## 🎯 Requirements Analysis

### Current Issues (From Screenshots)
| Issue | Evidence | Priority |
|-------|----------|----------|
| Missing search results | "BOOM" exists in DB but search returns 0 results | 🔴 P0 |
| Inconsistent highlighting | Some results show highlights, others don't | 🟡 P1 |
| No source links | Users can't navigate to original record | 🔴 P0 |
| No date metadata | Missing created/updated timestamps | 🟡 P1 |
| No loading states | Clicking results feels unresponsive | 🟡 P1 |

### Required Features
1. ✅ **Universal Search** - Find ALL entities in database
2. ✅ **Text Highlighting** - Yellow highlight (#fef08a) on matched terms
3. ✅ **Source Navigation** - Click result → Navigate to original page
4. ✅ **Column Attribution** - Show which field matched (e.g., "Particulars", "Implementing Office")
5. ✅ **Date Metadata** - Display createdAt/updatedAt
6. ✅ **Cascade Animations** - Staggered card entrance animations
7. ✅ **Loading States** - Disabled/loading state during navigation
8. ✅ **Mobile Responsive** - Full mobile support
9. ✅ **Dark Mode** - #15803D green theme for light/dark

---

## 🏗️ Architecture Design

### Component Hierarchy
```
SearchPage
├── StickyBreadcrumbBar (z-50)
├── SearchInput (shadcn Input)
├── FilterSidebar (desktop: right, mobile: sheet)
└── SearchResults
    └── SearchResultCard (animated)
        ├── CardHeader (Entity Type Badge + Match Score)
        ├── CardContent
        │   ├── HighlightedTitle
        │   ├── HighlightedDescription
        │   ├── MatchedFields (chips)
        │   └── DateMetadata
        └── CardFooter (Source Link)
```

### Color System (shadcn)
```css
/* Primary Green - #15803D */
--primary: 158 83 37;           /* green-700 */
--primary-foreground: 0 0 100%; /* white */

/* Highlight Yellow */
--highlight: 54 96 84%;         /* yellow-200 #fef08a */
--highlight-foreground: 41 96 21%; /* yellow-900 #854d0e */

/* Dark Mode */
.dark --highlight: 45 93 47%;   /* yellow-700 #a16207 */
.dark --highlight-foreground: 54 100 92%; /* yellow-100 #fef9c3 */
```

---

## 📦 Phase 1: Backend Fixes (Critical)

### 1.1 Fix Missing Search Results
**Problem**: Data exists but search returns 0 results

**Root Causes**:
1. Index not updated after data creation
2. Filtering logic too strict
3. Case-sensitive matching

**Solution**:
```typescript
// convex/search/index.ts - search query
export const search = query({
  handler: async (ctx, args) => {
    // 1. Get ALL entries first (no premature filtering)
    const allEntries = await ctx.db.query("searchIndex").collect();
    
    // 2. Normalize query for case-insensitive matching
    const normalizedQuery = normalizeText(args.query);
    const queryTokens = tokenizeText(args.query);
    
    // 3. Score and filter
    const results = allEntries
      .map(entry => ({
        entry,
        score: calculateMatchScore(entry, queryTokens),
        highlights: generateHighlights(entry, queryTokens)
      }))
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score);
    
    return results;
  }
});
```

### 1.2 Generate Navigation URLs
Add URL generation per entity type:
```typescript
function getEntityUrl(entityType: EntityType, entityId: string, year?: number): string {
  const baseRoutes = {
    project: `/dashboard/project/${year || new Date().getFullYear()}`,
    twentyPercentDF: `/dashboard/20_percent_df/${year || new Date().getFullYear()}`,
    trustFund: `/dashboard/trust-funds/${year || new Date().getFullYear()}`,
    specialEducationFund: `/dashboard/special-education-funds/${year || new Date().getFullYear()}`,
    specialHealthFund: `/dashboard/special-health-funds/${year || new Date().getFullYear()}`,
    department: `/dashboard/departments`,
    agency: `/dashboard/office`,
    user: `/dashboard/settings/user-management`
  };
  return baseRoutes[entityType];
}
```

### 1.3 Include Date Metadata
Add to search result:
```typescript
return {
  indexEntry: entry,
  relevanceScore,
  matchedFields,
  highlights,
  sourceUrl: getEntityUrl(entry.entityType, entry.entityId, entry.year),
  metadata: {
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    year: entry.year
  }
};
```

---

## 🎨 Phase 2: Frontend Components (shadcn)

### 2.1 HighlightText Component
```tsx
// components/search/HighlightText.tsx
"use client";

interface HighlightTextProps {
  html: string;
  className?: string;
}

export function HighlightText({ html, className }: HighlightTextProps) {
  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

### 2.2 SearchResultCard Component
```tsx
// components/search/SearchResultCard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { HighlightText } from "./HighlightText";
import type { SearchResult } from "@/convex/search/types";

interface SearchResultCardProps {
  result: SearchResult;
  index: number; // For stagger animation
}

export function SearchResultCard({ result, index }: SearchResultCardProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  
  const entry = result.indexEntry;
  const isDark = false; // Use theme hook
  
  const handleClick = async () => {
    if (!result.sourceUrl) return;
    setIsNavigating(true);
    await router.push(result.sourceUrl);
    // Loading state will clear on page change
  };
  
  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:border-[#15803D]/30",
        "cursor-pointer",
        "animate-fade-in-up",
        isNavigating && "pointer-events-none opacity-70"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={handleClick}
    >
      {/* Loading Overlay */}
      {isNavigating && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader2 className="size-8 animate-spin text-[#15803D]" />
        </div>
      )}
      
      <CardContent className="p-5">
        {/* Header: Type Badge + Match Score */}
        <div className="flex items-center justify-between mb-3">
          <Badge 
            variant="secondary"
            className="bg-[#15803D]/10 text-[#15803D] hover:bg-[#15803D]/20"
          >
            {getEntityTypeLabel(entry.entityType)}
          </Badge>
          
          <span className="text-xs text-muted-foreground">
            {Math.round(result.relevanceScore * 100)}% match
          </span>
        </div>
        
        {/* Title with Highlight */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          <HighlightText html={result.highlights?.primaryText || entry.primaryText} />
        </h3>
        
        {/* Description with Highlight */}
        {entry.secondaryText && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            <HighlightText html={result.highlights?.secondaryText || entry.secondaryText} />
          </p>
        )}
        
        {/* Matched Fields Chips */}
        {result.matchedFields && result.matchedFields.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {result.matchedFields.map((field) => (
              <Badge 
                key={field} 
                variant="outline" 
                className="text-xs border-[#15803D]/30 text-[#15803D]"
              >
                {getFieldLabel(field)}
              </Badge>
            ))}
          </div>
        )}
        
        {/* Date Metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Created: {formatDate(result.metadata?.createdAt)}</span>
          {result.metadata?.updatedAt && (
            <span>Updated: {formatDate(result.metadata.updatedAt)}</span>
          )}
        </div>
      </CardContent>
      
      {/* Footer: Source Link */}
      <CardFooter className="px-5 py-3 bg-muted/50 border-t">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-[#15803D] hover:bg-[#15803D]/10"
          disabled={isNavigating}
        >
          {isNavigating ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <ExternalLink className="size-4 mr-2" />
              View in {getEntityTypeLabel(entry.entityType)}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 2.3 Animation Styles (globals.css)
```css
/* Search Result Card Animations */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cascade-in {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out forwards;
  opacity: 0; /* Start hidden */
}

.animate-cascade {
  animation: cascade-in 0.4s ease-out forwards;
  opacity: 0;
}

/* Highlight Styles */
mark {
  background-color: #fef08a; /* yellow-200 */
  color: #854d0e; /* yellow-900 */
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-weight: 600;
}

.dark mark {
  background-color: #a16207; /* yellow-700 */
  color: #fef9c3; /* yellow-100 */
}

/* Primary Green Theme */
.bg-primary-green {
  background-color: #15803D;
}

.text-primary-green {
  color: #15803D;
}

.border-primary-green {
  border-color: #15803D;
}
```

---

## 🔧 Phase 3: Integration

### 3.1 Update SearchResults Component
```tsx
// components/search/SearchResults.tsx
import { SearchResultCard } from "./SearchResultCard";

export function SearchResults({ results, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return <SearchResultsSkeleton />;
  }
  
  if (results.length === 0) {
    return <NoResultsState />;
  }
  
  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <SearchResultCard 
          key={`${result.indexEntry.entityType}-${result.indexEntry.entityId}`}
          result={result}
          index={index}
        />
      ))}
    </div>
  );
}
```

### 3.2 Mobile Responsive Layout
```tsx
// app/(dashboard)/search/page.tsx
export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile: Stack layout */}
      {/* Desktop: Sidebar on right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <main className="order-2 lg:order-1">
          <SearchResults />
        </main>
        
        <aside className="order-1 lg:order-2">
          {/* Mobile: Horizontal scroll chips */}
          {/* Desktop: Vertical sidebar */}
          <CategorySidebar />
        </aside>
      </div>
    </div>
  );
}
```

---

## 📱 Phase 4: Mobile Optimization

### 4.1 Responsive Breakpoints
```css
/* Mobile First Approach */
/* Default: Mobile */
.search-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* Tablet: 768px+ */
@media (min-width: 768px) {
  .search-grid {
    grid-template-columns: 1fr 240px;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .search-grid {
    grid-template-columns: 1fr 280px;
    gap: 2rem;
  }
}
```

### 4.2 Touch-Friendly Cards
```css
.search-result-card {
  /* Larger touch targets on mobile */
  min-height: 120px;
  padding: 1rem;
}

@media (min-width: 768px) {
  .search-result-card {
    min-height: auto;
    padding: 1.5rem;
  }
}
```

---

## 🧪 Phase 5: Testing Checklist

### Functional Tests
- [ ] Search "BOOM" returns the project
- [ ] Search "LJ" returns the project
- [ ] Search "NICE" returns special education/health funds
- [ ] Clicking result navigates to correct page
- [ ] Loading state shows during navigation
- [ ] Highlight appears on matched text
- [ ] Date metadata displays correctly

### Responsive Tests
- [ ] Mobile: Cards stack vertically
- [ ] Tablet: Sidebar collapses to horizontal chips
- [ ] Desktop: Sidebar fixed on right
- [ ] Touch: Cards are easy to tap

### Accessibility Tests
- [ ] Screen reader announces results
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Color contrast meets WCAG 2.1

---

## 📁 File Structure

```
app/(dashboard)/search/
├── page.tsx                    # Main search page
├── layout.tsx                  # Sticky breadcrumb layout
└── loading.tsx                 # Loading skeleton

components/search/
├── SearchInput.tsx             # shadcn Input with suggestions
├── SearchResults.tsx           # Results list container
├── SearchResultCard.tsx        # Individual result card ⭐
├── HighlightText.tsx           # Text highlighting component ⭐
├── CategorySidebar.tsx         # Filter sidebar
├── NoResultsState.tsx          # Empty state
└── SearchResultSkeleton.tsx    # Loading skeleton

convex/search/
├── index.ts                    # Main search query (fixed)
├── ranking.ts                  # Relevance scoring
├── types.ts                    # Type definitions (updated)
└── reindex.ts                  # Reindexing utilities

hooks/search/
├── useInfiniteSearch.ts        # Search hook (updated)
└── useCategoryFilter.ts        # Filter hook

app/globals.css                 # Animation & highlight styles ⭐
```

---

## 🚀 Execution Order

1. **Fix Backend** (1 hour)
   - Debug why "BOOM" isn't appearing
   - Ensure ALL entities are indexed
   - Add source URL generation

2. **Create Components** (2 hours)
   - HighlightText
   - SearchResultCard (with animations)
   - Update SearchResults

3. **Styling** (1 hour)
   - Add animations to globals.css
   - Configure #15803D theme
   - Dark mode support

4. **Integration** (1 hour)
   - Wire up click handlers
   - Add loading states
   - Mobile responsive

5. **Testing** (1 hour)
   - Verify "BOOM" appears
   - Test all entity types
   - Mobile testing

**Total Estimated Time**: 6 hours

---

## ✅ Success Criteria

1. **Search "BOOM"** → Shows project with "BOOM" highlighted
2. **Click result** → Navigates to `/dashboard/project/2026` with loading state
3. **Search "NICE"** → Shows Special Education/Health funds
4. **Mobile view** → Cards stack, filters become horizontal chips
5. **Dark mode** → Green #15803D accents, proper contrast

---

**Ready for execution upon approval** ✅

*This plan was crafted by the Google Search Retired Team with input from:*
- @TEAM_LEAD (Dr. Sarah Chen) - Architecture
- @BACKEND_ARCHITECT (James O'Brien) - Indexing fixes
- @UX_SEARCH_DESIGNER (Kenji Tanaka) - Card design
- @QA_SEARCH_SPECIALIST (David Kumar) - Test plan
