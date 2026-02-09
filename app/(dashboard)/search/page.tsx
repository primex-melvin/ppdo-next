"use client";

import * as React from "react";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Filter, X, Search } from "lucide-react";
import { useSearchRouter } from "@/hooks/search/useSearchRouter";
import { useInfiniteSearch } from "@/hooks/search/useInfiniteSearch";
import { useCategoryFilter } from "@/hooks/search/useCategoryFilter";
import { SearchInput } from "@/components/search/SearchInput";
import { CategorySidebar } from "@/components/search/CategorySidebar";
import { SearchResults } from "@/components/search/SearchResults";
import { NoResultsState } from "@/components/search/errors/NoResultsState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { EntityType, SearchApiResult, SearchResult } from "@/convex/search/types";

// Local interface for suggestion items from SearchInput
interface SuggestionItem {
  text: string;
  normalizedText: string;
  entityType?: EntityType;
  entityId?: string;
  secondaryText?: string;
  relevanceScore?: number;
}

export default function SearchPage() {
  const router = useRouter();
  const { state, setQuery, setCategory, clearFilters } = useSearchRouter();
  const { query, category } = state;
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch search results with pagination
  const {
    results,
    totalCount,
    isLoading,
    hasMore,
    loadMore,
    isEmpty,
  } = useInfiniteSearch({
    query,
    category: category || undefined,
    pageSize: 20,
  });

  // Fetch category counts
  const { counts: categoryCountsArray, activeCategory, setActiveCategory, isLoadingCounts } = useCategoryFilter({
    query,
    initialCategory: category || undefined,
  });

  // Convert CategoryCount[] to Partial<Record<EntityType, number>> for CategorySidebar
  const counts = useMemo(() => {
    const result: Partial<Record<EntityType, number>> = {};
    categoryCountsArray.forEach((cc) => {
      result[cc.entityType] = cc.count;
    });
    return result;
  }, [categoryCountsArray]);

  // Convert activeCategory (EntityType | undefined) to (EntityType | "all") for CategorySidebar
  const activeCategoryForSidebar: EntityType | "all" = activeCategory ?? "all";

  // Handle search query change
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, [setQuery]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: SuggestionItem) => {
    setQuery(suggestion.text);
  }, [setQuery]);

  // Handle category change
  const handleCategoryChange = useCallback((newCategory: EntityType | "all" | undefined) => {
    const cat = newCategory === "all" ? undefined : newCategory;
    setCategory(cat);
    setActiveCategory(cat);
    setMobileFilterOpen(false);
  }, [setCategory, setActiveCategory]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    clearFilters();
    setActiveCategory(undefined);
  }, [clearFilters, setActiveCategory]);

  // Handle suggestion click from NoResultsState
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
  }, [setQuery]);

  // Handle result click - navigate to sourceUrl
  const handleResultClick = useCallback((result: SearchApiResult | SearchResult) => {
    const apiResult = result as SearchApiResult;
    if (apiResult.sourceUrl) {
      router.push(apiResult.sourceUrl);
    } else if ((result as SearchResult).displayUrl) {
      router.push((result as SearchResult).displayUrl!);
    }
  }, [router]);

  // Get active category label
  const getActiveCategoryLabel = useCallback(() => {
    if (!activeCategory) return "All Results";
    switch (activeCategory) {
      // 1st page
      case "budgetItem":
        return "Budget Items";
      case "twentyPercentDF":
        return "20% DF";
      case "trustFund":
        return "Trust Funds";
      case "specialEducationFund":
        return "Special Education";
      case "specialHealthFund":
        return "Special Health";
      case "department":
        return "Departments";
      case "agency":
        return "Agencies/Offices";
      case "user":
        return "Users";
      // 2nd page
      case "projectItem":
        return "Projects";
      case "twentyPercentDFItem":
        return "20% DF Items";
      case "trustFundItem":
        return "Trust Fund Items";
      case "specialEducationFundItem":
        return "SEF Items";
      case "specialHealthFundItem":
        return "SHF Items";
      // 3rd page
      case "projectBreakdown":
        return "Project Breakdowns";
      default:
        return activeCategory;
    }
  }, [activeCategory]);

  // Check if there are active filters (activeCategory is EntityType when set, undefined otherwise)
  const hasActiveFilters = !!activeCategory;

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content Area (with right margin for sidebar on desktop) */}
      <div className="lg:mr-64 transition-all duration-200">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl">
          {/* Header */}
          <header className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">Search</h1>
                <p className="text-sm sm:text-base text-muted-foreground truncate">
                  Search across projects, departments, users, and more
                </p>
              </div>

              {/* Mobile Filter Toggle */}
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:hidden relative shrink-0 h-10 w-10"
                    aria-label="Open filters"
                  >
                    <Filter className="size-5" />
                    {hasActiveFilters && (
                      <span className="absolute -top-1 -right-1 size-3 bg-green-600 rounded-full border-2 border-background" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 sm:w-80 p-0">
                  <div className="p-4 border-b">
                    <h2 className="font-semibold">Filter Results</h2>
                  </div>
                  <CategorySidebar
                    activeCategory={activeCategoryForSidebar}
                    counts={counts}
                    totalCount={totalCount}
                    onCategoryChange={handleCategoryChange}
                    className="relative w-full h-auto border-none shadow-none"
                  />
                </SheetContent>
              </Sheet>
            </div>
          </header>


          {/* Active Category Indicator & Results Count */}
          <div
            className={cn(
              "flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2",
              "transition-opacity duration-200",
              query ? "opacity-100" : "opacity-0 h-0 mb-0 overflow-hidden"
            )}
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold">
                {getActiveCategoryLabel()}
              </h2>
              <Badge
                variant="secondary"
                className={cn(
                  "transition-all duration-200 text-xs sm:text-sm",
                  isLoading && "animate-pulse"
                )}
              >
                {isLoading ? "..." : totalCount.toLocaleString()}{" "}
                {totalCount === 1 ? "result" : "results"}
              </Badge>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => handleCategoryChange("all")}
                className="text-sm text-primary hover:underline flex items-center gap-1 self-start sm:self-auto min-h-[44px] sm:min-h-0 px-2 -ml-2 sm:px-0 sm:ml-0"
              >
                <X className="size-3" />
                Clear filter
              </button>
            )}
          </div>

          {/* Results Area */}
          <div className="mb-6 sm:mb-8">
            {query ? (
              isEmpty && !isLoading ? (
                <NoResultsState
                  query={query}
                  hasFilters={!!hasActiveFilters}
                  suggestions={[]}
                  onClearFilters={handleClearFilters}
                  onSuggestionClick={handleSuggestionClick}
                />
              ) : (
                <SearchResults
                  results={results}
                  isLoading={isLoading}
                  hasMore={hasMore}
                  onLoadMore={loadMore}
                  onResultClick={handleResultClick}
                  emptyStateMessage={
                    !activeCategory
                      ? "No results found. Try different search terms."
                      : `No ${getActiveCategoryLabel().toLowerCase()} found. Try a different category or search term.`
                  }
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="rounded-full bg-muted p-5 sm:p-6 mb-4">
                  <Search className="size-10 sm:size-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Start searching</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Enter a search query to find projects, departments, users, and
                  more.
                  <span className="hidden lg:inline">
                    {" "}Use the category filters on the right to narrow your results.
                  </span>
                  <span className="lg:hidden">
                    {" "}Use the filter button to narrow your results.
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Sidebar (Static on Right - Desktop Only) - No overlap */}
      <div className="hidden lg:block mt-32">
        <CategorySidebar
          activeCategory={activeCategoryForSidebar}
          counts={counts}
          totalCount={totalCount}
          onCategoryChange={handleCategoryChange}
        />
      </div>
    </div>
  );
}
