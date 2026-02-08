"use client";

import { SearchX, Sparkles, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NoResultsStateProps {
  query: string;
  hasFilters: boolean;
  suggestions?: string[];
  onClearFilters: () => void;
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

export function NoResultsState({
  query,
  hasFilters,
  suggestions = [],
  onClearFilters,
  onSuggestionClick,
  className,
}: NoResultsStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="rounded-full bg-muted p-6 mb-4">
        <SearchX className="size-12 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold mb-2">No results found</h3>

      <p className="text-sm text-muted-foreground max-w-md mb-4">
        We couldn&apos;t find anything matching &quot;
        <strong className="text-foreground">{query}</strong>&quot;.
        {hasFilters && (
          <span> Try adjusting your filters or search terms.</span>
        )}
      </p>

      {suggestions.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-3 flex items-center justify-center gap-1">
            <Sparkles className="size-4" />
            Did you mean:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => onSuggestionClick(suggestion)}
                className="hover:bg-primary/10"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {hasFilters && (
        <Button variant="outline" onClick={onClearFilters} className="gap-2">
          <FilterX className="size-4" />
          Clear All Filters
        </Button>
      )}

      {!hasFilters && suggestions.length === 0 && (
        <div className="text-sm text-muted-foreground mt-2">
          <p className="font-medium mb-2">Search tips:</p>
          <ul className="text-left space-y-1">
            <li>• Check your spelling</li>
            <li>• Try more general keywords</li>
            <li>• Use fewer search terms</li>
          </ul>
        </div>
      )}
    </div>
  );
}
