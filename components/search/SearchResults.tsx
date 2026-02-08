"use client";

import * as React from "react";
import { Loader2, Search, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SearchResult, EntityType } from "@/convex/search/types";

interface SearchResultsProps<T = any> {
  results: SearchResult<T>[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onResultClick?: (result: SearchResult<T>) => void;
  renderCard?: (result: SearchResult<T>) => React.ReactNode;
  emptyStateMessage?: string;
  className?: string;
}

// Default card renderer
function DefaultResultCard<T>({
  result,
  onClick,
}: {
  result: SearchResult<T>;
  onClick?: () => void;
}) {
  const getEntityTypeColor = (type: EntityType) => {
    switch (type) {
      case "project":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "twentyPercentDF":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "trustFund":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "specialEducationFund":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      case "specialHealthFund":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
      case "department":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
      case "agency":
        return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300";
      case "user":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  const getEntityTypeLabel = (type: EntityType) => {
    switch (type) {
      case "project":
        return "Project";
      case "twentyPercentDF":
        return "20% DF";
      case "trustFund":
        return "Trust Fund";
      case "specialEducationFund":
        return "Special Education";
      case "specialHealthFund":
        return "Special Health";
      case "department":
        return "Department";
      case "agency":
        return "Agency";
      case "user":
        return "User";
      default:
        return type;
    }
  };

  // Use indexEntry fields with highlights
  const entry = result.indexEntry;
  const entityType = entry?.entityType;
  const matchScore = result.relevanceScore;
  
  // Use highlighted text if available, otherwise fall back to plain text
  const titleHtml = result.highlights?.primaryText || entry?.primaryText || "";
  const descriptionHtml = result.highlights?.secondaryText || entry?.secondaryText || "";

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getEntityTypeColor(entityType)}>
              {getEntityTypeLabel(entityType)}
            </Badge>
            {matchScore !== undefined && (
              <Badge variant="outline" className="text-xs">
                {Math.round(matchScore * 100)}% match
              </Badge>
            )}
          </div>
        </div>

        <h3 
          className="font-semibold text-base mb-1 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: titleHtml }}
        />

        {descriptionHtml && (
          <p 
            className="text-sm text-muted-foreground line-clamp-2 mb-2"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        )}
      </CardContent>
    </Card>
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
      <div className={cn("space-y-3", className)}>
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
    <div className={cn("space-y-3", className)}>
      {/* Results */}
      {results.map((result, index) => (
        <div key={`${result.indexEntry?.entityType || 'unknown'}-${result.indexEntry?.entityId || index}`}>
          {renderCard ? (
            renderCard(result)
          ) : (
            <DefaultResultCard
              result={result}
              onClick={() => onResultClick?.(result)}
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
