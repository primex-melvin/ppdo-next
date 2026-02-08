"use client";

import * as React from "react";
import { Loader2, Search, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SearchResult, SearchApiResult } from "@/convex/search/types";
import { SearchResultCard } from "./SearchResultCard";

interface SearchResultsProps<T = any> {
  results: SearchApiResult[] | SearchResult<T>[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onResultClick?: (result: SearchApiResult | SearchResult<T>) => void;
  renderCard?: (result: SearchApiResult | SearchResult<T>) => React.ReactNode;
  emptyStateMessage?: string;
  className?: string;
}

/**
 * @deprecated Use SearchResultCard from ./SearchResultCard instead.
 * This component is kept for backward compatibility with custom renderCard implementations.
 */
function DefaultResultCard<T>({
  result,
  onClick,
}: {
  result: SearchResult<T>;
  onClick?: () => void;
}) {
  return (
    <SearchResultCard
      result={result}
      index={0}
      onClick={onClick ? () => onClick() : undefined}
    />
  );
}

// Loading skeleton
function ResultSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 bg-muted rounded" />
            <div className="h-5 w-16 bg-muted rounded" />
          </div>
          <div className="h-6 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

// Empty state
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Search className="size-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No results found</h3>
      <p className="text-sm text-muted-foreground max-w-md">{message}</p>
    </div>
  );
}

// Error state
function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-6 mb-4">
        <AlertCircle className="size-12 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
      <p className="text-sm text-muted-foreground mb-4">
        We couldn't load the search results. Please try again.
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}

export function SearchResults<T = any>({
  results,
  isLoading,
  hasMore,
  onLoadMore,
  onResultClick,
  renderCard,
  emptyStateMessage = "Try adjusting your search terms or filters to find what you're looking for.",
  className,
}: SearchResultsProps<T>) {
  const observerTarget = React.useRef<HTMLDivElement>(null);

  // Infinite scroll with Intersection Observer
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  // Show loading skeletons on initial load
  if (isLoading && results.length === 0) {
    return (
      <div className={cn("space-y-3 lg:space-y-6", className)}>
        {Array.from({ length: 5 }).map((_, index) => (
          <ResultSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Show empty state
  if (!isLoading && results.length === 0) {
    return <EmptyState message={emptyStateMessage} />;
  }

  return (
    <div className={cn("space-y-3 lg:space-y-6", className)}>
      {/* Results */}
      {results.map((result, index) => (
        <div key={`${result.indexEntry?.entityType || 'unknown'}-${result.indexEntry?.entityId || index}`}>
          {renderCard ? (
            renderCard(result)
          ) : (
            <SearchResultCard
              result={result}
              index={index}
              onClick={onResultClick ? () => onResultClick(result) : undefined}
            />
          )}
        </div>
      ))}

      {/* Loading more indicator */}
      {isLoading && results.length > 0 && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading more results...
          </span>
        </div>
      )}

      {/* Infinite scroll trigger */}
      {hasMore && !isLoading && (
        <div ref={observerTarget} className="h-10" aria-hidden="true" />
      )}

      {/* End of results indicator */}
      {!hasMore && results.length > 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            You've reached the end of the results
          </p>
        </div>
      )}
    </div>
  );
}
