// convex/lib/searchUtils.ts

/**
 * Search Utilities for PPDO Search System
 * Handles text normalization, tokenization, and keyword processing
 * with support for both English and Filipino text.
 */

// ============================================================================
// STOP WORDS - Words to exclude from search indexing
// ============================================================================

/**
 * Common English stop words that should be filtered out from search
 */
const ENGLISH_STOP_WORDS = new Set([
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
]);

/**
 * Common Filipino stop words (Tagalog articles, prepositions, conjunctions)
 */
const FILIPINO_STOP_WORDS = new Set([
  "ang",
  "mga",
  "ng",
  "sa",
  "at",
  "ay",
  "na",
  "para",
  "ni",
  "si",
  "kay",
  "ko",
  "mo",
  "niya",
  "kami",
  "kayo",
  "sila",
  "ako",
  "ikaw",
  "ka",
  "namin",
  "natin",
  "ninyo",
  "nila",
  "tayo",
  "siya",
  "ito",
  "iyan",
  "iyon",
  "dito",
  "diyan",
  "doon",
  "rito",
  "riyan",
  "roon",
]);

/**
 * Combined stop words set (English + Filipino)
 */
export const STOP_WORDS = new Set([
  ...ENGLISH_STOP_WORDS,
  ...FILIPINO_STOP_WORDS,
]);

// ============================================================================
// DIACRITIC MAPPING - Filipino diacritical marks
// ============================================================================

/**
 * Map of diacritical characters to their base equivalents
 * Supports Filipino accented characters (á, é, í, ó, ú, ñ, etc.)
 */
const DIACRITIC_MAP: Record<string, string> = {
  á: "a",
  à: "a",
  â: "a",
  ä: "a",
  ã: "a",
  å: "a",
  é: "e",
  è: "e",
  ê: "e",
  ë: "e",
  í: "i",
  ì: "i",
  î: "i",
  ï: "i",
  ó: "o",
  ò: "o",
  ô: "o",
  ö: "o",
  õ: "o",
  ú: "u",
  ù: "u",
  û: "u",
  ü: "u",
  ñ: "n",
  ç: "c",
  Á: "A",
  À: "A",
  Â: "A",
  Ä: "A",
  Ã: "A",
  Å: "A",
  É: "E",
  È: "E",
  Ê: "E",
  Ë: "E",
  Í: "I",
  Ì: "I",
  Î: "I",
  Ï: "I",
  Ó: "O",
  Ò: "O",
  Ô: "O",
  Ö: "O",
  Õ: "O",
  Ú: "U",
  Ù: "U",
  Û: "U",
  Ü: "U",
  Ñ: "N",
  Ç: "C",
};

// ============================================================================
// TEXT NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Remove diacritical marks from text
 * Converts accented characters to their base equivalents
 *
 * @param text - Input text with potential diacritics
 * @returns Text with diacritics removed
 *
 * @example
 * removeDiacritics("Niño") // "Nino"
 * removeDiacritics("Pátio") // "Patio"
 */
export function removeDiacritics(text: string): string {
  return text
    .split("")
    .map((char) => DIACRITIC_MAP[char] || char)
    .join("");
}

/**
 * Normalize query text for case-insensitive searching
 * - Converts to lowercase
 * - Removes diacritical marks
 * - Trims whitespace
 *
 * @param query - Raw search query
 * @returns Normalized query string
 *
 * @example
 * normalizeQuery("INFRASTRUCTURE") // "infrastructure"
 * normalizeQuery("  Mga Proyekto  ") // "mga proyekto"
 * normalizeQuery("Niño Project") // "nino project"
 */
export function normalizeQuery(query: string): string {
  if (!query || typeof query !== "string") {
    return "";
  }

  return removeDiacritics(query.toLowerCase().trim());
}

/**
 * Normalize a keyword for index storage
 * Same as normalizeQuery but more semantic naming for indexing context
 *
 * @param keyword - Keyword to normalize
 * @returns Normalized keyword
 *
 * @example
 * normalizeKeyword("Project") // "project"
 * normalizeKeyword("BARANGAY") // "barangay"
 */
export function normalizeKeyword(keyword: string): string {
  return normalizeQuery(keyword);
}

// ============================================================================
// TOKENIZATION FUNCTIONS
// ============================================================================

/**
 * Split text into searchable tokens
 * - Normalizes text (lowercase, remove diacritics)
 * - Splits on whitespace and special characters
 * - Removes stop words
 * - Filters out empty strings and single characters
 * - Removes duplicates
 *
 * @param text - Text to tokenize
 * @param removeStopWords - Whether to filter out stop words (default: true)
 * @returns Array of unique tokens
 *
 * @example
 * tokenize("The Road Infrastructure Project")
 * // ["road", "infrastructure", "project"]
 *
 * tokenize("Sa barangay ng Manila")
 * // ["barangay", "manila"]
 *
 * tokenize("Project-123 (2024)")
 * // ["project", "123", "2024"]
 */
export function tokenize(
  text: string,
  removeStopWords: boolean = true
): string[] {
  if (!text || typeof text !== "string") {
    return [];
  }

  // Normalize the text
  const normalized = normalizeQuery(text);

  // Split on whitespace, punctuation, and special characters
  // Keep alphanumeric characters and hyphens
  const tokens = normalized.split(/[\s\-_.,;:!?()\[\]{}\/\\|"'`~@#$%^&*+=<>]+/);

  // Filter and clean tokens
  const cleanedTokens = tokens
    .map((token) => token.trim())
    .filter((token) => {
      // Remove empty strings
      if (!token) return false;

      // Remove single characters (unless they're numbers)
      if (token.length === 1 && !/\d/.test(token)) return false;

      // Remove stop words if enabled
      if (removeStopWords && STOP_WORDS.has(token)) return false;

      return true;
    });

  // Remove duplicates by converting to Set and back to array
  return Array.from(new Set(cleanedTokens));
}

// ============================================================================
// SEARCH MATCHING FUNCTIONS
// ============================================================================

/**
 * Check if a text contains a search query
 * Uses normalized text for case-insensitive, diacritic-insensitive matching
 *
 * @param text - Text to search in
 * @param query - Search query
 * @returns true if text contains query
 *
 * @example
 * textContains("Infrastructure Project", "infra") // true
 * textContains("Niño Project", "nino") // true
 * textContains("Road Project", "bridge") // false
 */
export function textContains(text: string, query: string): boolean {
  if (!text || !query) return false;

  const normalizedText = normalizeQuery(text);
  const normalizedQuery = normalizeQuery(query);

  return normalizedText.includes(normalizedQuery);
}

/**
 * Check if any token in text array matches search query
 * Useful for searching in pre-tokenized content
 *
 * @param tokens - Array of tokens
 * @param query - Search query
 * @returns true if any token matches query
 *
 * @example
 * tokensMatch(["road", "infrastructure"], "infra") // true
 * tokensMatch(["road", "infrastructure"], "bridge") // false
 */
export function tokensMatch(tokens: string[], query: string): boolean {
  if (!tokens || tokens.length === 0 || !query) return false;

  const normalizedQuery = normalizeQuery(query);

  return tokens.some((token) => token.includes(normalizedQuery));
}

/**
 * Calculate similarity score between two texts (0-100)
 * Based on:
 * - Exact match: 100
 * - Token overlap: weighted by coverage
 * - Substring match: partial credit
 *
 * @param text1 - First text
 * @param text2 - Second text
 * @returns Similarity score (0-100)
 *
 * @example
 * calculateSimilarity("Road Project", "Road Project") // 100
 * calculateSimilarity("Road Infrastructure", "Road Project") // ~50
 * calculateSimilarity("Road", "Bridge") // 0
 */
export function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  const norm1 = normalizeQuery(text1);
  const norm2 = normalizeQuery(text2);

  // Exact match
  if (norm1 === norm2) return 100;

  // Tokenize both texts
  const tokens1 = new Set(tokenize(text1, false)); // Don't remove stop words for similarity
  const tokens2 = new Set(tokenize(text2, false));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  // Calculate token overlap
  const intersection = new Set(
    Array.from(tokens1).filter((token) => tokens2.has(token))
  );

  const unionSize = tokens1.size + tokens2.size - intersection.size;
  const overlapScore = (intersection.size / unionSize) * 100;

  // Check for substring match
  const substringBonus =
    norm1.includes(norm2) || norm2.includes(norm1) ? 20 : 0;

  return Math.min(100, Math.round(overlapScore + substringBonus));
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Generate search index entry data from text
 * Convenience function for creating searchIndex entries
 *
 * @param primaryText - Main searchable text
 * @param secondaryText - Optional additional text
 * @returns Object with normalized text and tokens
 *
 * @example
 * generateIndexData("Road Project", "Infrastructure Development")
 * // {
 * //   primaryText: "Road Project",
 * //   normalizedPrimaryText: "road project",
 * //   secondaryText: "Infrastructure Development",
 * //   normalizedSecondaryText: "infrastructure development",
 * //   tokens: ["road", "project", "infrastructure", "development"]
 * // }
 */
export function generateIndexData(
  primaryText: string,
  secondaryText?: string
) {
  const allText = secondaryText
    ? `${primaryText} ${secondaryText}`
    : primaryText;

  return {
    primaryText,
    normalizedPrimaryText: normalizeQuery(primaryText),
    secondaryText: secondaryText || undefined,
    normalizedSecondaryText: secondaryText
      ? normalizeQuery(secondaryText)
      : undefined,
    tokens: tokenize(allText),
  };
}
