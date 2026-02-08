// convex/search/ranking.ts

/**
 * Search Ranking and Relevance Scoring System
 * Implements TF-IDF, proximity matching, and recency decay algorithms
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Document {
  primaryText: string;
  normalizedPrimaryText: string;
  secondaryText?: string;
  normalizedSecondaryText?: string;
  tokens: string[];
}

export interface RankingContext {
  query: string;
  queryTokens: string[];
  document: Document;
  userDepartmentId?: string;
  entityDepartmentId?: string;
  entityCreatedAt: number;
  entityUpdatedAt: number;
  parentDepartmentId?: string; // Parent department of entity's department
  userParentDepartmentId?: string; // Parent department of user's department
}

// ============================================================================
// TF-IDF CALCULATION
// ============================================================================

/**
 * Calculate Term Frequency (TF) - how often a term appears in the document
 * Uses logarithmic scaling to prevent bias towards longer documents
 */
function calculateTermFrequency(term: string, document: Document): number {
  const termLower = term.toLowerCase();
  let count = 0;

  // Count exact matches in normalized text
  const allText = [
    document.normalizedPrimaryText,
    document.normalizedSecondaryText || "",
  ].join(" ");

  // Count term occurrences
  const words = allText.split(/\s+/);
  for (const word of words) {
    if (word === termLower) {
      count++;
    }
  }

  // Use logarithmic TF: 1 + log(count) if count > 0, else 0
  return count > 0 ? 1 + Math.log(count) : 0;
}

/**
 * Calculate TF-IDF score for a query against a document
 * Since we don't have IDF (corpus statistics), we use a simplified TF-based approach
 * with positional bonuses
 */
export function calculateTFIDF(query: string, document: Document): number {
  const queryLower = query.toLowerCase().trim();

  if (!queryLower || queryLower.length === 0) {
    return 0;
  }

  let score = 0;

  // 1. Exact phrase match in primary text (highest weight)
  if (document.normalizedPrimaryText.includes(queryLower)) {
    score += 100;

    // Bonus for match at start of text
    if (document.normalizedPrimaryText.startsWith(queryLower)) {
      score += 25;
    }
  }

  // 2. Exact phrase match in secondary text
  if (
    document.normalizedSecondaryText &&
    document.normalizedSecondaryText.includes(queryLower)
  ) {
    score += 60;
  }

  // 3. Token-based matching with TF scoring
  const queryTokens = query
    .toLowerCase()
    .split(/[\s\-_.,;:!?()[\]{}'"]+/)
    .filter((t) => t.length > 1);

  if (queryTokens.length > 0) {
    let tokenMatchScore = 0;
    let matchedTokenCount = 0;

    for (const token of queryTokens) {
      // Check if token exists in document tokens
      if (document.tokens.includes(token)) {
        matchedTokenCount++;

        // Calculate TF for this token
        const tf = calculateTermFrequency(token, document);
        tokenMatchScore += tf * 10; // Scale TF score
      }
    }

    // Calculate token match ratio
    const matchRatio = matchedTokenCount / queryTokens.length;

    // Add token score weighted by match ratio
    score += tokenMatchScore * matchRatio;

    // Bonus for matching all tokens
    if (matchRatio === 1.0) {
      score += 20;
    }
  }

  // 4. Length normalization - slightly penalize very long documents
  // to prevent them from dominating through sheer token count
  const docLength = document.tokens.length;
  if (docLength > 50) {
    score *= 0.95;
  }

  return score;
}

// ============================================================================
// PROXIMITY SCORING
// ============================================================================

/**
 * Calculate organizational proximity score based on department relationships
 * Returns a score from 0.0 to 1.0:
 * - Same department: 1.0 (100%)
 * - Related department (parent-child): 0.7 (70%)
 * - Different department: 0.3 (30%)
 */
export function calculateProximity(
  userDepartmentId?: string,
  entityDepartmentId?: string,
  userParentDepartmentId?: string,
  entityParentDepartmentId?: string
): number {
  // No department information available
  if (!userDepartmentId || !entityDepartmentId) {
    return 0.3; // Default to different department score
  }

  // Same department
  if (userDepartmentId === entityDepartmentId) {
    return 1.0;
  }

  // Check for related departments (parent-child relationship)
  // User's department is parent of entity's department
  if (
    userDepartmentId === entityParentDepartmentId
  ) {
    return 0.7;
  }

  // Entity's department is parent of user's department
  if (
    entityDepartmentId === userParentDepartmentId
  ) {
    return 0.7;
  }

  // Same parent department (sibling departments)
  if (
    userParentDepartmentId &&
    entityParentDepartmentId &&
    userParentDepartmentId === entityParentDepartmentId
  ) {
    return 0.7;
  }

  // Different, unrelated departments
  return 0.3;
}

// ============================================================================
// RECENCY SCORING
// ============================================================================

/**
 * Calculate recency score based on time decay
 * Uses the entity's most recent timestamp (updated or created)
 * Returns a score from 0.4 to 1.0:
 * - < 7 days: 1.0
 * - < 30 days: 0.8
 * - < 90 days: 0.6
 * - > 90 days: 0.4
 */
export function calculateRecencyScore(timestamp: number): number {
  const now = Date.now();
  const ageInDays = (now - timestamp) / (1000 * 60 * 60 * 24);

  if (ageInDays < 7) {
    return 1.0;
  } else if (ageInDays < 30) {
    return 0.8;
  } else if (ageInDays < 90) {
    return 0.6;
  } else {
    return 0.4;
  }
}

// ============================================================================
// COMBINED RELEVANCE SCORE
// ============================================================================

/**
 * Calculate overall relevance score using weighted combination
 * Weights:
 * - Text Match (TF-IDF): 50%
 * - Organizational Proximity: 30%
 * - Recency: 20%
 *
 * Returns a normalized score from 0.0 to 1.0
 */
export function calculateRelevance(context: RankingContext): number {
  // 1. Calculate text match score (TF-IDF)
  const textScore = calculateTFIDF(context.query, context.document);

  // Normalize text score to 0-1 range
  // Typical max TF-IDF score is around 200-300, so we use 300 as max
  const normalizedTextScore = Math.min(textScore / 300, 1.0);

  // 2. Calculate proximity score (already 0-1)
  const proximityScore = calculateProximity(
    context.userDepartmentId,
    context.entityDepartmentId,
    context.userParentDepartmentId,
    context.parentDepartmentId
  );

  // 3. Calculate recency score (already 0.4-1.0, normalize to 0-1)
  const mostRecentTimestamp = Math.max(
    context.entityCreatedAt,
    context.entityUpdatedAt
  );
  const recencyScore = calculateRecencyScore(mostRecentTimestamp);

  // 4. Combine with weights
  const weightedScore =
    normalizedTextScore * 0.5 + // 50% text match
    proximityScore * 0.3 + // 30% proximity
    recencyScore * 0.2; // 20% recency

  // Ensure score is in 0-1 range
  return Math.max(0, Math.min(1, weightedScore));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Compare two relevance scores for sorting (descending order)
 */
export function compareRelevance(scoreA: number, scoreB: number): number {
  return scoreB - scoreA; // Higher scores first
}

/**
 * Normalize a relevance score to 0-100 range for display
 */
export function normalizeScoreForDisplay(score: number): number {
  return Math.round(score * 100);
}
