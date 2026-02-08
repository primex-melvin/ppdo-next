# Search Engine V2 - Enhanced Result Cards Implementation Plan

## 📋 Overview

**Goal**: Enhance search result cards with:
1. **Original Author/Creator Display** - Show who created the item with avatar
2. **"Found in X page" Indicator** - Show navigation depth (1st page, 2nd page, etc.)
3. **Right-Click Context Menu** - shadcn Context Menu for "Copy link" and "Open in new tab"

**Current State**: Search results show basic info with "Created: [date]"
**Target State**: Rich cards with author info, page depth indicator, and context menu actions

---

## 🎯 Requirements

### Functional Requirements
1. Show original item creator's name and avatar in search result cards
2. Clarify "Created:" label means database creation date, not index date
3. Display "Found in [X] page" based on entity type and hierarchy level
4. Right-click context menu with:
   - Copy link
   - Open in new tab
5. Handle cases where creator user has been deleted
6. Maintain performance - minimize database queries

### Page Depth Mapping

| Entity Type | Page Level | Display Text |
|-------------|------------|--------------|
| `budgetItem` | 1st page | "Found in 1st page" |
| `project` | 2nd page | "Found in 2nd page" |
| `govtProjectBreakdown` | 3rd page | "Found in 3rd page" |
| `twentyPercentDF` | 1st page | "Found in 1st page" |
| `twentyPercentDFBreakdown` | 2nd page | "Found in 2nd page" |
| `trustFund` | 1st page | "Found in 1st page" |
| `trustFundBreakdown` | 2nd page | "Found in 2nd page" |
| `specialEducationFund` | 1st page | "Found in 1st page" |
| `specialEducationFundBreakdown` | 2nd page | "Found in 2nd page" |
| `specialHealthFund` | 1st page | "Found in 1st page" |
| `specialHealthFundBreakdown` | 2nd page | "Found in 2nd page" |
| `department` | 1st page | "Found in 1st page" |
| `agency` | 1st page | "Found in 1st page" |
| `user` | 1st page | "Found in 1st page" |

---

## 🏗️ Architecture Design

### Author Info Strategy: Store in Search Index (Denormalized)
**Approach**: When indexing an entity, also fetch and store the creator's basic info (name, avatar URL) in the search index.

**Pros**:
- Single query to get search results with author info
- No additional database lookups during search
- Fast and scalable

**Cons**:
- Denormalized data (author name can get stale if user updates their profile)
- Need to re-index when user profile changes

### Page Depth Strategy: Derived from Entity Type
**Approach**: Create a utility function that maps entity types to their page depth level. No database changes needed.

---

## 📁 Phase 1: Backend Schema Updates

### 1.1 Update Search Index Schema
**File**: `convex/search/types.ts`

```typescript
// Add to SearchIndexEntry interface
export interface SearchIndexEntry {
  // ... existing fields ...
  
  // Author information (denormalized for fast search)
  createdBy: string; // User ID (required)
  authorName?: string; // Denormalized author name
  authorImage?: string; // Denormalized author avatar URL
  
  // Page depth info (optional, for breakdown items)
  parentEntityType?: string; // e.g., "project", "trustFund"
  parentEntityId?: string;   // Parent entity ID
}
```

### 1.2 Update Entity Type to Support Breakdown Types
**File**: `convex/search/types.ts`

```typescript
export type EntityType =
  | "project"
  | "projectBreakdown"      // NEW
  | "twentyPercentDF"
  | "twentyPercentDFBreakdown"  // NEW
  | "trustFund"
  | "trustFundBreakdown"    // NEW
  | "specialEducationFund"
  | "specialEducationFundBreakdown"  // NEW
  | "specialHealthFund"
  | "specialHealthFundBreakdown"     // NEW
  | "department"
  | "agency"
  | "user";
```

### 1.3 Add Page Depth Utility
**File**: `convex/search/types.ts`

```typescript
/**
 * Get the page depth level for an entity type
 * Used to display "Found in X page" in search results
 */
export function getEntityPageDepth(entityType: EntityType): number {
  const depthMap: Record<EntityType, number> = {
    // 1st page items (list views)
    budgetItem: 1,
    twentyPercentDF: 1,
    trustFund: 1,
    specialEducationFund: 1,
    specialHealthFund: 1,
    department: 1,
    agency: 1,
    user: 1,
    
    // 2nd page items (detail views)
    project: 2,
    twentyPercentDFBreakdown: 2,
    trustFundBreakdown: 2,
    specialEducationFundBreakdown: 2,
    specialHealthFundBreakdown: 2,
    
    // 3rd page items (breakdown detail views)
    projectBreakdown: 3,
    govtProjectBreakdown: 3,
  };
  
  return depthMap[entityType] || 1;
}

/**
 * Get display text for page depth
 */
export function getPageDepthDisplay(entityType: EntityType): string {
  const depth = getEntityPageDepth(entityType);
  const suffixes: Record<number, string> = {
    1: "1st",
    2: "2nd",
    3: "3rd",
  };
  return `Found in ${suffixes[depth] || `${depth}th`} page`;
}
```

---

## 📁 Phase 2: Update Indexing Logic

### 2.1 Modify Index Entity Function
**File**: `convex/search/index.ts`

Update `indexEntity` function to accept and store author information:

```typescript
export async function indexEntity(
  ctx: MutationCtx,
  args: {
    entityType: EntityType;
    entityId: string;
    primaryText: string;
    secondaryText?: string;
    departmentId?: string;
    status?: string;
    year?: number;
    isDeleted?: boolean;
    createdBy: string; // Required - original creator
    createdAt: number; // Original creation timestamp
    updatedAt: number; // Original update timestamp
    parentEntityType?: string; // Optional - for breakdown items
    parentEntityId?: string;   // Optional - for breakdown items
  }
) {
  // Fetch author info if createdBy is provided
  let authorName: string | undefined;
  let authorImage: string | undefined;
  
  if (args.createdBy) {
    const user = await ctx.db.get(args.createdBy as Id<"users">);
    if (user) {
      authorName = user.name || user.email || "Unknown";
      authorImage = user.image;
    }
  }
  
  // Store in search index with author info
  const indexEntry = await ctx.db.insert("searchIndex", {
    // ... existing fields ...
    createdBy: args.createdBy,
    createdAt: args.createdAt,
    updatedAt: args.updatedAt,
    authorName,
    authorImage,
    parentEntityType: args.parentEntityType,
    parentEntityId: args.parentEntityId,
    // ...
  });
}
```

### 2.2 Update All Entity Indexing Calls

**Files to update**:
- `convex/projects.ts` - Index project creation/updates
- `convex/projectBreakdowns.ts` - Index breakdown items (NEW)
- `convex/twentyPercentDF.ts` - Index 20% DF creation/updates
- `convex/twentyPercentDFBreakdowns.ts` - Index breakdown items (NEW)
- `convex/trustFunds.ts` - Index trust fund creation/updates
- `convex/trustFundBreakdowns.ts` - Index breakdown items (NEW)
- `convex/specialEducationFunds.ts` - Index SEF creation/updates
- `convex/specialEducationFundBreakdowns.ts` - Index breakdown items (NEW)
- `convex/specialHealthFunds.ts` - Index SHF creation/updates
- `convex/specialHealthFundBreakdowns.ts` - Index breakdown items (NEW)
- `convex/departments.ts` - Index department creation/updates
- `convex/implementingAgencies.ts` - Index agency creation/updates
- `convex/userManagement.ts` - Index user creation/updates

**Example for breakdown item**:
```typescript
await indexEntity(ctx, {
  entityType: "trustFundBreakdown",
  entityId: breakdownId,
  primaryText: breakdown.description,
  parentEntityType: "trustFund",
  parentEntityId: breakdown.trustFundId,
  createdBy: breakdown.createdBy,
  createdAt: breakdown.createdAt,
  updatedAt: breakdown.updatedAt,
  // ...
});
```

---

## 📁 Phase 3: Create Re-indexing for Author Updates

### 3.1 User Profile Update Handler
**File**: `convex/users.ts` or `convex/search/reindex.ts`

```typescript
export const updateAuthorInfo = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find all search index entries by this user
    const entries = await ctx.db
      .query("searchIndex")
      .withIndex("createdBy", (q) => q.eq("createdBy", args.userId))
      .collect();
    
    // Update author info on all entries
    for (const entry of entries) {
      await ctx.db.patch(entry._id, {
        authorName: args.name,
        authorImage: args.image,
      });
    }
    
    return { updatedCount: entries.length };
  },
});
```

### 3.2 Add Index for createdBy
**File**: `convex/schema.ts` (in searchIndex table definition)

```typescript
searchIndex: defineTable({
  // ... fields ...
  createdBy: v.id("users"),
  authorName: v.optional(v.string()),
  authorImage: v.optional(v.string()),
  parentEntityType: v.optional(v.string()),
  parentEntityId: v.optional(v.string()),
  // ...
})
  .index("createdBy", ["createdBy"])
  // ... existing indexes ...
```

---

## 📁 Phase 4: Frontend Updates - SearchResultCard Enhancement

### 4.1 Install shadcn Context Menu
```bash
npx shadcn add context-menu
```

### 4.2 Update SearchResultCard Component
**File**: `components/search/SearchResultCard.tsx`

```tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, User, Link as LinkIcon, FileText } from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

import type { SearchApiResult, EntityType } from "@/convex/search/types";
import { getPageDepthDisplay } from "@/convex/search/types";

// ... helper functions ...

interface SearchResultCardProps {
  result: SearchApiResult;
  index: number;
  onClick?: () => void;
}

export function SearchResultCard({ result, index, onClick }: SearchResultCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const { indexEntry, highlights, matchedFields, sourceUrl } = result;
  const { 
    entityType, 
    primaryText, 
    secondaryText, 
    createdAt, 
    updatedAt,
    authorName,
    authorImage 
  } = indexEntry;
  
  // Get page depth display text
  const pageDepthText = getPageDepthDisplay(entityType);
  
  // Handle card click
  const handleClick = () => {
    if (isLoading || !sourceUrl) return;
    setIsLoading(true);
    router.push(sourceUrl);
  };
  
  // Handle copy link
  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sourceUrl) {
      await navigator.clipboard.writeText(`${window.location.origin}${sourceUrl}`);
      // Could show toast here
    }
  };
  
  // Handle open in new tab
  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sourceUrl) {
      window.open(sourceUrl, "_blank", "noopener,noreferrer");
    }
  };
  
  const animationDelay = `${index * 100}ms`;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          className={cn(
            "relative cursor-pointer transition-all duration-300",
            "min-h-[120px] sm:min-h-[140px]",
            "hover:shadow-lg hover:border-[#15803D]/30",
            "animate-fade-in-up",
            "touch-manipulation",
            isLoading && "pointer-events-none opacity-80"
          )}
          style={{ animationDelay }}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          aria-label={`Search result: ${primaryText}`}
        >
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-black/50 rounded-xl">
              <div className="flex items-center gap-2 text-[#15803D]">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Opening...</span>
              </div>
            </div>
          )}
          
          {/* Card Header */}
          <div className="px-3 sm:px-6 pt-3 sm:pt-5 pb-2">
            <div className="flex items-center justify-between gap-3">
              {/* Entity Type Badge + Page Depth */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="bg-[#15803D]/10 text-[#15803D] hover:bg-[#15803D]/20 font-medium text-xs sm:text-sm"
                >
                  {getEntityTypeLabel(entityType)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {pageDepthText}
                </span>
              </div>
              
              {/* Match Score */}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <span className="font-medium text-[#15803D]">
                  {Math.round(result.relevanceScore * 100)}%
                </span>
                <span>match</span>
              </div>
            </div>
          </div>
          
          {/* Card Content */}
          <CardContent className="px-3 sm:px-6 py-2 space-y-3">
            {/* Title */}
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold leading-snug line-clamp-2">
              {highlights?.primaryText ? (
                <HighlightText html={highlights.primaryText} />
              ) : (
                primaryText
              )}
            </h3>
            
            {/* Description */}
            {(highlights?.secondaryText || secondaryText) && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {highlights?.secondaryText ? (
                  <HighlightText html={highlights.secondaryText} />
                ) : (
                  secondaryText
                )}
              </p>
            )}
            
            {/* Matched Fields */}
            {matchedFields && matchedFields.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Matched in:</span>
                {matchedFields.slice(0, 3).map((field) => (
                  <Badge
                    key={field}
                    variant="outline"
                    className="text-xs font-normal px-2 py-0.5"
                  >
                    {getFieldLabel(field)}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Author & Date Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pt-1">
              {/* Creation Date */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>Created: {formatDate(createdAt)}</span>
              </div>
              
              {/* Author Info */}
              {authorName && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="hidden sm:inline">•</span>
                  <span>by</span>
                  {authorImage ? (
                    <img 
                      src={authorImage} 
                      alt={authorName}
                      className="w-4 h-4 rounded-full border border-stone-200"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-stone-200 flex items-center justify-center">
                      <User className="w-2.5 h-2.5 text-stone-500" />
                    </div>
                  )}
                  <span className="font-medium">{authorName}</span>
                </div>
              )}
              
              {/* Updated Date (if different) */}
              {updatedAt !== createdAt && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>•</span>
                  <span>Updated: {formatDate(updatedAt)}</span>
                </div>
              )}
            </div>
            
            {/* Source URL */}
            {sourceUrl && sourceUrl !== "#" && (
              <div className="pt-1 flex items-center gap-1.5">
                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate font-mono">
                  {sourceUrl}
                </span>
              </div>
            )}
          </CardContent>
          
          {/* Card Footer */}
          <CardFooter className="px-3 sm:px-6 pt-2 pb-3 sm:pb-5">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-full sm:w-auto",
                "h-11 sm:h-9",
                "text-xs sm:text-sm",
                "border-[#15803D]/30 text-[#15803D] hover:bg-[#15803D]/10",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
              disabled={isLoading || !sourceUrl}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </ContextMenuTrigger>
      
      {/* Context Menu */}
      <ContextMenuContent className="w-48">
        <ContextMenuItem 
          onClick={handleCopyLink}
          disabled={!sourceUrl}
          className="cursor-pointer"
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          Copy link
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={handleOpenInNewTab}
          disabled={!sourceUrl}
          className="cursor-pointer"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Open in new tab
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem 
          onClick={handleClick}
          disabled={!sourceUrl}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4" />
          View details
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

---

## 📁 Phase 5: Data Migration

### 5.1 Backfill Existing Search Index
**File**: `convex/search/reindex.ts`

```typescript
export const backfillAuthorInfo = mutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 100;
    const entries = await ctx.db
      .query("searchIndex")
      .filter((q) => q.eq(q.field("authorName"), undefined))
      .take(batchSize);
    
    for (const entry of entries) {
      const user = await ctx.db.get(entry.createdBy as Id<"users">);
      if (user) {
        await ctx.db.patch(entry._id, {
          authorName: user.name || user.email || "Unknown",
          authorImage: user.image,
        });
      }
    }
    
    return { processedCount: entries.length };
  },
});
```

---

## 📁 Phase 6: Testing Checklist

### Backend Tests
- [ ] Index new entity with author info
- [ ] Index breakdown items with parentEntityType/parentEntityId
- [ ] Re-index existing entity updates author info
- [ ] User profile update propagates to search index
- [ ] Search results include author info and page depth
- [ ] Deleted users show "Unknown" author

### Frontend Tests
- [ ] Author name and avatar display correctly
- [ ] "Found in X page" shows correct depth
- [ ] Page depth badge displays for all entity types
- [ ] Context menu appears on right-click
- [ ] Copy link works and copies full URL
- [ ] Open in new tab works
- [ ] Mobile: Context menu works on long-press
- [ ] Dark mode styling for all new elements

### Performance Tests
- [ ] Search query latency < 200ms with author info
- [ ] Context menu doesn't delay card rendering
- [ ] Re-indexing doesn't block other operations

---

## 📁 File Structure Changes

```
convex/search/
├── index.ts              # Update indexEntity to store author
├── types.ts              # Add author fields, page depth utilities
├── reindex.ts            # Add backfillAuthorInfo mutation

convex/
├── projects.ts           # Pass createdBy to indexEntity
├── projectBreakdowns.ts  # Index breakdown items (NEW/UPDATE)
├── twentyPercentDF.ts    # Pass createdBy to indexEntity
├── twentyPercentDFBreakdowns.ts  # Index breakdown items (NEW/UPDATE)
├── trustFunds.ts         # Pass createdBy to indexEntity
├── trustFundBreakdowns.ts # Index breakdown items (NEW/UPDATE)
├── specialEducationFunds.ts  # Pass createdBy to indexEntity
├── specialEducationFundBreakdowns.ts  # Index breakdown items (NEW/UPDATE)
├── specialHealthFunds.ts     # Pass createdBy to indexEntity
├── specialHealthFundBreakdowns.ts  # Index breakdown items (NEW/UPDATE)
├── departments.ts        # Pass createdBy to indexEntity
├── implementingAgencies.ts   # Pass createdBy to indexEntity
├── users.ts              # Add author update trigger

components/search/
├── SearchResultCard.tsx  # Add author, page depth, context menu
├── index.ts              # Export new utilities

components/ui/
├── context-menu.tsx      # shadcn context menu component

app/globals.css           # Add author avatar styles
```

---

## ⏱️ Updated Estimated Timeline

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Schema updates (author + page depth) | 45 min |
| 2 | Update indexing logic for all entities | 3 hours |
| 3 | Re-indexing handlers | 1 hour |
| 4 | Frontend updates (author + page depth + context menu) | 2 hours |
| 5 | Data migration | 30 min |
| 6 | Testing | 1.5 hours |
| **Total** | | **~9 hours** |

---

## ⚠️ Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Stale author data | Medium | Implement user update trigger to re-index |
| Performance degradation | Low | Denormalized approach avoids N+1 queries |
| Missing author for legacy data | Low | Backfill migration + "Unknown" fallback |
| Large re-indexing job | Medium | Batch processing in chunks |
| Breakdown items not indexed | High | Need to ensure all breakdown types are indexed |
| Context menu accessibility | Low | Ensure keyboard navigation works |

---

## ✅ Success Criteria

1. ✅ Every search result card shows the original item creator's name and avatar
2. ✅ "Created:" is understood as database creation date (with icon)
3. ✅ "Found in X page" displays correctly for all entity types
4. ✅ Right-click context menu shows Copy link, Open in new tab
5. ✅ Context menu actions work correctly
6. ✅ No noticeable performance degradation
7. ✅ Works for all entity types including breakdowns
8. ✅ Handles deleted users gracefully (shows "Unknown")
9. ✅ Mobile responsive (context menu on long-press)
10. ✅ Dark mode support for all new UI elements

---

## 📋 Card Layout Preview

```
┌─────────────────────────────────────────────────────────┐
│ [Badge: Trust Fund]    Found in 1st page    85% match   │
│                                                         │
│ Title with <mark>highlight</mark>                       │
│ Description preview...                                  │
│                                                         │
│ Matched in: [Title] [Description]                       │
│                                                         │
│ 📄 Created: Feb 8, 2026 by 👤 John Doe                  │
│ 🔗 /dashboard/trust-funds/2026                          │
│                                                         │
│ [Open Button]                                           │
└─────────────────────────────────────────────────────────┘

Right-click Menu:
┌─────────────────────┐
│ 📋 Copy link        │
│ 🔗 Open in new tab  │
│ ─────────────────── │
│ 📄 View details     │
└─────────────────────┘
```

---

**Status**: Ready for implementation approval  
**Next Step**: Await go signal from product owner
