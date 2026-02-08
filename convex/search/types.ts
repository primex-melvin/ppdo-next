// convex/search/types.ts

/**
 * TypeScript Type Definitions for PPDO Search System
 * Provides type safety for search operations across all entity types
 */

// ============================================================================
// ENTITY TYPE DEFINITIONS
// ============================================================================

/**
 * Supported entity types for search indexing
 * Each type corresponds to a specific table in the database
 *
 * HIERARCHY:
 * - 1st page: List/Container views (budgetItem, twentyPercentDF, trustFund, etc.)
 * - 2nd page: Detail views (projectItem, twentyPercentDFItem, trustFundItem, etc.)
 * - 3rd page: Breakdown views (projectBreakdown, twentyPercentDFBreakdown, etc.)
 */
export type EntityType =
  // 1st page - List/Container views
  | "budgetItem" // Budget Items (budgetItems table) - WAS "project"
  | "twentyPercentDF" // 20% Development Fund (twentyPercentDFs table)
  | "trustFund" // Trust funds (trustFunds table)
  | "specialEducationFund" // SEF programs (specialEducationFunds table)
  | "specialHealthFund" // SHF programs (specialHealthFunds table)
  | "department" // PPDO departments (departments table)
  | "agency" // Implementing agencies/offices (implementingAgencies table)
  | "user" // System users (users table)
  // 2nd page - Detail views
  | "projectItem" // Project details (projects table)
  | "twentyPercentDFItem" // 20% DF details (twentyPercentDFBreakdowns table)
  | "trustFundItem" // Trust Fund details (trustFundBreakdowns table)
  | "specialEducationFundItem" // SEF details (specialEducationFundBreakdowns table)
  | "specialHealthFundItem" // SHF details (specialHealthFundBreakdowns table)
  // 3rd page - Breakdown views
  | "projectBreakdown"; // Project breakdowns (govtProjectBreakdowns table)

/**
 * Entity type labels for UI display
 */
export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  // 1st page
  budgetItem: "Budget Item",
  twentyPercentDF: "20% Development Fund",
  trustFund: "Trust Fund",
  specialEducationFund: "Special Education Fund",
  specialHealthFund: "Special Health Fund",
  department: "Department",
  agency: "Agency",
  user: "User",
  // 2nd page
  projectItem: "Project",
  twentyPercentDFItem: "20% DF",
  trustFundItem: "Trust Fund",
  specialEducationFundItem: "Special Education Fund",
  specialHealthFundItem: "Special Health Fund",
  // 3rd page
  projectBreakdown: "Project Breakdown",
};

/**
 * Entity type plural labels for UI display
 */
export const ENTITY_TYPE_PLURALS: Record<EntityType, string> = {
  // 1st page
  budgetItem: "Budget Items",
  twentyPercentDF: "20% Development Funds",
  trustFund: "Trust Funds",
  specialEducationFund: "Special Education Funds",
  specialHealthFund: "Special Health Funds",
  department: "Departments",
  agency: "Agencies",
  user: "Users",
  // 2nd page
  projectItem: "Projects",
  twentyPercentDFItem: "20% DF Items",
  trustFundItem: "Trust Fund Items",
  specialEducationFundItem: "Special Education Fund Items",
  specialHealthFundItem: "Special Health Fund Items",
  // 3rd page
  projectBreakdown: "Project Breakdowns",
};

// ============================================================================
// PAGE DEPTH UTILITIES
// ============================================================================

/**
 * Page depth levels for entity types
 * Maps each entity type to its navigation depth in the app
 * Used to display "Found in X page" in search results
 *
 * 1st page = List views (e.g., /dashboard/project/2026)
 * 2nd page = Detail views (e.g., /dashboard/project/2026/[particularId])
 * 3rd page = Breakdown views (e.g., /dashboard/project/.../[breakdownId])
 */
export const ENTITY_PAGE_DEPTHS: Record<EntityType, number> = {
  // 1st page - List/Container views
  budgetItem: 1,
  twentyPercentDF: 1,
  trustFund: 1,
  specialEducationFund: 1,
  specialHealthFund: 1,
  department: 1,
  agency: 1,
  user: 1,

  // 2nd page - Detail views
  projectItem: 2,
  twentyPercentDFItem: 2,
  trustFundItem: 2,
  specialEducationFundItem: 2,
  specialHealthFundItem: 2,

  // 3rd page - Breakdown views
  projectBreakdown: 3,
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

// ============================================================================
// SEARCH INDEX ENTRY
// ============================================================================

/**
 * Search Index Entry structure
 * Represents a single searchable entity in the system
 */
export interface SearchIndexEntry {
  _id: string;
  _creationTime: number;

  // Entity reference
  entityType: EntityType;
  entityId: string;

  // Searchable content
  primaryText: string;
  normalizedPrimaryText: string;
  secondaryText?: string;
  normalizedSecondaryText?: string;
  tokens: string[];

  // Metadata for filtering
  departmentId?: string;
  status?: string;
  year?: number;

  // Timestamps
  createdAt: number;
  updatedAt: number;
  isDeleted?: boolean;
  
  // Author reference (for displaying creator info)
  createdBy?: string; // User ID who created the original entity

  // Ranking factors
  relevanceScore?: number;
  accessCount?: number;

  // Audit
  indexedAt: number;
  lastReindexedAt: number;
}

// ============================================================================
// SEARCH RESULT
// ============================================================================

/**
 * Search Result structure
 * Returned from search queries, includes entity data and metadata
 */
export interface SearchResult<T = any> {
  // Search index data
  indexEntry: SearchIndexEntry;

  // Original entity data (optional, depends on query)
  entity?: T;

  // Match metadata
  matchScore: number; // 0-100, how well this result matches the query
  matchedFields: string[]; // Which fields matched (e.g., ["primaryText", "secondaryText"])
  highlights?: {
    primaryText?: string; // Text with <mark> tags around matches
    secondaryText?: string;
  };

  // Display metadata
  displayTitle: string; // Formatted title for UI
  displaySubtitle?: string; // Formatted subtitle for UI
  displayUrl?: string; // URL to navigate to this entity
  displayIcon?: string; // Icon name or emoji for UI

  // Navigation URL (from backend getEntityUrl)
  sourceUrl?: string;
  
  // Timestamps
  createdAt?: number;
  updatedAt?: number;
  
  // Relevance score (0-1 from ranking algorithm)
  relevanceScore?: number;
}

// ============================================================================
// SEARCH SUGGESTION
// ============================================================================

/**
 * Search Suggestion structure
 * Used for autocomplete/typeahead functionality
 */
export interface SearchSuggestion {
  // Suggestion text
  text: string;
  normalizedText: string;

  // Suggestion type
  type:
    | "entity" // Direct entity match
    | "keyword" // Common keyword/token
    | "recent" // Recent search
    | "popular"; // Popular search term

  // Associated entity (if applicable)
  entityType?: EntityType;
  entityId?: string;

  // Metadata
  count?: number; // How many entities match this suggestion
  icon?: string; // Icon for UI display
  category?: string; // Category for grouping suggestions
}

// ============================================================================
// SEARCH QUERY
// ============================================================================

/**
 * Search Query parameters
 * Defines how a search should be executed
 */
export interface SearchQuery {
  // Query text
  query: string;

  // Filters
  entityTypes?: EntityType[]; // Filter by specific entity types
  departmentIds?: string[]; // Filter by departments
  statuses?: string[]; // Filter by status
  years?: number[]; // Filter by fiscal years
  excludeDeleted?: boolean; // Exclude soft-deleted entities (default: true)

  // Pagination
  limit?: number; // Max results to return (default: 20)
  offset?: number; // Skip first N results (for pagination)

  // Sorting
  sortBy?:
    | "relevance" // Sort by match score (default)
    | "recent" // Sort by creation date
    | "updated" // Sort by last update
    | "popular"; // Sort by access count

  sortOrder?: "asc" | "desc"; // Sort direction (default: desc)

  // Options
  includeEntity?: boolean; // Include full entity data in results (default: false)
  includeHighlights?: boolean; // Include highlighted text (default: true)
}

// ============================================================================
// SEARCH RESPONSE
// ============================================================================

/**
 * Search Response structure
 * Returned from search API calls
 */
export interface SearchResponse<T = any> {
  // Results
  results: SearchResult<T>[];

  // Pagination metadata
  total: number; // Total matching results
  offset: number; // Current offset
  limit: number; // Results per page
  hasMore: boolean; // Whether more results exist

  // Query metadata
  query: string;
  normalizedQuery: string;
  executionTime?: number; // Query execution time in ms

  // Suggestions (if applicable)
  suggestions?: SearchSuggestion[];

  // Facets (if applicable)
  facets?: SearchFacets;
}

// ============================================================================
// SEARCH FACETS
// ============================================================================

/**
 * Search Facets structure
 * Aggregated filter options for refining search
 */
export interface SearchFacets {
  // Entity type facets
  entityTypes?: FacetOption[];

  // Department facets
  departments?: FacetOption[];

  // Status facets
  statuses?: FacetOption[];

  // Year facets
  years?: FacetOption[];

  // Custom facets (extensible)
  [key: string]: FacetOption[] | undefined;
}

/**
 * Individual facet option
 */
export interface FacetOption {
  value: string; // Facet value (e.g., "completed", "2024", "PESO")
  label: string; // Display label
  count: number; // Number of matching entities
  isActive?: boolean; // Whether this facet is currently selected
}

// ============================================================================
// SEARCH INDEX UPDATE
// ============================================================================

/**
 * Search Index Update parameters
 * Used when creating/updating search index entries
 */
export interface SearchIndexUpdate {
  entityType: EntityType;
  entityId: string;
  primaryText: string;
  secondaryText?: string;
  departmentId?: string;
  status?: string;
  year?: number;
  isDeleted?: boolean;
}

// ============================================================================
// SEARCH CONFIGURATION
// ============================================================================

/**
 * Search system configuration
 * Global settings for search behavior
 */
export interface SearchConfig {
  // Indexing settings
  autoIndex: boolean; // Automatically index new entities
  reindexInterval?: number; // How often to reindex (in ms)

  // Search settings
  minQueryLength: number; // Minimum query length (default: 2)
  maxResults: number; // Maximum results to return (default: 100)
  fuzzyMatch: boolean; // Enable fuzzy matching (default: false)

  // Suggestion settings
  enableSuggestions: boolean; // Enable autocomplete (default: true)
  maxSuggestions: number; // Max suggestions to show (default: 5)

  // Performance settings
  cacheResults: boolean; // Cache search results (default: true)
  cacheDuration?: number; // Cache TTL in ms (default: 5 minutes)
}

// ============================================================================
// SEARCH ANALYTICS
// ============================================================================

/**
 * Search analytics data
 * Track search usage and performance
 */
export interface SearchAnalytics {
  // Query data
  query: string;
  normalizedQuery: string;

  // Results
  resultCount: number;
  topResultEntityType?: EntityType;

  // Performance
  executionTime: number; // ms
  wasFromCache: boolean;

  // User context
  userId?: string;
  departmentId?: string;

  // Timestamp
  timestamp: number;

  // Filters applied
  filters?: {
    entityTypes?: EntityType[];
    departmentIds?: string[];
    statuses?: string[];
    years?: number[];
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Entity ID type mapping
 * Maps entity types to their corresponding ID types
 */
export type EntityIdMap = {
  // 1st page
  budgetItem: string; // Id<"budgetItems">
  twentyPercentDF: string; // Id<"twentyPercentDFs">
  trustFund: string; // Id<"trustFunds">
  specialEducationFund: string; // Id<"specialEducationFunds">
  specialHealthFund: string; // Id<"specialHealthFunds">
  department: string; // Id<"departments">
  agency: string; // Id<"implementingAgencies">
  user: string; // Id<"users">
  // 2nd page
  projectItem: string; // Id<"projects">
  twentyPercentDFItem: string; // Id<"twentyPercentDFBreakdowns">
  trustFundItem: string; // Id<"trustFundBreakdowns">
  specialEducationFundItem: string; // Id<"specialEducationFundBreakdowns">
  specialHealthFundItem: string; // Id<"specialHealthFundBreakdowns">
  // 3rd page
  projectBreakdown: string; // Id<"govtProjectBreakdowns">
};

/**
 * Extract entity ID type for a given entity type
 */
export type EntityId<T extends EntityType> = EntityIdMap[T];

// ============================================================================
// API RESPONSE TYPES (for Convex queries)
// ============================================================================

/**
 * Raw search result from Convex API
 * Matches exactly what the search query returns
 */
export interface SearchApiResult {
  indexEntry: SearchIndexEntry;
  relevanceScore: number;
  matchedFields: string[];
  highlights: {
    primaryText?: string;
    secondaryText?: string;
  };
  sourceUrl: string;
  createdAt: number;
  updatedAt: number;
  pageDepthText: string; // e.g., "Found in 1st page"
  // Author information (fetched during query - Option B)
  authorName?: string;
  authorImage?: string;
}

/**
 * Search API response structure
 */
export interface SearchApiResponse {
  results: SearchApiResult[];
  totalCount: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}
