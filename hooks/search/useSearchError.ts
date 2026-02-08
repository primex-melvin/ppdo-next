"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import {
  SearchError,
  SearchErrorType,
  isRetryableError,
} from "@/types/searchErrors";
import { searchErrorLogger } from "@/lib/searchErrorLogger";

interface UseSearchErrorOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onError?: (error: SearchError) => void;
  query?: string;
  userId?: string;
}

interface UseSearchErrorReturn {
  error: SearchError | null;
  isRetrying: boolean;
  retryCount: number;
  setError: (error: SearchError | null) => void;
  clearError: () => void;
  retry: () => void;
  handleError: (err: unknown, context?: Record<string, unknown>) => SearchError;
}

/**
 * Hook for managing search error states with automatic retry logic
 */
export function useSearchError(
  options: UseSearchErrorOptions = {}
): UseSearchErrorReturn {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onError,
    query,
    userId,
  } = options;

  const [error, setErrorState] = useState<SearchError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const setError = useCallback(
    (newError: SearchError | null) => {
      setErrorState(newError);
      if (newError) {
        // Log the error
        searchErrorLogger.log(newError, {
          query,
          userId,
        });

        // Call error callback
        onError?.(newError);
      }
    },
    [onError, query, userId]
  );

  const clearError = useCallback(() => {
    setErrorState(null);
    setRetryCount(0);
    setIsRetrying(false);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  const retry = useCallback(() => {
    setRetryCount(0);
    clearError();
  }, [clearError]);

  /**
   * Calculate exponential backoff delay with jitter
   */
  const calculateBackoff = useCallback(
    (attempt: number): number => {
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000;
      return Math.min(exponentialDelay + jitter, maxDelay);
    },
    [baseDelay, maxDelay]
  );

  /**
   * Normalize unknown errors into SearchError format
   */
  const handleError = useCallback(
    (err: unknown, context?: Record<string, unknown>): SearchError => {
      const searchError = normalizeError(err, context);

      // Set the error
      setError(searchError);

      // Auto-retry for retryable errors
      if (searchError.retryable && retryCount < maxRetries) {
        setIsRetrying(true);
        const delay = calculateBackoff(retryCount);

        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          setIsRetrying(false);
        }, delay);
      }

      return searchError;
    },
    [setError, retryCount, maxRetries, calculateBackoff]
  );

  return {
    error,
    isRetrying,
    retryCount,
    setError,
    clearError,
    retry,
    handleError,
  };
}

/**
 * Normalize various error types into SearchError
 */
function normalizeError(
  err: unknown,
  context?: Record<string, unknown>
): SearchError {
  const timestamp = Date.now();

  // Handle network errors
  if (err instanceof TypeError && err.message.includes("fetch")) {
    return {
      type: SearchErrorType.NETWORK_ERROR,
      message: "Network connection failed",
      details: context,
      recoverable: true,
      retryable: true,
      timestamp,
    };
  }

  // Handle Error instances
  if (err instanceof Error) {
    const message = err.message.toLowerCase();

    if (message.includes("network") || message.includes("offline")) {
      return {
        type: SearchErrorType.NETWORK_ERROR,
        message: "Network connection failed",
        details: { ...context, originalMessage: err.message },
        recoverable: true,
        retryable: true,
        timestamp,
      };
    }

    if (message.includes("timeout") || message.includes("timed out")) {
      return {
        type: SearchErrorType.TIMEOUT,
        message: "Request timed out",
        details: { ...context, originalMessage: err.message },
        recoverable: true,
        retryable: true,
        timestamp,
      };
    }

    if (message.includes("rate limit") || message.includes("429")) {
      // Extract retry-after if available
      const retryAfterMatch = message.match(/retry.?after:?\s*(\d+)/i);
      const retryAfter = retryAfterMatch ? parseInt(retryAfterMatch[1], 10) : 30;

      return {
        type: SearchErrorType.RATE_LIMITED,
        message: "Too many requests",
        details: { ...context, originalMessage: err.message },
        recoverable: true,
        retryable: false,
        timestamp,
        retryAfter,
      };
    }

    if (message.includes("unauthorized") || message.includes("401")) {
      return {
        type: SearchErrorType.UNAUTHORIZED,
        message: "Session expired",
        details: { ...context, originalMessage: err.message },
        recoverable: true,
        retryable: false,
        timestamp,
      };
    }

    if (message.includes("forbidden") || message.includes("403")) {
      return {
        type: SearchErrorType.RESTRICTED_CONTENT,
        message: "Access denied",
        details: { ...context, originalMessage: err.message },
        recoverable: false,
        retryable: false,
        timestamp,
      };
    }

    if (message.includes("no results") || message.includes("not found")) {
      return {
        type: SearchErrorType.NO_RESULTS,
        message: "No results found",
        details: context,
        recoverable: true,
        retryable: false,
        timestamp,
      };
    }
  }

  // Handle Convex-specific errors
  if (
    typeof err === "object" &&
    err !== null &&
    "data" in err &&
    typeof (err as { data?: unknown }).data === "object"
  ) {
    const convexError = err as { data?: { code?: string; message?: string } };
    const code = convexError.data?.code;

    if (code === "QUERY_TOO_LONG") {
      return {
        type: SearchErrorType.QUERY_TOO_LONG,
        message: "Query too long",
        details: context,
        recoverable: true,
        retryable: false,
        timestamp,
      };
    }

    if (code === "QUERY_TOO_SHORT") {
      return {
        type: SearchErrorType.QUERY_TOO_SHORT,
        message: "Query too short",
        details: context,
        recoverable: true,
        retryable: false,
        timestamp,
      };
    }

    if (code === "INVALID_QUERY") {
      return {
        type: SearchErrorType.INVALID_QUERY,
        message: "Invalid query",
        details: context,
        recoverable: true,
        retryable: false,
        timestamp,
      };
    }
  }

  // Default to server error
  return {
    type: SearchErrorType.SERVER_ERROR,
    message: "An unexpected error occurred",
    details: {
      ...context,
      originalError: err instanceof Error ? err.message : String(err),
    },
    recoverable: false,
    retryable: true,
    timestamp,
  };
}

/**
 * Hook for managing search with automatic retry capability
 */
export function useSearchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: UseSearchErrorOptions = {}
): {
  data: T | undefined;
  error: SearchError | null;
  isLoading: boolean;
  isRetrying: boolean;
  retryCount: number;
  execute: () => Promise<void>;
  retry: () => void;
} {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000 } = options;

  const [data, setData] = useState<T | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const { error, isRetrying, retryCount, handleError, clearError, retry } =
    useSearchError(options);

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    clearError();

    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, clearError, handleError]);

  return {
    data,
    error,
    isLoading,
    isRetrying,
    retryCount,
    execute,
    retry,
  };
}
