# Search System Component Examples

> Complete, production-ready React components for the PPDO Search System.

## Table of Contents

1. [SearchInput with Typeahead](#searchinput-with-typeahead)
2. [SearchResults with Right Sidebar Layout](#searchresults-with-right-sidebar-layout)
3. [CategorySidebar (Right Side)](#categorysidebar-right-side)
4. [Dynamic Result Cards](#dynamic-result-cards)
5. [Complete Search Page](#complete-search-page)

---

## SearchInput with Typeahead

```typescript
// components/search/SearchInput.tsx
"use client";

import { useState, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useTypeahead } from "@/hooks/useTypeahead";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X, FileText, User, Folder, Wallet, HeartPulse, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchSuggestion } from "@/convex/search/types";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  className?: string;
}

const entityIcons = {
  project: Folder,
  budget: Wallet,
  user: User,
  document: FileText,
  trustFund: Wallet,
  specialEducationFund: GraduationCap,
  specialHealthFund: HeartPulse,
  twentyPercentDF: Wallet,
};

export function SearchInput({
  value,
  onChange,
  onSelect,
  placeholder = "Search projects, budgets, users...",
  className,
}: SearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const debouncedQuery = useDebounce(inputValue, 300);
  
  const suggestions = useQuery(
    api.search.suggestions,
    debouncedQuery.length >= 2 && isOpen
      ? { query: debouncedQuery, limit: 8 }
      : "skip"
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      onChange(newValue);
      setIsOpen(true);
    },
    [onChange]
  );

  const handleSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      if (suggestion.type === "entity") {
        setInputValue(suggestion.title);
        onChange(suggestion.title);
      } else {
        setInputValue(suggestion.keyword);
        onChange(suggestion.keyword);
      }
      setIsOpen(false);
      onSelect?.(suggestion);
      inputRef.current?.blur();
    },
    [onChange, onSelect]
  );

  const handleClear = useCallback(() => {
    setInputValue("");
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  const { selectedIndex, getItemProps, handleKeyDown, listProps } = useTypeahead({
    suggestions: suggestions ?? [],
    onSelect: handleSelect,
    onClose: closeDropdown,
  });

  const showSuggestions = isOpen && suggestions && suggestions.length > 0;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
          aria-label="Search"
          aria-autocomplete="list"
          aria-controls={showSuggestions ? "search-suggestions" : undefined}
          aria-expanded={showSuggestions}
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showSuggestions && (
        <div
          id="search-suggestions"
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg"
          {...listProps}
        >
          <ul className="py-2 max-h-80 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <SuggestionItem
                key={
                  suggestion.type === "entity"
                    ? `${suggestion.entityType}-${suggestion.id}`
                    : `kw-${suggestion.keyword}`
                }
                suggestion={suggestion}
                isSelected={index === selectedIndex}
                {...getItemProps(index)}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SuggestionItem({
  suggestion,
  isSelected,
  ...props
}: {
  suggestion: SearchSuggestion;
  isSelected: boolean;
} & React.HTMLAttributes<HTMLLIElement>) {
  if (suggestion.type === "entity") {
    const Icon = entityIcons[suggestion.entityType] || FileText;
    
    return (
      <li
        role="option"
        aria-selected={isSelected}
        className={cn(
          "px-4 py-2 cursor-pointer flex items-center gap-3",
          isSelected && "bg-accent"
        )}
        {...props}
      >
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{suggestion.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {suggestion.subtitle}
          </p>
        </div>
        <span className="text-xs text-muted-foreground capitalize">
          {suggestion.entityType}
        </span>
      </li>
    );
  }

  return (
    <li
      role="option"
      aria-selected={isSelected}
      className={cn(
        "px-4 py-2 cursor-pointer flex items-center justify-between",
        isSelected && "bg-accent"
      )}
      {...props}
    >
      <span className="text-sm">
        Search for &quot;<strong>{suggestion.keyword}</strong>&quot;
      </span>
      <span className="text-xs text-muted-foreground">
        {suggestion.count} results
      </span>
    </li>
  );
}
```

---

## SearchResults with Right Sidebar Layout

```typescript
// components/search/SearchResults.tsx
"use client";

import { useCallback } from "react";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "./cards/ProjectCard";
import { TwentyPercentDFCard } from "./cards/TwentyPercentDFCard";
import { TrustFundCard } from "./cards/TrustFundCard";
import { SpecialEducationCard } from "./cards/SpecialEducationCard";
import { SpecialHealthCard } from "./cards/SpecialHealthCard";
import { DepartmentCard } from "./cards/DepartmentCard";
import { AgencyCard } from "./cards/AgencyCard";
import { UserCard } from "./cards/UserCard";
import { SearchSkeleton } from "./SearchSkeleton";
import { NoResultsState } from "./errors/NoResultsState";
import { NetworkErrorState } from "./errors/NetworkErrorState";
import type { SearchResult, EntityType } from "@/convex/search/types";

const resultComponents: Record<
  EntityType,
  React.ComponentType<{ data: SearchResult }>
> = {
  project: ProjectCard,
  twentyPercentDF: TwentyPercentDFCard,
  trustFund: TrustFundCard,
  specialEducationFund: SpecialEducationCard,
  specialHealthFund: SpecialHealthCard,
  department: DepartmentCard,
  agency: AgencyCard,
  user: UserCard,
};

interface SearchResultsProps {
  query: string;
  activeCategory: string | null;
}

export function SearchResults({ query, activeCategory }: SearchResultsProps) {
  const {
    results,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.search.search,
    query
      ? {
          query,
          entityTypes: activeCategory ? [activeCategory as EntityType] : undefined,
          paginationOpts: { numItems: 20 },
        }
      : "skip",
    { numItems: 20 }
  );

  const handleSuggestionClick = useCallback((suggestion: string) => {
    // Handle suggestion click
  }, []);

  // Loading state
  if (status === "LoadingFirstPage") {
    return <SearchSkeleton count={5} />;
  }

  // Error state
  if (status === "Error") {
    return (
      <NetworkErrorState
        onRetry={() => window.location.reload()}
        isRetrying={false}
      />
    );
  }

  // No results
  if (results.length === 0) {
    return (
      <NoResultsState
        query={query}
        hasFilters={!!activeCategory}
        suggestions={["infrastructure", "2024", "budget"]}
        onClearFilters={() => {}}
        onSuggestionClick={handleSuggestionClick}
      />
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => {
        const Component = resultComponents[result.entityType];
        return (
          <Component
            key={`${result.entityType}-${result.id}`}
            data={result}
          />
        );
      })}

      {/* Load more */}
      {status === "CanLoadMore" && (
        <div className="py-4 text-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={status === "LoadingMore"}
          >
            {status === "LoadingMore" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Results"
            )}
          </Button>
        </div>
      )}

      {/* End of results */}
      {status === "Exhausted" && results.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          No more results
        </p>
      )}
    </div>
  );
}
```

---

## CategorySidebar (Right Side)

```typescript
// components/search/CategorySidebar.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { 
  Folder, 
  Wallet, 
  HeartPulse, 
  GraduationCap, 
  Percent,
  Building2,
  Landmark,
  UserCircle,
  ChevronRight 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryCount {
  key: string;
  label: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface CategorySidebarProps {
  query: string;
  activeCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

const categoryConfig: Record<string, { 
  label: string; 
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}> = {
  project: {
    label: "Project",
    icon: Folder,
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
  },
  twentyPercentDF: {
    label: "20% DF",
    icon: Percent,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 hover:bg-emerald-100",
  },
  trustFund: {
    label: "Trust Funds",
    icon: Wallet,
    color: "text-purple-600",
    bgColor: "bg-purple-50 hover:bg-purple-100",
  },
  specialEducationFund: {
    label: "Special Education",
    icon: GraduationCap,
    color: "text-amber-600",
    bgColor: "bg-amber-50 hover:bg-amber-100",
  },
  specialHealthFund: {
    label: "Special Health",
    icon: HeartPulse,
    color: "text-rose-600",
    bgColor: "bg-rose-50 hover:bg-rose-100",
  },
  department: {
    label: "Department",
    icon: Building2,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 hover:bg-indigo-100",
  },
  agency: {
    label: "Agency/Office",
    icon: Landmark,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50 hover:bg-cyan-100",
  },
  user: {
    label: "User",
    icon: UserCircle,
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100",
  },
};

export function CategorySidebar({
  query,
  activeCategory,
  onCategorySelect,
}: CategorySidebarProps) {
  const categoryCounts = useQuery(
    api.search.categoryCounts,
    query ? { query } : "skip"
  );

  if (categoryCounts === undefined) {
    return <CategorySidebarSkeleton />;
  }

  // Build category list with counts
  const categories: CategoryCount[] = Object.entries(categoryConfig).map(
    ([key, config]) => ({
      key,
      label: config.label,
      count: categoryCounts[key] ?? 0,
      icon: config.icon,
      color: config.color,
    })
  );

  // Filter out categories with 0 results unless they're active
  const visibleCategories = categories.filter(
    (cat) => cat.count > 0 || cat.key === activeCategory
  );

  const totalResults = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <aside className="w-72 border-l bg-muted/30 h-full overflow-auto">
      <div className="p-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
          Search Categories
        </h2>

        {/* All Results Option */}
        <button
          onClick={() => onCategorySelect(null)}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-lg transition-colors mb-2",
            activeCategory === null
              ? "bg-primary text-primary-foreground"
              : "bg-card hover:bg-accent"
          )}
        >
          <span className="font-medium">All Results</span>
          <span className={cn(
            "text-sm",
            activeCategory === null 
              ? "text-primary-foreground/80" 
              : "text-muted-foreground"
          )}>
            {totalResults} items
          </span>
        </button>

        <Separator className="my-4" />

        {/* Category List */}
        <div className="space-y-2">
          {visibleCategories.map((category) => {
            const config = categoryConfig[category.key];
            const Icon = config.icon;
            const isActive = activeCategory === category.key;
            const hasResults = category.count > 0;

            return (
              <button
                key={category.key}
                onClick={() => hasResults && onCategorySelect(category.key)}
                disabled={!hasResults}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-all",
                  isActive
                    ? cn(config.bgColor, "ring-2 ring-offset-1", config.color.replace("text-", "ring-"))
                    : hasResults
                    ? "bg-card hover:bg-accent cursor-pointer"
                    : "bg-muted/50 cursor-not-allowed opacity-60"
                )}
              >
                <div className={cn(
                  "p-2 rounded-md",
                  isActive ? "bg-white/80" : "bg-muted"
                )}>
                  <Icon className={cn("h-4 w-4", config.color)} />
                </div>

                <div className="flex-1 text-left">
                  <p className={cn(
                    "font-medium text-sm",
                    isActive && config.color
                  )}>
                    {category.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasResults 
                      ? `${category.count} item${category.count !== 1 ? 's' : ''} found`
                      : "No items found"
                    }
                  </p>
                </div>

                {isActive && (
                  <ChevronRight className={cn("h-4 w-4", config.color)} />
                )}
              </button>
            );
          })}
        </div>

        {/* Empty state for no results in any category */}
        {visibleCategories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No results found in any category</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function CategorySidebarSkeleton() {
  return (
    <aside className="w-72 border-l bg-muted/30 p-4">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-12 w-full mb-2" />
      <Skeleton className="h-px w-full my-4" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </aside>
  );
}
```

---

## Dynamic Result Cards

### Project Card

```typescript
// components/search/cards/ProjectCard.tsx
"use client";

import { Folder, Calendar, MapPin, ArrowUpRight, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/convex/search/types";

interface ProjectCardProps {
  data: SearchResult;
}

const statusColors = {
  planning: "bg-slate-100 text-slate-800 border-slate-200",
  ongoing: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  suspended: "bg-yellow-100 text-yellow-800 border-yellow-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels = {
  planning: "Planning",
  ongoing: "Ongoing",
  completed: "Completed",
  suspended: "Suspended",
  cancelled: "Cancelled",
};

export function ProjectCard({ data }: ProjectCardProps) {
  const { title, excerpt, metadata, highlights } = data;
  const { 
    status, 
    department, 
    year, 
    updatedAt,
    location,
    beneficiaryCount,
    completionRate,
    totalCost
  } = metadata;

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Folder className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold group-hover:text-blue-600 transition-colors flex items-center gap-2">
                {title}
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              {department && (
                <p className="text-sm text-muted-foreground truncate">{department}</p>
              )}
            </div>
          </div>
          {status && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                statusColors[status as keyof typeof statusColors]
              )}
            >
              {statusLabels[status as keyof typeof statusLabels] || status}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {excerpt}
          </p>
        )}

        {highlights && highlights.length > 0 && (
          <div className="space-y-1">
            {highlights.map((highlight, i) => (
              <p
                key={i}
                className="text-sm bg-yellow-50 px-3 py-2 rounded-md border-l-2 border-yellow-400"
              >
                &quot;...{highlight}...&quot;
              </p>
            ))}
          </div>
        )}

        {completionRate !== undefined && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Completion</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
          {year && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              FY {year}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {location}
            </span>
          )}
          {beneficiaryCount && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {beneficiaryCount} beneficiaries
            </span>
          )}
          {totalCost && (
            <span className="ml-auto font-medium text-foreground">
              {formatCurrency(totalCost)}
            </span>
          )}
          {formattedDate && (
            <span className="ml-auto">Updated {formattedDate}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 20% DF Card

```typescript
// components/search/cards/TwentyPercentDFCard.tsx
"use client";

import { Percent, Calendar, Wallet, ArrowUpRight, Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/convex/search/types";

interface TwentyPercentDFCardProps {
  data: SearchResult;
}

export function TwentyPercentDFCard({ data }: TwentyPercentDFCardProps) {
  const { title, excerpt, metadata } = data;
  const { 
    status,
    department,
    year,
    allocatedAmount,
    utilizedAmount,
    programType,
    barangayCount,
    updatedAt
  } = metadata;

  const utilizationRate = allocatedAmount && utilizedAmount
    ? Math.round((utilizedAmount / allocatedAmount) * 100)
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-emerald-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Percent className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold group-hover:text-emerald-600 transition-colors">
                  {title}
                </h3>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {programType && (
                <p className="text-xs text-muted-foreground">{programType}</p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            20% DF
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {excerpt}
          </p>
        )}

        {allocatedAmount && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Utilization Rate</span>
              <span className={cn(
                "font-medium",
                utilizationRate >= 90 ? "text-green-600" : 
                utilizationRate >= 50 ? "text-yellow-600" : "text-red-600"
              )}>
                {utilizationRate}%
              </span>
            </div>
            <Progress 
              value={utilizationRate} 
              className={cn(
                "h-2",
                utilizationRate >= 90 ? "bg-green-100" : 
                utilizationRate >= 50 ? "bg-yellow-100" : "bg-red-100"
              )}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Allocated: {formatCurrency(allocatedAmount)}</span>
              {utilizedAmount && (
                <span>Utilized: {formatCurrency(utilizedAmount)}</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          {department && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {department}
            </span>
          )}
          {year && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              FY {year}
            </span>
          )}
          {barangayCount && (
            <span>{barangayCount} barangays</span>
          )}
          {formattedDate && (
            <span className="ml-auto">Updated {formattedDate}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Trust Fund Card

```typescript
// components/search/cards/TrustFundCard.tsx
"use client";

import { Wallet, Calendar, ArrowUpRight, PiggyBank, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/convex/search/types";

interface TrustFundCardProps {
  data: SearchResult;
}

const fundTypeColors = {
  infrastructure: "bg-blue-100 text-blue-800 border-blue-200",
  social: "bg-purple-100 text-purple-800 border-purple-200",
  economic: "bg-green-100 text-green-800 border-green-200",
  environmental: "bg-teal-100 text-teal-800 border-teal-200",
  general: "bg-slate-100 text-slate-800 border-slate-200",
};

export function TrustFundCard({ data }: TrustFundCardProps) {
  const { title, excerpt, metadata } = data;
  const { 
    fundType,
    currentBalance,
    initialAmount,
    yearEstablished,
    interestAccrued,
    status,
    updatedAt
  } = metadata;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PiggyBank className="h-5 w-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold group-hover:text-purple-600 transition-colors">
                  {title}
                </h3>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {yearEstablished && (
                <p className="text-xs text-muted-foreground">
                  Established {yearEstablished}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Trust Fund
            </Badge>
            {fundType && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  fundTypeColors[fundType as keyof typeof fundTypeColors]
                )}
              >
                {fundType}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {excerpt}
          </p>
        )}

        {currentBalance !== undefined && (
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-600 font-medium">Current Balance</p>
                <p className="text-xl font-bold text-purple-700">
                  {formatCurrency(currentBalance)}
                </p>
              </div>
              {interestAccrued > 0 && (
                <div className="text-right">
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-xs font-medium">Interest Accrued</span>
                  </div>
                  <p className="text-sm font-medium text-green-700">
                    +{formatCurrency(interestAccrued)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
          {initialAmount && (
            <span className="flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              Initial: {formatCurrency(initialAmount)}
            </span>
          )}
          {formattedDate && (
            <span className="ml-auto">Updated {formattedDate}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Special Education Fund Card

```typescript
// components/search/cards/SpecialEducationCard.tsx
"use client";

import { GraduationCap, Calendar, ArrowUpRight, School, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/convex/search/types";

interface SpecialEducationCardProps {
  data: SearchResult;
}

export function SpecialEducationCard({ data }: SpecialEducationCardProps) {
  const { title, excerpt, metadata } = data;
  const { 
    schoolYear,
    allocatedAmount,
    utilizedAmount,
    beneficiarySchools,
    studentBeneficiaries,
    programType,
    updatedAt
  } = metadata;

  const utilizationRate = allocatedAmount && utilizedAmount
    ? Math.round((utilizedAmount / allocatedAmount) * 100)
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-amber-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <GraduationCap className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold group-hover:text-amber-600 transition-colors">
                  {title}
                </h3>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {programType && (
                <p className="text-xs text-muted-foreground">{programType}</p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            SEF
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {excerpt}
          </p>
        )}

        {allocatedAmount && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Budget Utilization</span>
              <span className="font-medium">{utilizationRate}%</span>
            </div>
            <Progress value={utilizationRate} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Allocated: {formatCurrency(allocatedAmount)}</span>
              {utilizedAmount && (
                <span>Spent: {formatCurrency(utilizedAmount)}</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          {schoolYear && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              SY {schoolYear}
            </span>
          )}
          {beneficiarySchools && (
            <span className="flex items-center gap-1">
              <School className="h-3 w-3" />
              {beneficiarySchools} schools
            </span>
          )}
          {studentBeneficiaries && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {studentBeneficiaries.toLocaleString()} students
            </span>
          )}
          {formattedDate && (
            <span className="ml-auto">Updated {formattedDate}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Special Health Fund Card

```typescript
// components/search/cards/SpecialHealthCard.tsx
"use client";

import { HeartPulse, Calendar, ArrowUpRight, Hospital, Users, Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/convex/search/types";

interface SpecialHealthCardProps {
  data: SearchResult;
}

export function SpecialHealthCard({ data }: SpecialHealthCardProps) {
  const { title, excerpt, metadata } = data;
  const { 
    fiscalYear,
    allocatedAmount,
    utilizedAmount,
    beneficiaryFacilities,
    patientBeneficiaries,
    programType,
    healthCategory,
    updatedAt
  } = metadata;

  const utilizationRate = allocatedAmount && utilizedAmount
    ? Math.round((utilizedAmount / allocatedAmount) * 100)
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-rose-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <HeartPulse className="h-5 w-5 text-rose-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold group-hover:text-rose-600 transition-colors">
                  {title}
                </h3>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-center gap-2">
                {programType && (
                  <p className="text-xs text-muted-foreground">{programType}</p>
                )}
                {healthCategory && (
                  <Badge variant="outline" className="text-xs">
                    {healthCategory}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
            SHF
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {excerpt}
          </p>
        )}

        {allocatedAmount && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fund Utilization</span>
              <span className="font-medium">{utilizationRate}%</span>
            </div>
            <Progress value={utilizationRate} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Allocated: {formatCurrency(allocatedAmount)}</span>
              {utilizedAmount && (
                <span>Spent: {formatCurrency(utilizedAmount)}</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          {fiscalYear && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              FY {fiscalYear}
            </span>
          )}
          {beneficiaryFacilities && (
            <span className="flex items-center gap-1">
              <Hospital className="h-3 w-3" />
              {beneficiaryFacilities} facilities
            </span>
          )}
          {patientBeneficiaries && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {patientBeneficiaries.toLocaleString()} patients
            </span>
          )}
          {formattedDate && (
            <span className="ml-auto">Updated {formattedDate}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Department Card

```typescript
// components/search/cards/DepartmentCard.tsx
"use client";

import { Building2, Users, Folder, Phone, Mail, ArrowUpRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/convex/search/types";

interface DepartmentCardProps {
  data: SearchResult;
}

export function DepartmentCard({ data }: DepartmentCardProps) {
  const { title, excerpt, metadata } = data;
  const { 
    departmentCode,
    parentDepartment,
    employeeCount,
    activeProjectsCount,
    email,
    phone,
    headName,
    updatedAt
  } = metadata;

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-indigo-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Building2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold group-hover:text-indigo-600 transition-colors">
                  {title}
                </h3>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {departmentCode && (
                <p className="text-xs text-muted-foreground font-mono">
                  Code: {departmentCode}
                </p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
            Department
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {excerpt}
          </p>
        )}

        {headName && (
          <div className="bg-indigo-50 rounded-lg p-3">
            <p className="text-xs text-indigo-600 font-medium">Department Head</p>
            <p className="text-sm font-medium text-indigo-700">{headName}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {employeeCount !== undefined && (
            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
              <Users className="h-3 w-3" />
              {employeeCount} employees
            </span>
          )}
          {activeProjectsCount !== undefined && (
            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
              <Folder className="h-3 w-3" />
              {activeProjectsCount} active projects
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          {parentDepartment && (
            <span>Under: {parentDepartment}</span>
          )}
          {email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {email}
            </span>
          )}
          {phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {phone}
            </span>
          )}
          {formattedDate && (
            <span className="ml-auto">Updated {formattedDate}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Agency/Office Card

```typescript
// components/search/cards/AgencyCard.tsx
"use client";

import { Landmark, MapPin, Phone, Mail, User, Handshake, ArrowUpRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/convex/search/types";

interface AgencyCardProps {
  data: SearchResult;
}

const agencyTypeColors = {
  ngo: "bg-green-100 text-green-800 border-green-200",
  government: "bg-blue-100 text-blue-800 border-blue-200",
  private: "bg-purple-100 text-purple-800 border-purple-200",
  international: "bg-amber-100 text-amber-800 border-amber-200",
};

export function AgencyCard({ data }: AgencyCardProps) {
  const { title, excerpt, metadata } = data;
  const { 
    agencyType,
    contactPerson,
    contactPosition,
    email,
    phone,
    address,
    activePartnerships,
    website,
    updatedAt
  } = metadata;

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Card className="hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-cyan-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Landmark className="h-5 w-5 text-cyan-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold group-hover:text-cyan-600 transition-colors">
                  {title}
                </h3>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {website && (
                <p className="text-xs text-muted-foreground truncate">
                  {website}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">
              Agency
            </Badge>
            {agencyType && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  agencyTypeColors[agencyType as keyof typeof agencyTypeColors]
                )}
              >
                {agencyType}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {excerpt}
          </p>
        )}

        {contactPerson && (
          <div className="bg-cyan-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-600" />
              <div>
                <p className="text-xs text-cyan-600 font-medium">Contact Person</p>
                <p className="text-sm font-medium text-cyan-700">{contactPerson}</p>
                {contactPosition && (
                  <p className="text-xs text-cyan-600">{contactPosition}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activePartnerships !== undefined && (
          <div className="flex items-center gap-2 text-xs">
            <Handshake className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {activePartnerships} active partnership{activePartnerships !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          {address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {address}
            </span>
          )}
          {email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {email}
            </span>
          )}
          {phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {phone}
            </span>
          )}
          {formattedDate && (
            <span className="ml-auto">Updated {formattedDate}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### User Card

```typescript
// components/search/cards/UserCard.tsx
"use client";

import { UserCircle, Building2, Mail, Phone, Shield, Clock, ArrowUpRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/convex/search/types";

interface UserCardProps {
  data: SearchResult;
}

const roleColors = {
  admin: "bg-red-100 text-red-800 border-red-200",
  manager: "bg-purple-100 text-purple-800 border-purple-200",
  officer: "bg-blue-100 text-blue-800 border-blue-200",
  staff: "bg-green-100 text-green-800 border-green-200",
  viewer: "bg-slate-100 text-slate-800 border-slate-200",
};

export function UserCard({ data }: UserCardProps) {
  const { title, excerpt, metadata } = data;
  const { 
    email,
    phone,
    department,
    role,
    position,
    lastActive,
    employeeId,
    isActive
  } = metadata;

  // Get initials for avatar
  const initials = title
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formattedLastActive = lastActive
    ? new Date(lastActive).toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <Card className={cn(
      "hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-orange-500",
      !isActive && "opacity-60"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-orange-200">
              <AvatarFallback className="bg-orange-100 text-orange-700 text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold group-hover:text-orange-600 transition-colors">
                  {title}
                </h3>
                {!isActive && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Inactive
                  </Badge>
                )}
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {position && (
                <p className="text-xs text-muted-foreground">{position}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              User
            </Badge>
            {role && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  roleColors[role as keyof typeof roleColors] || "bg-slate-100 text-slate-800"
                )}
              >
                {role}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {department && (
            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded">
              <Building2 className="h-3 w-3" />
              {department}
            </span>
          )}
          {employeeId && (
            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded font-mono">
              ID: {employeeId}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          {email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {email}
            </span>
          )}
          {phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {phone}
            </span>
          )}
          {formattedLastActive && (
            <span className="ml-auto flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last active {formattedLastActive}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Complete Search Page

```typescript
// app/(dashboard)/search/page.tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/search/SearchInput";
import { CategorySidebar } from "@/components/search/CategorySidebar";
import { SearchResults } from "@/components/search/SearchResults";
import { Separator } from "@/components/ui/separator";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  
  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with Search */}
        <div className="p-6 border-b bg-card">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold mb-4">Search</h1>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search projects, budgets, trust funds, special programs..."
              className="text-lg"
            />
          </div>
        </div>

        {/* Active Filter Indicator */}
        {activeCategory && (
          <div className="px-6 py-2 bg-muted/50 border-b flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Showing:</span>
            <span className="text-sm font-medium capitalize">
              {activeCategory.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <button
              onClick={() => setActiveCategory(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline ml-2"
            >
              Clear filter
            </button>
          </div>
        )}

        <Separator />

        {/* Results */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            {query ? (
              <SearchResults 
                query={query} 
                activeCategory={activeCategory}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">Enter a search term to get started</p>
                <p className="text-sm mt-2">
                  Search across projects, budgets, trust funds, and special programs
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar - Category Filter */}
      <CategorySidebar
        query={query}
        activeCategory={activeCategory}
        onCategorySelect={setActiveCategory}
      />
    </div>
  );
}
```

---

*Component Examples for PPDO Search System v2.0 - Right Sidebar Layout*
