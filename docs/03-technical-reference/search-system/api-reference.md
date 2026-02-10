# Search System API Reference

> Convex queries, mutations, and TypeScript types for the PPDO Search System.

## Table of Contents

1. [Type Definitions](#type-definitions)
2. [Search Queries](#search-queries)
3. [Index Management Mutations](#index-management-mutations)
4. [Facet Operations](#facet-operations)
5. [Utility Functions](#utility-functions)

---

## Type Definitions

### Core Search Types

```typescript
// convex/search/types.ts

import { v } from "convex/values";

// ============================================================================
// Entity Types
// ============================================================================

export const EntityType = v.union(
  v.literal("project"),
  v.literal("twentyPercentDF"),
  v.literal("trustFund"),
  v.literal("specialEducationFund"),
  v.literal("specialHealthFund")
);

export type EntityType = 
  | "project" 
  | "twentyPercentDF" 
  | "trustFund" 
  | "specialEducationFund" 
  | "specialHealthFund";

// ============================================================================
// Search Index Entry
// ============================================================================

export const SearchIndexEntry = {
  keyword: v.string(),
  entityId: v.string(),
  entityType: EntityType,
  baseScore: v.number(),
  title: v.string(),
  content: v.optional(v.string()),
  metadata: v.record(v.string(), v.any()),
};

export interface SearchIndexEntry {
  keyword: string;
  entityId: string;
  entityType: EntityType;
  baseScore: number;
  title: string;
  content?: string;
  metadata: Record<string, any>;
}

// ============================================================================
// Facet Definitions
// ============================================================================

export const FacetType = v.union(
  v.literal("string"),
  v.literal("number"),
  v.literal("date"),
  v.literal("boolean")
);

export type FacetType = "string" | "number" | "date" | "boolean";

export interface FacetOption {
  value: string;
  label: string;
  count: number;
}

export interface FacetDefinition {
  key: string;
  label: string;
  type: FacetType;
  options: FacetOption[];
}

// ============================================================================
// Search Results
// ============================================================================

export interface SearchResult {
  id: string;
  entityType: EntityType;
  title: string;
  excerpt: string;
  metadata: {
    department?: string;
    status?: string;
    year?: number;
    updatedAt: number;
    [key: string]: any;
  };
  relevanceScore: number;
  highlights: string[]; // Text snippets with matches highlighted
}

export interface SearchResultsPage {
  results: SearchResult[];
  nextCursor: string | null;
  totalCount: number;
  facets: FacetDefinition[];
}

// ============================================================================
// Search Suggestions
// ============================================================================

export interface EntitySuggestion {
  type: "entity";
  entityType: EntityType;
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

export interface KeywordSuggestion {
  type: "keyword";
  keyword: string;
  count: number;
}

export type SearchSuggestion = EntitySuggestion | KeywordSuggestion;

// ============================================================================
// Search Parameters
// ============================================================================

export interface SearchParams {
  query: string;
  filters?: Record<string, string[]>;
  entityTypes?: EntityType[];
  sortBy?: "relevance" | "recent" | "alphabetical";
  cursor?: string;
  limit?: number;
}
```

---

## Search Queries

### Main Search Query

```typescript
// convex/search/index.ts

import { query } from "../_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const search = query({
  args: {
    query: v.string(),
    filters: v.optional(v.record(v.string(), v.array(v.string()))),
    entityTypes: v.optional(v.array(EntityType)),
    sortBy: v.optional(v.union(
      v.literal("relevance"),
      v.literal("recent"),
      v.literal("alphabetical")
    )),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args): Promise<SearchResultsPage> => {
    const { query, filters, entityTypes, sortBy, paginationOpts } = args;
    const userId = await getAuthUserId(ctx);
    
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get user context for relevance scoring
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Normalize query
    const normalizedQuery = normalizeQuery(query);
    const keywords = tokenize(normalizedQuery);

    // Build base query
    let searchResults = await ctx.db
      .query("searchIndex")
      .withIndex("by_keyword", (q) => 
        q.eq("keyword", keywords[0])
      )
      .collect();

    // Filter by entity types if specified
    if (entityTypes && entityTypes.length > 0) {
      searchResults = searchResults.filter((r) =>
        entityTypes.includes(r.entityType)
      );
    }

    // Apply facet filters
    if (filters && Object.keys(filters).length > 0) {
      const filteredIds = await applyFacetFilters(ctx, filters);
      searchResults = searchResults.filter((r) =>
        filteredIds.has(r.entityId)
      );
    }

    // Calculate relevance scores
    const scoredResults = searchResults.map((result) => ({
      ...result,
      finalScore: calculateRelevance({
        query: keywords,
        result,
        userContext: {
          departmentId: user.departmentId,
          role: user.role,
        },
      }),
    }));

    // Sort results
    const sortedResults = sortResults(scoredResults, sortBy ?? "relevance");

    // Apply pagination
    const startIdx = paginationOpts.cursor 
      ? parseInt(paginationOpts.cursor, 10) 
      : 0;
    const endIdx = startIdx + paginationOpts.numItems;
    const pageResults = sortedResults.slice(startIdx, endIdx);

    // Fetch full entities for display
    const results = await Promise.all(
      pageResults.map((r) => 
        hydrateSearchResult(ctx, r, keywords)
      )
    );

    // Get facet counts (deferred in production)
    const facets = await getFacetCounts(ctx, normalizedQuery, filters);

    return {
      results,
      nextCursor: endIdx < sortedResults.length 
        ? String(endIdx) 
        : null,
      totalCount: sortedResults.length,
      facets,
    };
  },
});
```

### Typeahead Suggestions

```typescript
// convex/search/index.ts

export const suggestions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<SearchSuggestion[]> => {
    const { query, limit = 8 } = args;
    
    if (query.length < 2) {
      return [];
    }

    const normalizedQuery = normalizeQuery(query);
    const suggestions: SearchSuggestion[] = [];

    // Entity suggestions (exact prefix matches)
    const entityMatches = await ctx.db
      .query("searchIndex")
      .withIndex("by_keyword", (q) =>
        q.gte("keyword", normalizedQuery).lt("keyword", normalizedQuery + "\xFF")
      )
      .take(limit);

    for (const match of entityMatches) {
      suggestions.push({
        type: "entity",
        entityType: match.entityType,
        id: match.entityId,
        title: match.title,
        subtitle: getEntitySubtitle(match),
        icon: getEntityIcon(match.entityType),
      });
    }

    // Keyword suggestions (if room remains)
    if (suggestions.length < limit) {
      const keywordMatches = await ctx.db
        .query("searchKeywords")
        .withIndex("by_popularity", (q) =>
          q.gte("keyword", normalizedQuery)
        )
        .take(limit - suggestions.length);

      for (const kw of keywordMatches) {
        suggestions.push({
          type: "keyword",
          keyword: kw.keyword,
          count: kw.searchCount,
        });
      }
    }

    return suggestions;
  },
});
```

### Category Counts

```typescript
// convex/search/index.ts

/**
 * Returns the count of search results per category
 * Used for the right sidebar category filter
 */
export const categoryCounts = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args): Promise<Record<string, number>> => {
    const { query } = args;
    const normalizedQuery = normalizeQuery(query);
    const keywords = tokenize(normalizedQuery);

    if (keywords.length === 0) {
      return {};
    }

    // Search for all matching entities
    const searchResults = await ctx.db
      .query("searchIndex")
      .withIndex("by_keyword", (q) => q.eq("keyword", keywords[0]))
      .collect();

    // Group by entity type and count
    const counts: Record<string, number> = {
      project: 0,
      twentyPercentDF: 0,
      trustFund: 0,
      specialEducationFund: 0,
      specialHealthFund: 0,
    };

    for (const result of searchResults) {
      if (counts[result.entityType] !== undefined) {
        counts[result.entityType]++;
      }
    }

    return counts;
  },
});
```

### Available Facets

```typescript
// convex/search/facets.ts

export const availableFacets = query({
  args: {
    query: v.optional(v.string()),
    currentFilters: v.optional(v.record(v.string(), v.array(v.string()))),
  },
  handler: async (ctx, args): Promise<FacetDefinition[]> => {
    const { query, currentFilters } = args;

    // Get all facet keys for current result set
    const facetKeys = ["department", "year", "status", "entityType"];
    const facets: FacetDefinition[] = [];

    for (const key of facetKeys) {
      const options = await getFacetOptions(ctx, key, query, currentFilters);
      
      if (options.length > 0) {
        facets.push({
          key,
          label: getFacetLabel(key),
          type: getFacetType(key),
          options,
        });
      }
    }

    return facets;
  },
});

async function getFacetOptions(
  ctx: QueryContext,
  facetKey: string,
  query?: string,
  currentFilters?: Record<string, string[]>
): Promise<FacetOption[]> {
  // Build filter to exclude current facet
  const otherFilters = { ...currentFilters };
  delete otherFilters[facetKey];

  // Aggregate counts
  const facetEntries = await ctx.db
    .query("searchFacets")
    .withIndex("by_key", (q) => q.eq("facetKey", facetKey))
    .collect();

  // Group by value and count
  const counts = new Map<string, number>();
  for (const entry of facetEntries) {
    const current = counts.get(entry.facetValue) ?? 0;
    counts.set(entry.facetValue, current + 1);
  }

  // Convert to options
  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      label: formatFacetValue(facetKey, value),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 values
}
```

---

## Index Management Mutations

### Index Entity

```typescript
// convex/search/index.ts

export const indexEntity = mutation({
  args: {
    entityId: v.string(),
    entityType: EntityType,
    title: v.string(),
    content: v.optional(v.string()),
    metadata: v.record(v.string(), v.any()),
  },
  handler: async (ctx, args) => {
    const { entityId, entityType, title, content, metadata } = args;

    // Remove existing index entries for this entity
    await ctx.db
      .query("searchIndex")
      .withIndex("by_entity", (q) => 
        q.eq("entityId", entityId)
      )
      .collect()
      .then((entries) => 
        Promise.all(entries.map((e) => ctx.db.delete(e._id)))
      );

    // Tokenize and normalize
    const tokens = tokenize(`${title} ${content ?? ""}`);
    const uniqueTokens = [...new Set(tokens)];

    // Calculate base score
    const baseScore = calculateBaseScore({ title, content, metadata });

    // Create index entries for each token
    await Promise.all(
      uniqueTokens.map((keyword) =>
        ctx.db.insert("searchIndex", {
          keyword: normalizeKeyword(keyword),
          entityId,
          entityType,
          baseScore,
          title,
          content: content?.slice(0, 500), // Truncate for storage
          metadata,
        })
      )
    );

    // Update facet entries
    await updateFacetEntries(ctx, entityId, metadata);
  },
});
```

### Remove from Index

```typescript
// convex/search/index.ts

export const removeFromIndex = mutation({
  args: {
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const { entityId } = args;

    // Remove all search index entries
    const indexEntries = await ctx.db
      .query("searchIndex")
      .withIndex("by_entity", (q) => q.eq("entityId", entityId))
      .collect();

    await Promise.all(
      indexEntries.map((entry) => ctx.db.delete(entry._id))
    );

    // Remove all facet entries
    const facetEntries = await ctx.db
      .query("searchFacets")
      .withIndex("by_entity", (q) => q.eq("entityId", entityId))
      .collect();

    await Promise.all(
      facetEntries.map((entry) => ctx.db.delete(entry._id))
    );
  },
});
```

---

## Facet Operations

### Update Facet Entries

```typescript
// convex/search/facets.ts

export async function updateFacetEntries(
  ctx: MutationContext,
  entityId: string,
  metadata: Record<string, any>
): Promise<void> {
  // Remove existing facets
  const existing = await ctx.db
    .query("searchFacets")
    .withIndex("by_entity", (q) => q.eq("entityId", entityId))
    .collect();

  await Promise.all(existing.map((f) => ctx.db.delete(f._id)));

  // Extract facet values from metadata
  const facets: Array<{
    key: string;
    value: string;
    type: FacetType;
  }> = [];

  if (metadata.departmentId) {
    facets.push({
      key: "department",
      value: metadata.departmentId,
      type: "string",
    });
  }

  if (metadata.fiscalYear || metadata.year) {
    facets.push({
      key: "year",
      value: String(metadata.fiscalYear ?? metadata.year),
      type: "number",
    });
  }

  if (metadata.status) {
    facets.push({
      key: "status",
      value: metadata.status,
      type: "string",
    });
  }

  // Insert new facet entries
  await Promise.all(
    facets.map((f) =>
      ctx.db.insert("searchFacets", {
        entityId,
        facetKey: f.key,
        facetValue: f.value,
        facetType: f.type,
      })
    )
  );
}
```

---

## Utility Functions

### Text Normalization

```typescript
// convex/lib/searchUtils.ts

/**
 * Normalize query text for searching
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .trim();
}

/**
 * Tokenize text into searchable keywords
 */
export function tokenize(text: string): string[] {
  const normalized = normalizeQuery(text);
  
  // Split on whitespace and punctuation
  return normalized
    .split(/[\s\W_]+/)
    .filter((token) => token.length >= 2) // Min 2 chars
    .filter((token) => !STOP_WORDS.has(token)); // Remove stop words
}

/**
 * Normalize individual keyword for index storage
 */
export function normalizeKeyword(keyword: string): string {
  // Stemming could be added here
  return keyword.slice(0, 50); // Max length
}

// Common stop words to exclude from index
const STOP_WORDS = new Set([
  "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
  "by", "from", "as", "is", "was", "are", "be", "this", "that", "a", "an",
  "ang", "ng", "sa", "mga", "na", "at", "ay" // Filipino stop words
]);
```

### Relevance Calculation

```typescript
// convex/search/ranking.ts

interface RelevanceContext {
  query: string[];
  result: SearchIndexEntry;
  userContext: {
    departmentId?: string;
    role?: string;
  };
}

interface RelevanceScore {
  textMatch: number;
  proximity: number;
  recency: number;
  final: number;
}

export function calculateRelevance(ctx: RelevanceContext): number {
  const scores = calculateRelevanceBreakdown(ctx);
  return scores.final;
}

export function calculateRelevanceBreakdown(
  ctx: RelevanceContext
): RelevanceScore {
  const { query, result, userContext } = ctx;

  // Text match score (TF-IDF approximation)
  const textMatch = calculateTextMatchScore(query, result);

  // Organizational proximity (same department = higher)
  const proximity = calculateProximityScore(result, userContext);

  // Recency score (newer = slightly higher)
  const recency = calculateRecencyScore(result.metadata?.updatedAt);

  // Weighted combination
  return {
    textMatch,
    proximity,
    recency,
    final: textMatch * 0.5 + proximity * 0.3 + recency * 0.2,
  };
}

function calculateTextMatchScore(
  query: string[],
  result: SearchIndexEntry
): number {
  // Title match is worth more than content match
  const titleTokens = tokenize(result.title);
  const contentTokens = result.content ? tokenize(result.content) : [];

  let score = result.baseScore;

  for (const term of query) {
    // Exact title match
    if (titleTokens.some((t) => t === term)) {
      score += 0.4;
    }
    // Partial title match
    else if (titleTokens.some((t) => t.includes(term))) {
      score += 0.2;
    }
    // Content match
    else if (contentTokens.some((t) => t === term)) {
      score += 0.1;
    }
  }

  return Math.min(score, 1.0);
}

function calculateProximityScore(
  result: SearchIndexEntry,
  userContext: { departmentId?: string }
): number {
  if (!userContext.departmentId) return 0.3;

  const resultDept = result.metadata?.departmentId;
  if (!resultDept) return 0.3;

  if (resultDept === userContext.departmentId) return 1.0;
  
  // Could add parent department check here
  return 0.5;
}

function calculateRecencyScore(updatedAt?: number): number {
  if (!updatedAt) return 0.5;

  const daysSinceUpdate = (Date.now() - updatedAt) / (1000 * 60 * 60 * 24);
  
  // Exponential decay over 90 days
  if (daysSinceUpdate < 7) return 1.0;
  if (daysSinceUpdate < 30) return 0.8;
  if (daysSinceUpdate < 90) return 0.6;
  return 0.4;
}
```

### Result Hydration

```typescript
// convex/search/index.ts

async function hydrateSearchResult(
  ctx: QueryContext,
  indexEntry: SearchIndexEntry & { finalScore: number },
  queryTerms: string[]
): Promise<SearchResult> {
  // Fetch the actual entity for display
  const entity = await ctx.db.get(indexEntry.entityId as any);
  
  if (!entity) {
    return {
      id: indexEntry.entityId,
      entityType: indexEntry.entityType,
      title: indexEntry.title,
      excerpt: indexEntry.content ?? "",
      metadata: indexEntry.metadata,
      relevanceScore: indexEntry.finalScore,
      highlights: [],
    };
  }

  // Generate excerpt with highlights
  const excerpt = generateExcerpt(entity, indexEntry.entityType);
  const highlights = generateHighlights(excerpt, queryTerms);

  return {
    id: indexEntry.entityId,
    entityType: indexEntry.entityType,
    title: indexEntry.title,
    excerpt,
    metadata: {
      ...indexEntry.metadata,
      updatedAt: entity.updatedAt ?? entity._creationTime,
    },
    relevanceScore: indexEntry.finalScore,
    highlights,
  };
}

function generateExcerpt(
  entity: any,
  entityType: EntityType
): string {
  switch (entityType) {
    case "project":
      return entity.description?.slice(0, 200) ?? entity.title;
    case "budget":
      return `Allocated: ₱${entity.allocatedAmount?.toLocaleString() ?? 0}`;
    case "user":
      return entity.email ?? "";
    case "document":
      return entity.filename ?? "";
    default:
      return "";
  }
}

function generateHighlights(
  text: string,
  queryTerms: string[]
): string[] {
  const highlights: string[] = [];
  const normalizedText = text.toLowerCase();

  for (const term of queryTerms) {
    const index = normalizedText.indexOf(term.toLowerCase());
    if (index !== -1) {
      // Extract surrounding context
      const start = Math.max(0, index - 30);
      const end = Math.min(text.length, index + term.length + 30);
      highlights.push(text.slice(start, end));
    }
  }

  return highlights.slice(0, 3); // Max 3 highlights
}
```

---

## Schema Definition

```typescript
// convex/schema.ts (additions)

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ... existing tables ...

  // ==========================================================================
  // Search Index Tables
  // ==========================================================================

  searchIndex: defineTable({
    keyword: v.string(),
    entityId: v.string(),
    entityType: v.union(
      v.literal("project"),
      v.literal("twentyPercentDF"),
      v.literal("trustFund"),
      v.literal("specialEducationFund"),
      v.literal("specialHealthFund")
    ),
    baseScore: v.number(),
    title: v.string(),
    content: v.optional(v.string()),
    metadata: v.record(v.string(), v.any()),
  })
    .index("by_keyword", ["keyword"])
    .index("by_keyword_type", ["keyword", "entityType"])
    .index("by_entity", ["entityId", "entityType"]),

  searchFacets: defineTable({
    entityId: v.string(),
    facetKey: v.string(),
    facetValue: v.string(),
    facetType: v.union(
      v.literal("string"),
      v.literal("number"),
      v.literal("date"),
      v.literal("boolean")
    ),
  })
    .index("by_entity", ["entityId"])
    .index("by_key", ["facetKey"])
    .index("by_facet", ["facetKey", "facetValue"]),

  // Optional: Track popular searches for analytics
  searchKeywords: defineTable({
    keyword: v.string(),
    searchCount: v.number(),
    lastSearched: v.number(),
  })
    .index("by_keyword", ["keyword"])
    .index("by_popularity", ["searchCount"]),
});
```

---

*API Reference for PPDO Search System v1.0*
