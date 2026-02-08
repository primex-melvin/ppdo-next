# Search Engine Developer Guide

> A comprehensive guide for developers implementing or maintaining the PPDO Search System.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Quick Start](#quick-start)
3. [Implementation Details](#implementation-details)
4. [Lessons Learned](#lessons-learned)
5. [What Didn't Work](#what-didnt-work)
6. [Best Practices](#best-practices)
7. [Future Recommendations](#future-recommendations)
8. [Cross-Framework Adaptation](#cross-framework-adaptation)

---

## Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14 (App Router) | React framework with server components |
| State Management | URL params + React hooks | URL-first state for shareability |
| Backend | Convex | Real-time database with TypeScript functions |
| Search Index | Custom polymorphic index | Multi-entity search with ranking |
| Testing | Playwright | End-to-end verification |

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Search System Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ SearchInput │───►│ useSearch   │───►│ Convex API  │     │
│  │  Component  │    │   Router    │    │   Queries   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                            │                   │            │
│                            ▼                   ▼            │
│                    ┌─────────────┐    ┌─────────────┐      │
│                    │ URL State   │    │ Search      │      │
│                    │ (?q=&cat=)  │    │ Index Table │      │
│                    └─────────────┘    └─────────────┘      │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Category    │◄───│ useCategory │◄───│ Ranking     │     │
│  │  Sidebar    │    │   Filter    │    │ Algorithm   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Search      │◄───│ useInfinite │◄───│ Pagination  │     │
│  │  Results    │    │   Search    │    │ Cursor      │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Basic Search Implementation

```typescript
// In your page component
import { useSearchRouter } from "@/hooks/search/useSearchRouter";
import { useInfiniteSearch } from "@/hooks/search/useInfiniteSearch";
import { useCategoryFilter } from "@/hooks/search/useCategoryFilter";

export default function SearchPage() {
  // URL-first state management
  const { state, setQuery, setCategory } = useSearchRouter();

  // Fetch search results with pagination
  const { results, isLoading, hasMore, loadMore } = useInfiniteSearch({
    query: state.query,
    category: state.category,
    pageSize: 20,
  });

  // Category counts for sidebar
  const { counts, activeCategory } = useCategoryFilter({
    query: state.query,
  });

  return (
    <div>
      <SearchInput value={state.query} onChange={setQuery} />
      <SearchResults results={results} isLoading={isLoading} />
      <CategorySidebar counts={counts} onSelect={setCategory} />
    </div>
  );
}
```

### 2. Adding Error Handling

```typescript
import { useSearchError } from "@/hooks/search/useSearchError";
import { NetworkErrorState } from "@/components/search/errors";

const { error, isRetrying, handleError, retry } = useSearchError({
  maxRetries: 3,
  baseDelay: 1000,
});

// Display error state
if (error) {
  return <NetworkErrorState onRetry={retry} isRetrying={isRetrying} />;
}
```

---

## Implementation Details

### Search Index Schema (Convex)

```typescript
// convex/schema.ts
searchIndex: defineTable({
  entityId: v.id("projects"), // or other entity table
  entityType: v.union(
    v.literal("project"),
    v.literal("department"),
    v.literal("user"),
    // ... other types
  ),
  primaryText: v.string(),      // Title or name
  secondaryText: v.string(),    // Description
  normalizedText: v.string(),   // Lowercase, tokenized
  tokens: v.array(v.string()),  // Searchable tokens
  departmentId: v.optional(v.id("departments")),
  createdAt: v.number(),
  updatedAt: v.number(),
  accessCount: v.number(),
  isDeleted: v.boolean(),
})
  .index("by_normalized_text", ["normalizedText"])
  .index("by_entity_type", ["entityType"])
  .index("by_department", ["departmentId"])
  .searchIndex("search_text", {
    searchField: "normalizedText",
    filterFields: ["entityType", "isDeleted"],
  })
```

### Ranking Algorithm

```typescript
// convex/search/ranking.ts
export function calculateRelevance(params: {
  query: string;
  document: SearchIndexEntry;
  userContext?: { departmentId: string };
}): number {
  // 1. TF-IDF Score (50% weight)
  const tfIdf = calculateTFIDF(params.query, params.document);

  // 2. Organizational Proximity (30% weight)
  const proximity = calculateProximity(
    params.document.departmentId,
    params.userContext?.departmentId
  );

  // 3. Recency Score (20% weight)
  const recency = calculateRecencyScore(params.document.updatedAt);

  return (tfIdf * 0.5) + (proximity * 0.3) + (recency * 0.2);
}
```

---

## Lessons Learned

### What Worked Well

1. **URL-First State Management**
   - Enables deep linking and sharing
   - Browser back/forward works naturally
   - State persists across page refreshes
   - Simplifies state synchronization

2. **Polymorphic Index**
   - Single table for all entity types
   - Efficient category filtering
   - Unified ranking across types
   - Easy to add new entity types

3. **Debounced Input (300ms)**
   - Reduces unnecessary API calls
   - Smooth user experience
   - Good balance between responsiveness and efficiency

4. **Category Sidebar with Counts**
   - Users can quickly see result distribution
   - Zero-count categories help set expectations
   - Instant filtering improves UX

5. **Convex Real-Time Updates**
   - Index updates immediately reflect in results
   - No cache invalidation complexity
   - Type-safe queries and mutations

### Performance Optimizations That Made a Difference

| Optimization | Impact |
|-------------|--------|
| Offset-based pagination | Consistent performance at any position |
| Pre-computed base scores | Faster ranking during search |
| Token-based matching | Flexible partial word matching |
| Intersection Observer for infinite scroll | No button clicks needed |

---

## What Didn't Work

### 1. Cursor-Based Pagination (Initially)

**Problem:** Cursor pagination became inconsistent when:
- New items were added to the index
- Items were deleted mid-scroll
- Category filters changed

**Solution:** Switched to offset-based pagination with total count tracking.

### 2. Client-Side Filtering

**Problem:** Filtering thousands of results client-side caused:
- Memory issues on mobile devices
- UI jank during filter operations
- Inconsistent counts

**Solution:** All filtering done server-side with category counts query.

### 3. Complex Fuzzy Matching

**Problem:** Advanced fuzzy matching algorithms:
- Added significant latency (300-500ms)
- False positives confused users
- Hard to tune for Filipino names and terms

**Solution:** Simple prefix matching with normalized text works better for this use case.

### 4. Real-Time Search (No Debounce)

**Problem:** Searching on every keystroke caused:
- API rate limiting
- Flickering results
- Poor mobile experience

**Solution:** 300ms debounce provides good balance.

---

## Best Practices

### 1. Index Design

```typescript
// DO: Pre-compute searchable text
const normalizedText = normalizeText(title + " " + description);
const tokens = tokenizeText(normalizedText);

// DON'T: Compute during search
// This is too slow for real-time search
```

### 2. Error Handling

```typescript
// DO: Provide specific error states
if (error.type === SearchErrorType.NETWORK_ERROR) {
  return <NetworkErrorState onRetry={retry} />;
}

// DON'T: Generic error messages
// "Something went wrong" is not helpful
```

### 3. Loading States

```typescript
// DO: Show skeleton for initial load, inline for "load more"
if (isLoading && results.length === 0) {
  return <SearchSkeleton count={5} />;
}

// DON'T: Full page spinner for every state change
```

### 4. Mobile Responsiveness

```typescript
// DO: Use responsive sidebar (Sheet on mobile, fixed on desktop)
<div className="hidden lg:block">
  <CategorySidebar />
</div>
<Sheet> {/* Mobile only */}
  <CategorySidebar className="relative" />
</Sheet>
```

### 5. Accessibility

```typescript
// DO: Proper ARIA labels and keyboard navigation
<input
  aria-label="Search projects, departments, and users"
  role="searchbox"
  onKeyDown={handleKeyboardNavigation}
/>
```

---

## Future Recommendations

### Short-Term Improvements

1. **Search Analytics**
   - Track popular queries
   - Measure click-through rates
   - Identify zero-result queries

2. **Query Suggestions**
   - "Did you mean...?" for typos
   - Popular searches
   - Recent user searches

3. **Advanced Filters**
   - Date range filtering
   - Status filtering
   - Department hierarchy filtering

### Long-Term Enhancements

1. **Vector Search**
   - Semantic search using embeddings
   - Better handling of synonyms
   - Cross-language support (Filipino/English)

2. **Search Personalization**
   - Boost results from user's department
   - Learn from click patterns
   - Saved searches

3. **Federated Search**
   - Search across multiple systems
   - External API integration
   - Document search (PDFs, attachments)

### Performance Scaling

1. **Sharding Strategy**
   - Shard by entity type for horizontal scaling
   - Consider separate indexes for high-volume types
   - Archive old data to reduce index size

2. **Caching Layer**
   - Cache popular queries
   - Pre-warm common searches
   - Edge caching for static results

---

## Cross-Framework Adaptation

### The Core Pattern

The PPDO Search System architecture can be adapted to other frameworks. The key concepts are:

1. **URL-First State** (Framework-agnostic)
2. **Polymorphic Index** (Database pattern)
3. **Multi-Factor Ranking** (Algorithm)
4. **Category Sidebar UI** (Component pattern)

### Adaptation Guide

#### React (Vite, CRA)

```typescript
// Replace Next.js router with react-router
import { useSearchParams } from 'react-router-dom';

function useSearchRouter() {
  const [searchParams, setSearchParams] = useSearchParams();

  const setQuery = (query: string) => {
    setSearchParams({ ...Object.fromEntries(searchParams), q: query });
  };

  return { query: searchParams.get('q') || '', setQuery };
}
```

#### Vue.js

```typescript
// Use Vue Router
import { useRoute, useRouter } from 'vue-router';

export function useSearchRouter() {
  const route = useRoute();
  const router = useRouter();

  const setQuery = (query: string) => {
    router.push({ query: { ...route.query, q: query } });
  };

  return { query: route.query.q as string || '', setQuery };
}
```

#### Angular

```typescript
// Use ActivatedRoute and Router
@Injectable()
export class SearchRouterService {
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  get query$() {
    return this.route.queryParams.pipe(
      map(params => params['q'] || '')
    );
  }

  setQuery(query: string) {
    this.router.navigate([], { queryParams: { q: query } });
  }
}
```

#### Svelte

```typescript
// Use SvelteKit's page store
import { page } from '$app/stores';
import { goto } from '$app/navigation';

export function useSearchRouter() {
  const query = derived(page, $page => $page.url.searchParams.get('q') || '');

  function setQuery(q: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('q', q);
    goto(url.toString());
  }

  return { query, setQuery };
}
```

### Backend Alternatives

| Backend | Implementation Notes |
|---------|---------------------|
| **Supabase** | Use full-text search with `to_tsvector` and `to_tsquery` |
| **Firebase** | Use Algolia or ElasticSearch for complex search |
| **MongoDB** | Use text indexes with `$text` queries |
| **PostgreSQL** | Native full-text search with ranking |
| **Elasticsearch** | Best for large-scale search, more complex setup |
| **MeiliSearch** | Simpler alternative to Elasticsearch |
| **Typesense** | Open-source, typo-tolerant search |

### Database-Specific Ranking

```sql
-- PostgreSQL example
SELECT
  id,
  ts_rank(search_vector, query) * 0.5 +
  CASE WHEN department_id = $user_dept THEN 0.3 ELSE 0.1 END +
  (1.0 / (1 + EXTRACT(EPOCH FROM NOW() - updated_at) / 86400)) * 0.2
  AS score
FROM search_index
WHERE search_vector @@ query
ORDER BY score DESC
LIMIT 20;
```

---

## Testing Strategy

### Unit Tests

- Hook behavior (useSearchRouter, useInfiniteSearch)
- Ranking algorithm
- Text normalization

### Integration Tests

- API endpoints (search, categoryCounts, suggestions)
- Index updates on mutations

### E2E Tests (Playwright)

- Full user journey
- Error states
- Mobile responsiveness
- Keyboard navigation

### Performance Tests

- Typeahead latency < 100ms
- Search results < 200ms
- Category switch < 100ms

---

## File Structure Reference

```
hooks/search/
├── useSearchRouter.ts    # URL state management
├── useInfiniteSearch.ts  # Paginated search
├── useCategoryFilter.ts  # Category counts & filtering
└── useSearchError.ts     # Error handling with retry

components/search/
├── SearchInput.tsx       # Debounced input with suggestions
├── SearchResults.tsx     # Result list with infinite scroll
├── CategorySidebar.tsx   # Right sidebar filter
├── SearchSkeleton.tsx    # Loading skeletons
└── errors/
    ├── NetworkErrorState.tsx
    ├── NoResultsState.tsx
    ├── TimeoutErrorState.tsx
    └── RateLimitedState.tsx

convex/search/
├── index.ts             # Main queries & mutations
├── types.ts             # Type definitions
└── ranking.ts           # Relevance algorithm

types/
└── searchErrors.ts      # Error types & messages

lib/
└── searchErrorLogger.ts # Error logging utility

docs/search-system/
├── README.md            # Architecture overview
├── DEVELOPER-GUIDE.md   # This file
├── api-reference.md     # API documentation
├── hooks-reference.md   # Hook documentation
└── error-handling.md    # Error state documentation
```

---

## Troubleshooting

### Common Issues

1. **Search returns no results**
   - Check if entities are indexed
   - Verify index is not filtered by `isDeleted`
   - Check minimum query length (2 chars)

2. **Slow search performance**
   - Check index size
   - Verify database indexes exist
   - Profile ranking algorithm

3. **Category counts don't match results**
   - Ensure counts query uses same filters
   - Check for race conditions

4. **Mobile sidebar not working**
   - Verify Sheet component is imported
   - Check z-index conflicts
   - Test touch events

---

*Guide Version: 1.0 | Last Updated: 2025-02-08*
*For PPDO Search System Phase 7 Completion*
