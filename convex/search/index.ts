// convex/search/index.ts

import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";
import { EntityType, getPageDepthDisplay } from "./types";
import { calculateRelevance, RankingContext } from "./ranking";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize text for search - lowercase and remove extra whitespace
 * Handles both English and Filipino text
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .trim()
    .replace(/\s+/g, " "); // Normalize whitespace
}

/**
 * Create highlighted text by wrapping matched query terms in <mark> tags
 * Returns the original text with matched terms highlighted
 */
function createHighlight(text: string, queryTokens: string[]): string {
  if (!text || queryTokens.length === 0) return text;

  // Escape special regex characters in tokens
  const escapedTokens = queryTokens.map(token =>
    token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );

  // Create regex that matches any of the query tokens (case-insensitive)
  // Use word boundaries to match whole words only
  const pattern = new RegExp(
    `(${escapedTokens.join('|')})`,
    'gi'
  );

  // Replace matches with <mark> tags
  return text.replace(pattern, '<mark>$1</mark>');
}

/**
 * Check if normalized text contains any of the query tokens
 * Uses the already normalized text from the index (faster and more reliable)
 */
function containsQueryTokens(normalizedText: string, queryTokens: string[]): boolean {
  if (!normalizedText || queryTokens.length === 0) return false;
  return queryTokens.some(token => normalizedText.includes(token));
}

/**
 * Tokenize text into searchable keywords
 * Splits on whitespace and special characters, removes common stop words
 */
function tokenizeText(text: string): string[] {
  const normalized = normalizeText(text);

  // Split on whitespace and special characters
  const tokens = normalized
    .split(/[\s\-_.,;:!?()[\]{}'"]+/)
    .filter((token) => token.length > 0);

  // Remove common stop words (English and Filipino)
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "he",
    "in",
    "is",
    "it",
    "its",
    "of",
    "on",
    "that",
    "the",
    "to",
    "was",
    "will",
    "with",
    "ng",
    "sa",
    "mga",
    "ang",
    "na",
    "ay",
  ]);

  const filtered = tokens.filter(
    (token) => !stopWords.has(token) && token.length > 1
  );

  // Return unique tokens
  return Array.from(new Set(filtered));
}

/**
 * Calculate relevance score based on various factors
 */
function calculateRelevanceScore(args: {
  createdAt: number;
  updatedAt: number;
  status?: string;
  accessCount?: number;
}): number {
  let score = 50; // Base score

  // Recency bonus (up to +20 points for items created in last 30 days)
  const daysSinceCreation = (Date.now() - args.createdAt) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation < 30) {
    score += (30 - daysSinceCreation) * (20 / 30);
  }

  // Freshness bonus (up to +15 points for recently updated items)
  const daysSinceUpdate = (Date.now() - args.updatedAt) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate < 7) {
    score += (7 - daysSinceUpdate) * (15 / 7);
  }

  // Status bonus
  if (args.status === "active" || args.status === "ongoing") {
    score += 10;
  } else if (args.status === "completed") {
    score += 5;
  }

  // Popularity bonus (up to +15 points)
  if (args.accessCount) {
    score += Math.min(15, args.accessCount / 10);
  }

  return Math.round(Math.min(100, score));
}

// ============================================================================
// HELPER FUNCTIONS (for internal use)
// ============================================================================

/**
 * Generate source URL for navigation based on entity type
 * Includes highlight parameter for auto-scroll & highlight feature
 * For nested entities (2nd/3rd level), parentSlug is required for correct URL
 */
function getEntityUrl(entityType: string, entityId: string, year?: number, parentSlug?: string): string {
  // Build base URL
  let baseUrl: string;

  switch (entityType) {
    // 1st page - List/Container views (no parentSlug needed)
    case "budgetItem":
      baseUrl = year ? `/dashboard/project/${year}` : `/dashboard/project`;
      break;
    case "twentyPercentDF":
      baseUrl = year ? `/dashboard/20_percent_df/${year}` : `/dashboard/20_percent_df`;
      break;
    case "trustFund":
      baseUrl = year ? `/dashboard/trust-funds/${year}` : `/dashboard/trust-funds`;
      break;
    case "specialEducationFund":
      baseUrl = year ? `/dashboard/special-education-funds/${year}` : `/dashboard/special-education-funds`;
      break;
    case "specialHealthFund":
      baseUrl = year ? `/dashboard/special-health-funds/${year}` : `/dashboard/special-health-funds`;
      break;
    case "department":
      baseUrl = `/dashboard/departments`;
      break;
    case "agency":
      baseUrl = `/dashboard/office`;
      break;
    case "user":
      baseUrl = `/dashboard/settings/user-management`;
      break;
    // 2nd page - Detail views (require parentSlug for nested URL)
    case "projectItem":
      if (parentSlug) {
        baseUrl = year ? `/dashboard/project/${year}/${parentSlug}` : `/dashboard/project`;
      } else {
        // Fallback to 1st page if parentSlug missing
        baseUrl = year ? `/dashboard/project/${year}` : `/dashboard/project`;
      }
      break;
    case "twentyPercentDFItem":
      if (parentSlug) {
        baseUrl = year ? `/dashboard/20_percent_df/${year}/${parentSlug}` : `/dashboard/20_percent_df`;
      } else {
        baseUrl = year ? `/dashboard/20_percent_df/${year}` : `/dashboard/20_percent_df`;
      }
      break;
    case "trustFundItem":
      if (parentSlug) {
        baseUrl = year ? `/dashboard/trust-funds/${year}/${parentSlug}` : `/dashboard/trust-funds`;
      } else {
        baseUrl = year ? `/dashboard/trust-funds/${year}` : `/dashboard/trust-funds`;
      }
      break;
    case "specialEducationFundItem":
      if (parentSlug) {
        baseUrl = year ? `/dashboard/special-education-funds/${year}/${parentSlug}` : `/dashboard/special-education-funds`;
      } else {
        baseUrl = year ? `/dashboard/special-education-funds/${year}` : `/dashboard/special-education-funds`;
      }
      break;
    case "specialHealthFundItem":
      if (parentSlug) {
        baseUrl = year ? `/dashboard/special-health-funds/${year}/${parentSlug}` : `/dashboard/special-health-funds`;
      } else {
        baseUrl = year ? `/dashboard/special-health-funds/${year}` : `/dashboard/special-health-funds`;
      }
      break;
    // 3rd page - Breakdown views (require parentSlug which encodes both budget item and project)
    case "projectBreakdown":
      if (parentSlug) {
        baseUrl = year ? `/dashboard/project/${year}/${parentSlug}` : `/dashboard/project`;
      } else {
        baseUrl = year ? `/dashboard/project/${year}` : `/dashboard/project`;
      }
      break;
    default:
      baseUrl = `/dashboard`;
  }

  // Append highlight parameter for deep linking and auto-scroll
  return `${baseUrl}?highlight=${entityId}`;
}

/**
 * Helper function to index or update an entity in the search index
 * Can be called from within other mutations
 */
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
    parentSlug?: string; // Slug of parent entity for nested URL generation
    parentId?: string; // ID of parent entity for reference
    isDeleted?: boolean;
    createdBy?: string; // User ID who created the entity (optional for backward compat)
    createdAt?: number; // Original entity creation timestamp (optional for backward compat)
    updatedAt?: number; // Original entity update timestamp (optional for backward compat)
  }
) {
  const now = Date.now();

  // Use provided timestamps or fallback to now
  const createdAt = args.createdAt ?? now;
  const updatedAt = args.updatedAt ?? now;
  const createdBy = args.createdBy ?? ""; // Empty string if not provided

  // Remove existing index entries for this entity
  const existingEntries = await ctx.db
    .query("searchIndex")
    .withIndex("entityTypeAndId", (q) =>
      q.eq("entityType", args.entityType).eq("entityId", args.entityId)
    )
    .collect();

  for (const entry of existingEntries) {
    await ctx.db.delete(entry._id);
  }

  // If entity is deleted, don't create new index entries
  if (args.isDeleted) {
    return { success: true, indexed: false, deleted: existingEntries.length };
  }

  // Normalize text
  const normalizedPrimaryText = normalizeText(args.primaryText);
  const normalizedSecondaryText = args.secondaryText
    ? normalizeText(args.secondaryText)
    : undefined;

  // Tokenize combined text
  const combinedText = args.secondaryText
    ? `${args.primaryText} ${args.secondaryText}`
    : args.primaryText;
  const tokens = tokenizeText(combinedText);

  // Calculate relevance score using original timestamps
  const relevanceScore = calculateRelevanceScore({
    createdAt,
    updatedAt,
    status: args.status,
    accessCount: 0,
  });

  // Create new index entry
  const indexEntry = await ctx.db.insert("searchIndex", {
    entityType: args.entityType,
    entityId: args.entityId,
    primaryText: args.primaryText,
    normalizedPrimaryText,
    secondaryText: args.secondaryText,
    normalizedSecondaryText,
    tokens,
    departmentId: args.departmentId,
    status: args.status,
    year: args.year,
    parentSlug: args.parentSlug, // For nested URL generation
    parentId: args.parentId, // For reference
    createdAt, // Original creation date (or now if not provided)
    updatedAt, // Original update date (or now if not provided)
    createdBy, // Original creator (or empty string if not provided)
    isDeleted: false,
    relevanceScore,
    accessCount: 0,
    indexedAt: now,
    lastReindexedAt: now,
  });

  return {
    success: true,
    indexed: true,
    indexEntryId: indexEntry,
    tokenCount: tokens.length,
  };
}

/**
 * Helper function to remove an entity from the search index
 * Can be called from within other mutations
 */
export async function removeFromIndex(
  ctx: MutationCtx,
  args: {
    entityId: string;
  }
) {
  // Find all index entries for this entity (across all entity types)
  const entries = await ctx.db
    .query("searchIndex")
    .filter((q) => q.eq(q.field("entityId"), args.entityId))
    .collect();

  // Delete all entries
  for (const entry of entries) {
    await ctx.db.delete(entry._id);
  }

  return {
    success: true,
    deletedCount: entries.length,
  };
}

// ============================================================================
// PUBLIC MUTATIONS (for direct API calls)
// ============================================================================

/**
 * Public mutation to index or update an entity in the search index
 * This should be called whenever an entity is created or updated
 */
export const indexEntityMutation = mutation({
  args: {
    entityType: v.union(
      // 1st page
      v.literal("budgetItem"),
      v.literal("twentyPercentDF"),
      v.literal("trustFund"),
      v.literal("specialEducationFund"),
      v.literal("specialHealthFund"),
      v.literal("department"),
      v.literal("agency"),
      v.literal("user"),
      // 2nd page
      v.literal("projectItem"),
      v.literal("twentyPercentDFItem"),
      v.literal("trustFundItem"),
      v.literal("specialEducationFundItem"),
      v.literal("specialHealthFundItem"),
      // 3rd page
      v.literal("projectBreakdown")
    ),
    entityId: v.string(),
    primaryText: v.string(),
    secondaryText: v.optional(v.string()),
    departmentId: v.optional(v.string()),
    status: v.optional(v.string()),
    year: v.optional(v.number()),
    isDeleted: v.optional(v.boolean()),
    createdBy: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await indexEntity(ctx, args);
  },
});

/**
 * Public mutation to remove an entity from the search index
 * This should be called when an entity is deleted
 */
export const removeFromIndexMutation = mutation({
  args: {
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    return await removeFromIndex(ctx, args);
  },
});

/**
 * Update the access count for a search index entry
 * Call this when a user views/accesses an entity
 */
export const incrementAccessCount = mutation({
  args: {
    entityId: v.string(),
    entityType: v.union(
      // 1st page
      v.literal("budgetItem"),
      v.literal("twentyPercentDF"),
      v.literal("trustFund"),
      v.literal("specialEducationFund"),
      v.literal("specialHealthFund"),
      v.literal("department"),
      v.literal("agency"),
      v.literal("user"),
      // 2nd page
      v.literal("projectItem"),
      v.literal("twentyPercentDFItem"),
      v.literal("trustFundItem"),
      v.literal("specialEducationFundItem"),
      v.literal("specialHealthFundItem"),
      // 3rd page
      v.literal("projectBreakdown")
    ),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("searchIndex")
      .withIndex("entityTypeAndId", (q) =>
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .collect();

    for (const entry of entries) {
      await ctx.db.patch(entry._id, {
        accessCount: (entry.accessCount || 0) + 1,
        relevanceScore: calculateRelevanceScore({
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          status: entry.status,
          accessCount: (entry.accessCount || 0) + 1,
        }),
      });
    }

    return { success: true, updatedCount: entries.length };
  },
});

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Main search function with pagination
 * Returns ranked results matching the search query
 */
export const search = query({
  args: {
    query: v.string(),
    entityTypes: v.optional(
      v.array(
        v.union(
          // 1st page
          v.literal("budgetItem"),
          v.literal("twentyPercentDF"),
          v.literal("trustFund"),
          v.literal("specialEducationFund"),
          v.literal("specialHealthFund"),
          v.literal("department"),
          v.literal("agency"),
          v.literal("user"),
          // 2nd page
          v.literal("projectItem"),
          v.literal("twentyPercentDFItem"),
          v.literal("trustFundItem"),
          v.literal("specialEducationFundItem"),
          v.literal("specialHealthFundItem"),
          // 3rd page
          v.literal("projectBreakdown")
        )
      )
    ),
    departmentIds: v.optional(v.array(v.string())),
    statuses: v.optional(v.array(v.string())),
    years: v.optional(v.array(v.number())),
    excludeDeleted: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const offset = args.offset || 0;
    const excludeDeleted = args.excludeDeleted ?? true;

    // Get current user's department information for proximity scoring
    let userDepartmentId: string | undefined;
    let userParentDepartmentId: string | undefined;

    try {
      const userId = await getAuthUserId(ctx);
      if (userId) {
        const user = await ctx.db.get(userId);
        if (user && user.departmentId) {
          userDepartmentId = user.departmentId;

          // Get user's department to find parent department
          const userDept = await ctx.db.get(user.departmentId);
          if ((userDept as any)?.parentDepartmentId) {
            userParentDepartmentId = (userDept as any).parentDepartmentId;
          }
        }
      }
    } catch (error) {
      // If not authenticated, continue without user context
      // This allows search to work for unauthenticated users
    }

    // Normalize and tokenize query
    const normalizedQuery = normalizeText(args.query);
    const queryTokens = tokenizeText(args.query);

    if (queryTokens.length === 0) {
      return {
        results: [],
        totalCount: 0,
        offset,
        limit,
        hasMore: false,
      };
    }

    // Get all search index entries
    let allEntries = await ctx.db.query("searchIndex").collect();

    // Apply filters
    let filtered = allEntries;

    // Filter by deleted status
    if (excludeDeleted) {
      filtered = filtered.filter((entry) => !entry.isDeleted);
    }

    // Filter by entity type
    if (args.entityTypes && args.entityTypes.length > 0) {
      filtered = filtered.filter((entry) =>
        args.entityTypes!.includes(entry.entityType as any)
      );
    }

    // Filter by department
    if (args.departmentIds && args.departmentIds.length > 0) {
      filtered = filtered.filter(
        (entry) =>
          entry.departmentId &&
          args.departmentIds!.includes(entry.departmentId)
      );
    }

    // Filter by status
    if (args.statuses && args.statuses.length > 0) {
      filtered = filtered.filter(
        (entry) => entry.status && args.statuses!.includes(entry.status)
      );
    }

    // Filter by year
    if (args.years && args.years.length > 0) {
      filtered = filtered.filter(
        (entry) => entry.year !== undefined && args.years!.includes(entry.year)
      );
    }

    // Get parent department IDs for all filtered entries (for proximity scoring)
    const departmentParents = new Map<string, string | undefined>();
    const uniqueDeptIds = new Set(
      filtered.map((e) => e.departmentId).filter((id): id is string => !!id)
    );

    for (const deptId of uniqueDeptIds) {
      try {
        const dept = await ctx.db.get(deptId as Id<"departments">);
        if (dept?.parentDepartmentId) {
          departmentParents.set(deptId, dept.parentDepartmentId);
        }
      } catch (error) {
        // Department not found or error, continue without parent info
      }
    }

    // Search and rank results using new relevance scoring
    const rankedResults = filtered
      .map((entry) => {
        // Build ranking context
        const rankingContext: RankingContext = {
          query: args.query,
          queryTokens,
          document: {
            primaryText: entry.primaryText,
            normalizedPrimaryText: entry.normalizedPrimaryText,
            secondaryText: entry.secondaryText,
            normalizedSecondaryText: entry.normalizedSecondaryText,
            tokens: entry.tokens,
          },
          userDepartmentId,
          entityDepartmentId: entry.departmentId,
          entityCreatedAt: entry.createdAt,
          entityUpdatedAt: entry.updatedAt,
          parentDepartmentId: entry.departmentId
            ? departmentParents.get(entry.departmentId)
            : undefined,
          userParentDepartmentId,
        };

        // Calculate relevance score (0-1)
        const relevanceScore = calculateRelevance(rankingContext);

        // Determine matched fields and create highlights
        const matchedFields: string[] = [];
        let primaryTextHighlighted: string | undefined;
        let secondaryTextHighlighted: string | undefined;

        // Check primary text for matches using already normalized text
        const primaryTextMatches = containsQueryTokens(entry.normalizedPrimaryText, queryTokens);
        if (primaryTextMatches) {
          matchedFields.push("primaryText");
          primaryTextHighlighted = createHighlight(entry.primaryText, queryTokens);
        }

        // Check secondary text for matches using already normalized text
        const secondaryTextMatches = entry.normalizedSecondaryText &&
          containsQueryTokens(entry.normalizedSecondaryText, queryTokens);
        if (secondaryTextMatches && entry.secondaryText) {
          matchedFields.push("secondaryText");
          secondaryTextHighlighted = createHighlight(entry.secondaryText, queryTokens);
        }

        // Also check if normalized query is a substring of normalized text (for exact phrase matches)
        const exactPhraseMatch = entry.normalizedPrimaryText.includes(normalizedQuery) ||
          (entry.normalizedSecondaryText && entry.normalizedSecondaryText.includes(normalizedQuery));

        // Check token matches - this handles cases where tokenization differs
        const matchedTokens = queryTokens.filter((token) =>
          entry.tokens.includes(token)
        );

        // Add token match info if tokens matched but we haven't recorded a match yet
        if (matchedTokens.length > 0 && matchedFields.length === 0) {
          matchedFields.push("tokens");
          // Still highlight in primary text even if only tokens matched
          primaryTextHighlighted = createHighlight(entry.primaryText, queryTokens);
        }

        // If we have an exact phrase match but no field match yet, add primaryText
        if (exactPhraseMatch && matchedFields.length === 0) {
          matchedFields.push("primaryText");
          primaryTextHighlighted = createHighlight(entry.primaryText, queryTokens);
        }

        return {
          entry,
          relevanceScore, // 0-1 normalized score
          matchedFields,
          highlights: {
            primaryText: primaryTextHighlighted || entry.primaryText,
            secondaryText: secondaryTextHighlighted || entry.secondaryText,
          },
        };
      })
      // Filter out results with no text matches (must have matched at least one field)
      .filter((result) => result.matchedFields.length > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply pagination
    const paginatedResults = rankedResults.slice(offset, offset + limit);

    // Fetch author information for each result (Option B: Join During Search Query)
    const resultsWithAuthors = await Promise.all(
      paginatedResults.map(async (r) => {
        let authorName: string | undefined;
        let authorImage: string | undefined;

        // Fetch user info if createdBy is available
        if (r.entry.createdBy) {
          try {
            const user = await ctx.db.get(r.entry.createdBy as Id<"users">);
            if (user) {
              authorName = user.name || user.email || undefined;
              authorImage = user.image || undefined;
            }
          } catch (error) {
            // User not found or error, leave author fields undefined
          }
        }

        return {
          indexEntry: r.entry,
          relevanceScore: r.relevanceScore,
          matchedFields: r.matchedFields,
          highlights: r.highlights,
          sourceUrl: getEntityUrl(r.entry.entityType, r.entry.entityId, r.entry.year, r.entry.parentSlug),
          createdAt: r.entry.createdAt,
          updatedAt: r.entry.updatedAt,
          pageDepthText: getPageDepthDisplay(r.entry.entityType),
          authorName,
          authorImage,
        };
      })
    );

    return {
      results: resultsWithAuthors,
      totalCount: rankedResults.length,
      offset,
      limit,
      hasMore: offset + limit < rankedResults.length,
    };
  },
});

/**
 * Get count of results per entity type (category)
 * Useful for displaying filter counts in UI
 */
export const categoryCounts = query({
  args: {
    query: v.string(),
    departmentIds: v.optional(v.array(v.string())),
    statuses: v.optional(v.array(v.string())),
    years: v.optional(v.array(v.number())),
    excludeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const excludeDeleted = args.excludeDeleted ?? true;
    const normalizedQuery = normalizeText(args.query);
    const queryTokens = tokenizeText(args.query);

    if (queryTokens.length === 0) {
      return {
        // 1st page
        budgetItem: 0,
        twentyPercentDF: 0,
        trustFund: 0,
        specialEducationFund: 0,
        specialHealthFund: 0,
        department: 0,
        agency: 0,
        user: 0,
        // 2nd page
        projectItem: 0,
        twentyPercentDFItem: 0,
        trustFundItem: 0,
        specialEducationFundItem: 0,
        specialHealthFundItem: 0,
        // 3rd page
        projectBreakdown: 0,
      };
    }

    // Get all search index entries
    let allEntries = await ctx.db.query("searchIndex").collect();

    // Apply base filters
    let filtered = allEntries;

    if (excludeDeleted) {
      filtered = filtered.filter((entry) => !entry.isDeleted);
    }

    if (args.departmentIds && args.departmentIds.length > 0) {
      filtered = filtered.filter(
        (entry) =>
          entry.departmentId &&
          args.departmentIds!.includes(entry.departmentId)
      );
    }

    if (args.statuses && args.statuses.length > 0) {
      filtered = filtered.filter(
        (entry) => entry.status && args.statuses!.includes(entry.status)
      );
    }

    if (args.years && args.years.length > 0) {
      filtered = filtered.filter(
        (entry) => entry.year !== undefined && args.years!.includes(entry.year)
      );
    }

    // Filter by search match
    const matched = filtered.filter((entry) => {
      // Check text matches
      if (entry.normalizedPrimaryText.includes(normalizedQuery)) {
        return true;
      }
      if (
        entry.normalizedSecondaryText &&
        entry.normalizedSecondaryText.includes(normalizedQuery)
      ) {
        return true;
      }

      // Check token matches
      const matchedTokens = queryTokens.filter((token) =>
        entry.tokens.includes(token)
      );
      return matchedTokens.length > 0;
    });

    // Count by entity type
    const counts: Record<EntityType, number> = {
      // 1st page
      budgetItem: 0,
      twentyPercentDF: 0,
      trustFund: 0,
      specialEducationFund: 0,
      specialHealthFund: 0,
      department: 0,
      agency: 0,
      user: 0,
      // 2nd page
      projectItem: 0,
      twentyPercentDFItem: 0,
      trustFundItem: 0,
      specialEducationFundItem: 0,
      specialHealthFundItem: 0,
      // 3rd page
      projectBreakdown: 0,
    };

    for (const entry of matched) {
      counts[entry.entityType as EntityType]++;
    }

    return counts;
  },
});

/**
 * Get search suggestions for typeahead/autocomplete
 * Returns top matching entities and keywords
 */
export const suggestions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    entityTypes: v.optional(
      v.array(
        v.union(
          // 1st page
          v.literal("budgetItem"),
          v.literal("twentyPercentDF"),
          v.literal("trustFund"),
          v.literal("specialEducationFund"),
          v.literal("specialHealthFund"),
          v.literal("department"),
          v.literal("agency"),
          v.literal("user"),
          // 2nd page
          v.literal("projectItem"),
          v.literal("twentyPercentDFItem"),
          v.literal("trustFundItem"),
          v.literal("specialEducationFundItem"),
          v.literal("specialHealthFundItem"),
          // 3rd page
          v.literal("projectBreakdown")
        )
      )
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    const normalizedQuery = normalizeText(args.query);

    if (normalizedQuery.length < 2) {
      return [];
    }

    // Get all search index entries
    let allEntries = await ctx.db.query("searchIndex").collect();

    // Filter by entity type if specified
    if (args.entityTypes && args.entityTypes.length > 0) {
      allEntries = allEntries.filter((entry) =>
        args.entityTypes!.includes(entry.entityType as any)
      );
    }

    // Filter out deleted entries
    const activeEntries = allEntries.filter((entry) => !entry.isDeleted);

    // Find entries that match the query prefix
    const matches = activeEntries
      .filter(
        (entry) =>
          entry.normalizedPrimaryText.startsWith(normalizedQuery) ||
          entry.normalizedPrimaryText.includes(` ${normalizedQuery}`) ||
          (entry.normalizedSecondaryText &&
            (entry.normalizedSecondaryText.startsWith(normalizedQuery) ||
              entry.normalizedSecondaryText.includes(` ${normalizedQuery}`)))
      )
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, limit);

    return matches.map((entry) => ({
      text: entry.primaryText,
      normalizedText: entry.normalizedPrimaryText,
      entityType: entry.entityType,
      entityId: entry.entityId,
      secondaryText: entry.secondaryText,
      relevanceScore: entry.relevanceScore,
    }));
  },
});

/**
 * Get all indexed entities for a specific entity type
 * Useful for debugging and verification
 */
export const getIndexedEntities = query({
  args: {
    entityType: v.union(
      // 1st page
      v.literal("budgetItem"),
      v.literal("twentyPercentDF"),
      v.literal("trustFund"),
      v.literal("specialEducationFund"),
      v.literal("specialHealthFund"),
      v.literal("department"),
      v.literal("agency"),
      v.literal("user"),
      // 2nd page
      v.literal("projectItem"),
      v.literal("twentyPercentDFItem"),
      v.literal("trustFundItem"),
      v.literal("specialEducationFundItem"),
      v.literal("specialHealthFundItem"),
      // 3rd page
      v.literal("projectBreakdown")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const entries = await ctx.db
      .query("searchIndex")
      .withIndex("entityType", (q) => q.eq("entityType", args.entityType))
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .take(limit);

    return entries;
  },
});
