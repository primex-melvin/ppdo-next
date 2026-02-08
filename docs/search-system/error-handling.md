# Search System Error Handling

> Comprehensive error state management for the PPDO Search System.

## Table of Contents

1. [Error Taxonomy](#error-taxonomy)
2. [Error State Components](#error-state-components)
3. [Recovery Strategies](#recovery-strategies)
4. [Error Logging](#error-logging)
5. [User Messaging](#user-messaging)

---

## Error Taxonomy

### Error Categories

```typescript
// types/searchErrors.ts

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
  details?: Record<string, any>;
  recoverable: boolean;
  retryable: boolean;
}
```

### Error Mapping

| Error Type | HTTP Status | Convex Error | User Impact |
|------------|-------------|--------------|-------------|
| `NETWORK_ERROR` | 0/offline | Connection failed | Cannot reach server |
| `TIMEOUT` | 504 | Query timeout | Results incomplete |
| `SERVER_ERROR` | 500 | Internal error | Try again later |
| `INVALID_QUERY` | 400 | Validation failed | Fix search terms |
| `QUERY_TOO_LONG` | 400 | Max 200 chars | Shorten query |
| `NO_RESULTS` | 200 | Empty results | Try different terms |
| `RATE_LIMITED` | 429 | Too many requests | Wait and retry |
| `UNAUTHORIZED` | 401 | Auth required | Login required |
| `RESTRICTED_CONTENT` | 403 | Access denied | Results filtered |

---

## Error State Components

### Network Error State

```typescript
// components/search/errors/NetworkErrorState.tsx
"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface NetworkErrorStateProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export function NetworkErrorState({
  onRetry,
  isRetrying = false,
}: NetworkErrorStateProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <WifiOff className="h-4 w-4" />
      <AlertTitle>Connection Error</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">
          Unable to connect to the search server. Please check your internet
          connection and try again.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRetrying ? "animate-spin" : ""}`}
          />
          {isRetrying ? "Retrying..." : "Retry Connection"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
```

### No Results State

```typescript
// components/search/errors/NoResultsState.tsx
"use client";

import { SearchX, Sparkles, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
} from "@/components/ui/empty-state";

interface NoResultsStateProps {
  query: string;
  hasFilters: boolean;
  suggestions?: string[];
  onClearFilters: () => void;
  onSuggestionClick: (suggestion: string) => void;
}

export function NoResultsState({
  query,
  hasFilters,
  suggestions = [],
  onClearFilters,
  onSuggestionClick,
}: NoResultsStateProps) {
  return (
    <EmptyState className="my-8">
      <EmptyStateIcon>
        <SearchX className="h-12 w-12 text-muted-foreground" />
      </EmptyStateIcon>
      
      <EmptyStateTitle>No results found</EmptyStateTitle>
      
      <EmptyStateDescription>
        We couldn&apos;t find anything matching &quot;<strong>{query}</strong>&quot;.
        {hasFilters && (
          <span> Try adjusting your filters or search terms.</span>
        )}
      </EmptyStateDescription>

      {suggestions.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">
            <Sparkles className="inline h-4 w-4 mr-1" />
            Did you mean:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => onSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      <EmptyStateActions>
        {hasFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            <FilterX className="mr-2 h-4 w-4" />
            Clear All Filters
          </Button>
        )}
      </EmptyStateActions>
    </EmptyState>
  );
}
```

### Timeout Error State

```typescript
// components/search/errors/TimeoutErrorState.tsx
"use client";

import { Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TimeoutErrorStateProps {
  onRetry: () => void;
  onShowPartial: () => void;
  partialResultsCount?: number;
}

export function TimeoutErrorState({
  onRetry,
  onShowPartial,
  partialResultsCount = 0,
}: TimeoutErrorStateProps) {
  return (
    <Alert className="my-4 border-yellow-500 bg-yellow-50">
      <Clock className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-800">Search is taking longer than expected</AlertTitle>
      <AlertDescription className="mt-2 text-yellow-700">
        <p className="mb-4">
          The search query is complex and taking longer than usual to process.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRetry}>
            <Clock className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          {partialResultsCount > 0 && (
            <Button variant="secondary" size="sm" onClick={onShowPartial}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Show {partialResultsCount} Partial Results
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

### Rate Limited State

```typescript
// components/search/errors/RateLimitedState.tsx
"use client";

import { useEffect, useState } from "react";
import { Hourglass, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface RateLimitedStateProps {
  retryAfter: number; // seconds
  onRetry: () => void;
}

export function RateLimitedState({
  retryAfter,
  onRetry,
}: RateLimitedStateProps) {
  const [countdown, setCountdown] = useState(retryAfter);

  useEffect(() => {
    if (countdown <= 0) {
      onRetry();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, onRetry]);

  const progress = ((retryAfter - countdown) / retryAfter) * 100;

  return (
    <Alert className="my-4">
      <Lock className="h-4 w-4" />
      <AlertTitle>Too Many Requests</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-2">
          You&apos;ve made too many search requests. Please wait before trying again.
        </p>
        <div className="flex items-center gap-3">
          <Hourglass className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Retry in {countdown}s
          </span>
        </div>
        <Progress value={progress} className="mt-2 h-2" />
      </AlertDescription>
    </Alert>
  );
}
```

### Restricted Content State

```typescript
// components/search/errors/RestrictedContentState.tsx
"use client";

import { Shield, EyeOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface RestrictedContentStateProps {
  filteredCount: number;
  requiredPermission?: string;
  onRequestAccess?: () => void;
}

export function RestrictedContentState({
  filteredCount,
  requiredPermission,
  onRequestAccess,
}: RestrictedContentStateProps) {
  return (
    <Alert className="my-4 border-blue-500 bg-blue-50">
      <Shield className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">Results Filtered</AlertTitle>
      <AlertDescription className="mt-2 text-blue-700">
        <p className="mb-2">
          <EyeOff className="inline h-4 w-4 mr-1" />
          {filteredCount} results were hidden due to access restrictions.
        </p>
        {requiredPermission && (
          <p className="text-sm mb-3">
            Required permission: <code>{requiredPermission}</code>
          </p>
        )}
        {onRequestAccess && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRequestAccess}
            className="bg-white"
          >
            Request Access
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

---

## Recovery Strategies

### Automatic Retry

```typescript
// hooks/useSearchWithRetry.ts
"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { SearchError, SearchErrorType } from "@/types/searchErrors";

interface UseSearchWithRetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

interface UseSearchWithRetryReturn<T> {
  data: T | undefined;
  error: SearchError | null;
  isLoading: boolean;
  isRetrying: boolean;
  retryCount: number;
  execute: () => Promise<void>;
  retry: () => void;
}

export function useSearchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: UseSearchWithRetryOptions = {}
): UseSearchWithRetryReturn<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
  } = options;

  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<SearchError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      setRetryCount(0);
    } catch (err) {
      const searchError = normalizeError(err);
      setError(searchError);

      // Auto-retry for retryable errors
      if (shouldRetry(searchError) && retryCount < maxRetries) {
        setIsRetrying(true);
        const delay = calculateBackoff(retryCount, baseDelay, maxDelay);
        
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          execute();
        }, delay);
      }
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, [fetchFn, retryCount, maxRetries, baseDelay, maxDelay]);

  const retry = useCallback(() => {
    setRetryCount(0);
    execute();
  }, [execute]);

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

// Exponential backoff with jitter
function calculateBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(exponentialDelay + jitter, maxDelay);
}

function shouldRetry(error: SearchError): boolean {
  return error.retryable && [
    SearchErrorType.NETWORK_ERROR,
    SearchErrorType.TIMEOUT,
    SearchErrorType.SERVER_ERROR,
  ].includes(error.type);
}

function normalizeError(err: unknown): SearchError {
  // Normalize various error types to SearchError
  if (err instanceof Error) {
    if (err.message.includes("network")) {
      return {
        type: SearchErrorType.NETWORK_ERROR,
        message: "Network connection failed",
        recoverable: true,
        retryable: true,
      };
    }
    if (err.message.includes("timeout")) {
      return {
        type: SearchErrorType.TIMEOUT,
        message: "Request timed out",
        recoverable: true,
        retryable: true,
      };
    }
  }

  return {
    type: SearchErrorType.SERVER_ERROR,
    message: "An unexpected error occurred",
    recoverable: false,
    retryable: false,
  };
}
```

### Partial Results Handling

```typescript
// hooks/usePartialResults.ts
"use client";

import { useState, useCallback } from "react";
import type { SearchResultsPage } from "@/convex/search/types";

interface UsePartialResultsReturn {
  results: SearchResultsPage["results"];
  partialCount: number;
  isShowingPartial: boolean;
  showPartial: () => void;
  hidePartial: () => void;
  clearPartial: () => void;
  addPartialResults: (results: SearchResultsPage["results"]) => void;
}

export function usePartialResults(): UsePartialResultsReturn {
  const [partialResults, setPartialResults] = useState<
    SearchResultsPage["results"]
  >([]);
  const [isShowingPartial, setIsShowingPartial] = useState(false);

  const showPartial = useCallback(() => {
    setIsShowingPartial(true);
  }, []);

  const hidePartial = useCallback(() => {
    setIsShowingPartial(false);
  }, []);

  const clearPartial = useCallback(() => {
    setPartialResults([]);
    setIsShowingPartial(false);
  }, []);

  const addPartialResults = useCallback(
    (results: SearchResultsPage["results"]) => {
      setPartialResults((prev) => [...prev, ...results]);
    },
    []
  );

  return {
    results: partialResults,
    partialCount: partialResults.length,
    isShowingPartial,
    showPartial,
    hidePartial,
    clearPartial,
    addPartialResults,
  };
}
```

---

## Error Logging

```typescript
// lib/searchErrorLogger.ts

import { SearchError, SearchErrorType } from "@/types/searchErrors";

interface ErrorLogEntry {
  timestamp: number;
  error: SearchError;
  context: {
    query?: string;
    filters?: Record<string, string[]>;
    userId?: string;
    sessionId?: string;
  };
  userAgent: string;
  url: string;
}

class SearchErrorLogger {
  private logBuffer: ErrorLogEntry[] = [];
  private flushInterval: number = 5000; // 5 seconds

  constructor() {
    // Flush logs periodically
    setInterval(() => this.flush(), this.flushInterval);
    
    // Flush on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.flush());
    }
  }

  log(error: SearchError, context: ErrorLogEntry["context"]): void {
    const entry: ErrorLogEntry = {
      timestamp: Date.now(),
      error,
      context,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    this.logBuffer.push(entry);

    // Immediate flush for critical errors
    if (this.isCritical(error)) {
      this.flush();
    }
  }

  private isCritical(error: SearchError): boolean {
    return [
      SearchErrorType.SERVER_ERROR,
      SearchErrorType.RATE_LIMITED,
      SearchErrorType.UNAUTHORIZED,
    ].includes(error.type);
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Send to analytics endpoint
      await fetch("/api/analytics/search-errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logs }),
        keepalive: true,
      });
    } catch (err) {
      // If flush fails, put logs back in buffer
      this.logBuffer.unshift(...logs);
    }
  }
}

export const searchErrorLogger = new SearchErrorLogger();
```

---

## User Messaging

### Message Templates

```typescript
// lib/searchErrorMessages.ts

import { SearchErrorType } from "@/types/searchErrors";

interface ErrorMessage {
  title: string;
  description: string;
  action?: string;
}

export const errorMessages: Record<SearchErrorType, ErrorMessage> = {
  [SearchErrorType.NETWORK_ERROR]: {
    title: "Connection Error",
    description: "Unable to connect to the search server. Please check your internet connection.",
    action: "Retry Connection",
  },

  [SearchErrorType.TIMEOUT]: {
    title: "Search Timed Out",
    description: "The search is taking longer than expected. This might be due to high server load.",
    action: "Try Again",
  },

  [SearchErrorType.SERVER_ERROR]: {
    title: "Server Error",
    description: "Something went wrong on our end. Our team has been notified.",
    action: "Try Again",
  },

  [SearchErrorType.INVALID_QUERY]: {
    title: "Invalid Search",
    description: "Your search query contains invalid characters or is malformed.",
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
    description: "Try adjusting your search terms or filters to find what you're looking for.",
    action: "Clear Filters",
  },

  [SearchErrorType.PARTIAL_RESULTS]: {
    title: "Partial Results",
    description: "Some results could not be loaded due to an error.",
    action: "Show Partial Results",
  },

  [SearchErrorType.RATE_LIMITED]: {
    title: "Too Many Requests",
    description: "You've made too many searches in a short time. Please wait a moment.",
  },

  [SearchErrorType.UNAUTHORIZED]: {
    title: "Session Expired",
    description: "Your session has expired. Please sign in again to continue searching.",
    action: "Sign In",
  },

  [SearchErrorType.RESTRICTED_CONTENT]: {
    title: "Access Restricted",
    description: "Some results are hidden because you don't have permission to view them.",
    action: "Request Access",
  },

  [SearchErrorType.INDEX_OUTDATED]: {
    title: "Search Index Updating",
    description: "Recent changes may not appear in search results yet. Please check back in a few minutes.",
  },

  [SearchErrorType.FACET_UNAVAILABLE]: {
    title: "Filters Unavailable",
    description: "Filter options couldn't be loaded. You can still perform a basic search.",
  },
};

export function getErrorMessage(type: SearchErrorType): ErrorMessage {
  return errorMessages[type] || {
    title: "Error",
    description: "An unexpected error occurred. Please try again.",
  };
}
```

---

*Error Handling Guide for PPDO Search System v1.0*
