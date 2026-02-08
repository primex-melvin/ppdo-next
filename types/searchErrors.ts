/**
 * Search Error Types and Interfaces
 *
 * Comprehensive error taxonomy for the PPDO Search System.
 * Used across hooks and components for consistent error handling.
 */

export enum SearchErrorType {
  // Network/Connection Errors
  NETWORK_ERROR = "network_error",
  TIMEOUT = "timeout",
  SERVER_ERROR = "server_error",

  // Query Errors
  INVALID_QUERY = "invalid_query",
  QUERY_TOO_LONG = "query_too_long",
  QUERY_TOO_SHORT = "query_too_short",

  // Result Errors
  NO_RESULTS = "no_results",
  PARTIAL_RESULTS = "partial_results",

  // Permission Errors
  RATE_LIMITED = "rate_limited",
  UNAUTHORIZED = "unauthorized",
  RESTRICTED_CONTENT = "restricted_content",

  // System Errors
  INDEX_OUTDATED = "index_outdated",
  FACET_UNAVAILABLE = "facet_unavailable",
}

export interface SearchError {
  type: SearchErrorType;
  message: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
  retryable: boolean;
  timestamp?: number;
  retryAfter?: number; // seconds - used for rate limiting
}

export interface ErrorMessage {
  title: string;
  description: string;
  action?: string;
}

export const errorMessages: Record<SearchErrorType, ErrorMessage> = {
  [SearchErrorType.NETWORK_ERROR]: {
    title: "Connection Error",
    description:
      "Unable to connect to the search server. Please check your internet connection.",
    action: "Retry Connection",
  },

  [SearchErrorType.TIMEOUT]: {
    title: "Search Timed Out",
    description:
      "The search is taking longer than expected. This might be due to high server load.",
    action: "Try Again",
  },

  [SearchErrorType.SERVER_ERROR]: {
    title: "Server Error",
    description: "Something went wrong on our end. Our team has been notified.",
    action: "Try Again",
  },

  [SearchErrorType.INVALID_QUERY]: {
    title: "Invalid Search",
    description:
      "Your search query contains invalid characters or is malformed.",
    action: "Fix Query",
  },

  [SearchErrorType.QUERY_TOO_LONG]: {
    title: "Query Too Long",
    description: "Please limit your search to 200 characters or less.",
  },

  [SearchErrorType.QUERY_TOO_SHORT]: {
    title: "Query Too Short",
    description: "Please enter at least 2 characters to search.",
  },

  [SearchErrorType.NO_RESULTS]: {
    title: "No Results Found",
    description:
      "Try adjusting your search terms or filters to find what you're looking for.",
    action: "Clear Filters",
  },

  [SearchErrorType.PARTIAL_RESULTS]: {
    title: "Partial Results",
    description: "Some results could not be loaded due to an error.",
    action: "Show Partial Results",
  },

  [SearchErrorType.RATE_LIMITED]: {
    title: "Too Many Requests",
    description:
      "You've made too many searches in a short time. Please wait a moment.",
  },

  [SearchErrorType.UNAUTHORIZED]: {
    title: "Session Expired",
    description:
      "Your session has expired. Please sign in again to continue searching.",
    action: "Sign In",
  },

  [SearchErrorType.RESTRICTED_CONTENT]: {
    title: "Access Restricted",
    description:
      "Some results are hidden because you don't have permission to view them.",
    action: "Request Access",
  },

  [SearchErrorType.INDEX_OUTDATED]: {
    title: "Search Index Updating",
    description:
      "Recent changes may not appear in search results yet. Please check back in a few minutes.",
  },

  [SearchErrorType.FACET_UNAVAILABLE]: {
    title: "Filters Unavailable",
    description:
      "Filter options couldn't be loaded. You can still perform a basic search.",
  },
};

export function getErrorMessage(type: SearchErrorType): ErrorMessage {
  return (
    errorMessages[type] || {
      title: "Error",
      description: "An unexpected error occurred. Please try again.",
    }
  );
}

/**
 * Check if an error type is retryable automatically
 */
export function isRetryableError(type: SearchErrorType): boolean {
  return [
    SearchErrorType.NETWORK_ERROR,
    SearchErrorType.TIMEOUT,
    SearchErrorType.SERVER_ERROR,
  ].includes(type);
}

/**
 * Check if an error is recoverable (user can take action)
 */
export function isRecoverableError(type: SearchErrorType): boolean {
  return [
    SearchErrorType.NETWORK_ERROR,
    SearchErrorType.TIMEOUT,
    SearchErrorType.SERVER_ERROR,
    SearchErrorType.NO_RESULTS,
    SearchErrorType.RATE_LIMITED,
    SearchErrorType.INVALID_QUERY,
    SearchErrorType.QUERY_TOO_LONG,
    SearchErrorType.QUERY_TOO_SHORT,
  ].includes(type);
}
