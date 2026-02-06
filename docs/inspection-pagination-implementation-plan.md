# Inspection Pagination - Implementation Plan

## Overview
Implement **backend pagination with search** for the Inspection table to handle large datasets efficiently (>1000 records).

---

## Current State

### Frontend (Current)
```typescript
// Loads ALL inspections at once
const inspections = useQuery(api.inspections.listInspectionsByProject, {
  projectId,
});
```

### Backend (Current)
```typescript
// Returns ALL inspections for a project (no pagination)
export const listInspectionsByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    return await ctx.db
      .query("inspections")
      .withIndex("by_project", q => q.eq("projectId", projectId))
      .order("desc")
      .collect();
  },
});
```

---

## Target Architecture

### 1. Backend Changes (Convex)

#### A. Update `listInspectionsByProject` Query
Add cursor-based pagination with search support:

```typescript
export const listInspectionsByProjectPaginated = query({
  args: {
    projectId: v.id("projects"),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()), // default: 20
    searchQuery: v.optional(v.string()),
    sortField: v.optional(v.string()), // "inspectionDateTime" | "title" | "status"
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const { projectId, cursor, limit = 20, searchQuery } = args;
    
    // Build base query
    let query = ctx.db
      .query("inspections")
      .withIndex("by_project", q => q.eq("projectId", projectId));
    
    // Apply cursor pagination
    if (cursor) {
      const cursorData = JSON.parse(cursor);
      query = query.filter(q => q.lt("_creationTime", cursorData.timestamp));
    }
    
    // Fetch results + 1 to determine if there's a next page
    const results = await query.order("desc").take(limit + 1);
    
    const hasMore = results.length > limit;
    const inspections = hasMore ? results.slice(0, -1) : results;
    
    // Generate next cursor
    const nextCursor = hasMore && inspections.length > 0
      ? JSON.stringify({ 
          timestamp: inspections[inspections.length - 1]._creationTime,
          id: inspections[inspections.length - 1]._id 
        })
      : undefined;
    
    return {
      inspections,
      nextCursor,
      hasMore,
    };
  },
});
```

#### B. Add Search Query (Separate for Performance)
Use Convex search index for full-text search:

```typescript
export const searchInspections = query({
  args: {
    projectId: v.id("projects"),
    searchQuery: v.string(),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { projectId, searchQuery, cursor, limit = 20 }) => {
    // Use Convex search if available, or filter manually
    const allInspections = await ctx.db
      .query("inspections")
      .withIndex("by_project", q => q.eq("projectId", projectId))
      .filter(q => 
        q.or(
          q.contains(q.field("title"), searchQuery),
          q.contains(q.field("remarks"), searchQuery),
          q.contains(q.field("programNumber"), searchQuery)
        )
      )
      .order("desc")
      .collect();
    
    // Manual pagination on filtered results
    const startIndex = cursor ? parseInt(cursor) : 0;
    const results = allInspections.slice(startIndex, startIndex + limit + 1);
    const hasMore = results.length > limit;
    
    return {
      inspections: hasMore ? results.slice(0, -1) : results,
      nextCursor: hasMore ? String(startIndex + limit) : undefined,
      hasMore,
      totalCount: allInspections.length,
    };
  },
});
```

#### C. Add Count Query (for Pagination UI)
```typescript
export const getInspectionsCount = query({
  args: {
    projectId: v.id("projects"),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, searchQuery }) => {
    // For accurate counts, we'd need to fetch and filter
    // Or maintain a counter in a separate table
    const inspections = await ctx.db
      .query("inspections")
      .withIndex("by_project", q => q.eq("projectId", projectId))
      .collect();
    
    return inspections.length;
  },
});
```

---

## 2. Frontend Changes (React)

### A. Create `usePaginatedInspections` Hook

```typescript
// hooks/usePaginatedInspections.ts
"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Inspection } from "@/components/features/ppdo/inspection/types";

interface UsePaginatedInspectionsOptions {
  projectId: Id<"projects"> | undefined;
  pageSize?: number;
}

interface UsePaginatedInspectionsReturn {
  inspections: Inspection[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalCount?: number;
}

export function usePaginatedInspections({
  projectId,
  pageSize = 20,
}: UsePaginatedInspectionsOptions): UsePaginatedInspectionsReturn {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [allInspections, setAllInspections] = useState<Inspection[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Determine which query to use based on search
  const queryArgs = searchQuery.trim()
    ? {
        projectId: projectId!,
        searchQuery: searchQuery.trim(),
        limit: pageSize,
        cursor,
      }
    : {
        projectId: projectId!,
        limit: pageSize,
        cursor,
      };

  const { data, isLoading } = useQuery(
    searchQuery.trim()
      ? api.inspections.searchInspections
      : api.inspections.listInspectionsByProjectPaginated,
    projectId ? queryArgs : "skip"
  );

  // Reset when search changes
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    setCursor(undefined);
    setAllInspections([]);
  }, []);

  // Load more data
  const loadMore = useCallback(() => {
    if (data?.hasMore && data?.nextCursor) {
      setIsLoadingMore(true);
      setCursor(data.nextCursor);
    }
  }, [data]);

  // Refresh data
  const refresh = useCallback(() => {
    setCursor(undefined);
    setAllInspections([]);
  }, []);

  return {
    inspections: data?.inspections || [],
    isLoading: isLoading && !isLoadingMore,
    isLoadingMore,
    hasMore: data?.hasMore || false,
    loadMore,
    refresh,
    searchQuery,
    setSearchQuery: handleSearchChange,
    totalCount: data?.totalCount,
  };
}
```

### B. Update `InspectionTable` Component

Replace standard table with virtualized/paginated table:

```typescript
interface InspectionTableProps {
  projectId: Id<"projects">;
  // Remove: inspections, isLoading
  onAdd?: () => void;
  onEdit?: (inspection: Inspection) => void;
  onDelete?: (inspection: Inspection) => void;
  onView: (inspection: Inspection) => void;
}

export function InspectionTable({
  projectId,
  onAdd,
  onEdit,
  onDelete,
  onView,
}: InspectionTableProps) {
  const {
    inspections,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    searchQuery,
    setSearchQuery,
    totalCount,
  } = usePaginatedInspections({ projectId, pageSize: 25 });

  // Virtual list for smooth scrolling with large datasets
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: hasMore ? inspections.length + 1 : inspections.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52, // row height
    overscan: 5,
  });

  // Load more when scrolling near bottom
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();
    if (!lastItem) return;

    if (
      lastItem.index >= inspections.length - 1 &&
      hasMore &&
      !isLoadingMore
    ) {
      loadMore();
    }
  }, [virtualizer.getVirtualItems(), hasMore, isLoadingMore, loadMore]);

  return (
    <div>
      {/* Search + Toolbar */}
      <GenericTableToolbar>
        <TableSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search inspections..."
          // Debounce search to avoid excessive queries
          debounceMs={300}
        />
        {/* ... other actions ... */}
      </GenericTableToolbar>

      {/* Virtualized Table */}
      <div ref={parentRef} className="h-[600px] overflow-auto">
        <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const isLoaderRow = virtualRow.index > inspections.length - 1;
            const inspection = inspections[virtualRow.index];

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span className="ml-2">Loading more...</span>
                  </div>
                ) : (
                  <InspectionRow
                    inspection={inspection}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination Info */}
      <div className="flex items-center justify-between py-4">
        <span className="text-sm text-zinc-600">
          Showing {inspections.length} of {totalCount || "many"} inspections
        </span>
        {hasMore && (
          <Button onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? "Loading..." : "Load More"}
          </Button>
        )}
      </div>
    </div>
  );
}
```

---

## 3. Alternative: Server-Side Pagination (Page Numbers)

If you prefer traditional page numbers instead of infinite scroll:

```typescript
// Backend: Offset-based pagination
export const listInspectionsByPage = query({
  args: {
    projectId: v.id("projects"),
    page: v.number(),      // 1-based page number
    pageSize: v.number(),  // items per page
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, page, pageSize, searchQuery }) => {
    const skip = (page - 1) * pageSize;
    
    // Get total count for pagination UI
    const allInspections = await ctx.db
      .query("inspections")
      .withIndex("by_project", q => q.eq("projectId", projectId))
      .collect();
    
    const filtered = searchQuery
      ? allInspections.filter(i => 
          i.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allInspections;
    
    const totalPages = Math.ceil(filtered.length / pageSize);
    const inspections = filtered.slice(skip, skip + pageSize);
    
    return {
      inspections,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: filtered.length,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  },
});
```

---

## 4. Implementation Phases

### Phase 1: Backend Setup
1. Add `listInspectionsByProjectPaginated` query
2. Add `searchInspections` query
3. Add database indexes if needed:
   ```typescript
   // In schema.ts - ensure these indexes exist
   inspections: defineTable({
     // ... fields
   })
     .index("by_project", ["projectId"])
     .index("by_project_date", ["projectId", "inspectionDateTime"])
   ```

### Phase 2: Frontend Hook
1. Create `usePaginatedInspections` hook
2. Add debounced search
3. Handle loading states

### Phase 3: Table Component Update
1. Replace static table with virtualized list
2. Add infinite scroll or pagination UI
3. Update search to use backend filtering

### Phase 4: Testing
1. Test with small dataset (< 50)
2. Test with medium dataset (100-500)
3. Test search functionality
4. Test edge cases (empty results, loading states)

---

## 5. Performance Considerations

### Pros of This Approach:
- ✅ Handles unlimited dataset size
- ✅ Faster initial load (only fetches first page)
- ✅ Reduced memory usage on client
- ✅ Search works across entire dataset

### Trade-offs:
- ⚠️ Slightly more complex code
- ⚠️ Search requires backend round-trip
- ⚠️ Sorting requires backend support

---

## 6. Files to Modify

| File | Change Type |
|------|-------------|
| `convex/inspections.ts` | Add new queries |
| `convex/schema.ts` | Verify indexes |
| `hooks/usePaginatedInspections.ts` | New file |
| `components/inspection/_components/InspectionTable.tsx` | Refactor for pagination |
| `page.tsx` | Update to pass projectId only |

---

## 7. Decision Matrix

| Approach | Best For | Complexity | Performance |
|----------|----------|------------|-------------|
| **Current (Client-side)** | < 500 records | Low | Good |
| **Cursor Pagination** | > 500 records, real-time | Medium | Excellent |
| **Offset Pagination** | Traditional page UI | Medium | Good |
| **Search Index** | Full-text search needed | High | Excellent |

---

**Recommendation:** Start with **Cursor Pagination + Infinite Scroll** for best UX with large datasets.

---

*Implementation plan ready. Awaiting "proceed" signal.*
