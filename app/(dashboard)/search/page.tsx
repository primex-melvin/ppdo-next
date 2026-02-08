"use client";

import * as React from "react";
import { useSearchRouter } from "@/hooks/search/useSearchRouter";
import { useInfiniteSearch } from "@/hooks/search/useInfiniteSearch";
import { useCategoryFilter } from "@/hooks/search/useCategoryFilter";
import { SearchInput } from "@/components/search/SearchInput";
import { CategorySidebar } from "@/components/search/CategorySidebar";
import { SearchResults } from "@/components/search/SearchResults";
import { Badge } from "@/components/ui/badge";
import type { SearchSuggestion } from "@/convex/search/types";

export default function SearchPage() {
  const { query, category, setQuery, setCategory } = useSearchRouter();

  // Fetch search results with pagination
  const {
    results,
    totalCount,
    isLoading,
    hasMore,
    loadMore,
  } = useInfiniteSearch({
    query,
    category: category === "all" ? undefined : category,
    limit: 20,
  });

  // Fetch category counts
  const { counts, activeCategory, setActiveCategory } = useCategoryFilter({
    query,
    initialCategory: category,
  });

  // Handle search query change
  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    // If it's an entity suggestion, we could navigate to it directly
    // For now, just use it as a search query
    setQuery(suggestion.text);
  };

  // Handle category change
  const handleCategoryChange = (newCategory: typeof category) => {
    setCategory(newCategory);
    setActiveCategory(newCategory);
  };

  // Get active category label
  const getActiveCategoryLabel = () => {
    if (activeCategory === "all") return "All Results";
    switch (activeCategory) {
      case "project":
        return "Project";
      case "twentyPercentDF":
        return "20% DF";
      case "trustFund":
        return "Trust Funds";
      case "specialEducationFund":
        return "Special Education";
      case "specialHealthFund":
        return "Special Health";
      case "department":
        return "Department";
      case "agency":
        return "Agency/Office";
      case "user":
        return "User";
      default:
        return activeCategory;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content Area (with right margin for sidebar) */}
      <div className="mr-64">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Search</h1>
            <p className="text-muted-foreground">
              Search across projects, departments, users, and more
            </p>
          </header>

          {/* Search Input */}
          <div className="mb-6">
            <SearchInput
              value={query}
              onChange={handleQueryChange}
              onSuggestionSelect={handleSuggestionSelect}
            />
          </div>

          {/* Active Category Indicator & Results Count */}
          {query && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">
                  {getActiveCategoryLabel()}
                </h2>
                <Badge variant="secondary">
                  {totalCount.toLocaleString()} {totalCount === 1 ? "result" : "results"}
                </Badge>
              </div>
              {activeCategory !== "all" && (
                <button
                  onClick={() => handleCategoryChange("all")}
                  className="text-sm text-[#15803D] hover:underline"
                >
                  View all results
                </button>
              )}
            </div>
          )}

          {/* Results Area */}
          <div className="mb-8">
            {query ? (
              <SearchResults
                results={results}
                isLoading={isLoading}
                hasMore={hasMore}
                onLoadMore={loadMore}
                emptyStateMessage={
                  activeCategory === "all"
                    ? "No results found. Try different search terms."
                    : `No ${getActiveCategoryLabel().toLowerCase()} results found. Try a different category or search term.`
                }
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <svg
                    className="size-12 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Start searching
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Enter a search query to find projects, departments, users, and more.
                  Use the category filters on the right to narrow your results.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Sidebar (Fixed on Right) */}
      <CategorySidebar
        activeCategory={activeCategory}
        counts={counts}
        totalCount={totalCount}
        onCategoryChange={handleCategoryChange}
      />
    </div>
  );
}
