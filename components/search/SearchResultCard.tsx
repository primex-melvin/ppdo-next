"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { SearchResult, SearchApiResult, EntityType } from "@/convex/search/types";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get display label for entity type
 */
function getEntityTypeLabel(entityType: EntityType): string {
  const labels: Record<EntityType, string> = {
    project: "Project",
    twentyPercentDF: "20% DF",
    trustFund: "Trust Fund",
    specialEducationFund: "Special Education Fund",
    specialHealthFund: "Special Health Fund",
    department: "Department",
    agency: "Agency",
    user: "User",
  };
  return labels[entityType] || entityType;
}

/**
 * Get display label for matched field
 * Converts field names like "primaryText" to readable labels like "Title"
 */
function getFieldLabel(field: string): string {
  const fieldLabels: Record<string, string> = {
    primaryText: "Title",
    secondaryText: "Description",
    normalizedPrimaryText: "Title",
    normalizedSecondaryText: "Description",
    tokens: "Keywords",
    status: "Status",
    year: "Year",
  };
  return fieldLabels[field] || field;
}

/**
 * Format timestamp to readable date string
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface HighlightTextProps {
  html: string;
  className?: string;
}

/**
 * Component to render highlighted text with <mark> tags
 * Uses dangerouslySetInnerHTML to render the pre-highlighted HTML
 */
function HighlightText({ html, className }: HighlightTextProps) {
  if (!html) return null;

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SearchResultCardProps {
  result: SearchApiResult | SearchResult;
  index: number; // For stagger animation delay
  onClick?: () => void;
}

/**
 * Search Result Card Component
 *
 * Features:
 * - Card layout with header, content, and footer
 * - Text highlighting visualization
 * - Source navigation links with loading state
 * - Date metadata display
 * - Cascade animations with stagger delay
 * - Mobile responsive touch targets (min 44px)
 */
export function SearchResultCard({ result, index, onClick }: SearchResultCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Handle both SearchApiResult (new) and SearchResult (legacy) types
  const apiResult = result as SearchApiResult;
  const legacyResult = result as SearchResult;
  
  const { indexEntry, highlights, matchedFields } = apiResult;
  
  // Support both matchScore (legacy) and relevanceScore (new)
  const matchScore = legacyResult.matchScore ?? Math.round((apiResult.relevanceScore ?? 0) * 100);
  
  // Support both displayUrl (legacy) and sourceUrl (new)
  const sourceUrl = apiResult.sourceUrl || legacyResult.displayUrl || legacyResult.sourceUrl || "#";
  
  const { entityType, primaryText, secondaryText, createdAt, updatedAt } = indexEntry;

  /**
   * Handle card click - navigate to source with loading state
   */
  const handleClick = () => {
    if (isLoading || sourceUrl === "#") return;
    
    if (onClick) {
      onClick();
      return;
    }

    setIsLoading(true);
    router.push(sourceUrl);
  };

  /**
   * Handle footer button click - separate handler to prevent event bubbling issues
   */
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleClick();
  };

  // Calculate animation delay based on index for cascade effect
  const animationDelay = `${index * 100}ms`;

  // Format match score as percentage
  const matchScorePercentage = Math.min(100, Math.max(0, matchScore));

  return (
    <Card
      className={cn(
        "relative cursor-pointer transition-all duration-300",
        "min-h-[120px] sm:min-h-[140px]",
        "hover:shadow-lg hover:border-[#15803D]/30",
        "animate-fade-in-up",
        "touch-manipulation", // Optimize for touch devices
        isLoading && "pointer-events-none opacity-80"
      )}
      style={{ animationDelay }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Search result: ${primaryText}`}
    >
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-black/50 rounded-xl">
          <div className="flex items-center gap-2 text-[#15803D]">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Opening...</span>
          </div>
        </div>
      )}

      {/* Card Header - Entity Type Badge + Match Score */}
      <div className="px-3 sm:px-6 pt-3 sm:pt-5 pb-2">
        <div className="flex items-center justify-between gap-3">
          {/* Entity Type Badge */}
          <Badge
            variant="secondary"
            className="bg-[#15803D]/10 text-[#15803D] hover:bg-[#15803D]/20 font-medium text-xs sm:text-sm px-2.5 py-1 sm:py-0.5"
          >
            {getEntityTypeLabel(entityType)}
          </Badge>

          {/* Match Score */}
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
            <span className="font-medium text-[#15803D]">
              {matchScorePercentage}%
            </span>
            <span>match</span>
          </div>
        </div>
      </div>

      {/* Card Content - Highlighted Title, Description, Matched Fields, Date */}
      <CardContent className="px-3 sm:px-6 py-2 space-y-3">
        {/* Highlighted Title */}
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold leading-snug line-clamp-2">
          {highlights?.primaryText ? (
            <HighlightText html={highlights.primaryText} />
          ) : (
            primaryText
          )}
        </h3>

        {/* Highlighted Description */}
        {(highlights?.secondaryText || secondaryText) && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {highlights?.secondaryText ? (
              <HighlightText html={highlights.secondaryText} />
            ) : (
              secondaryText
            )}
          </p>
        )}

        {/* Matched Fields Chips */}
        {matchedFields && matchedFields.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground">Matched in:</span>
            {matchedFields.slice(0, 3).map((field) => (
              <Badge
                key={field}
                variant="outline"
                className="text-xs font-normal px-2 py-0.5 border-stone-200 dark:border-stone-700"
              >
                {getFieldLabel(field)}
              </Badge>
            ))}
            {matchedFields.length > 3 && (
              <Badge
                variant="outline"
                className="text-xs font-normal px-2 py-0.5 border-stone-200 dark:border-stone-700"
              >
                +{matchedFields.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Date Metadata */}
        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
          <span>
            Created: <time dateTime={new Date(createdAt).toISOString()}>{formatDate(createdAt)}</time>
          </span>
          {updatedAt !== createdAt && (
            <>
              <span className="text-stone-300 dark:text-stone-600">•</span>
              <span>
                Updated: <time dateTime={new Date(updatedAt).toISOString()}>{formatDate(updatedAt)}</time>
              </span>
            </>
          )}
        </div>
      </CardContent>

      {/* Card Footer - Source Link Button */}
      <CardFooter className="px-3 sm:px-6 pt-2 pb-3 sm:pb-5">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-full sm:w-auto",
            "h-11 sm:h-9", // 44px min touch target on mobile
            "text-xs sm:text-sm",
            "border-[#15803D]/30 text-[#15803D] hover:bg-[#15803D]/10 hover:text-[#15803D]",
            "transition-colors duration-200",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
          onClick={handleButtonClick}
          disabled={isLoading || sourceUrl === "#"}
          aria-label={isLoading ? "Opening link..." : "Open source link"}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default SearchResultCard;
export { HighlightText, getEntityTypeLabel, getFieldLabel, formatDate };
