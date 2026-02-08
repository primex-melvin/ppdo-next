"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SearchSkeletonProps {
  count?: number;
  variant?: "default" | "compact" | "detailed";
  className?: string;
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse bg-muted rounded", className)}
      aria-hidden="true"
    />
  );
}

function DefaultSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Badge row */}
          <div className="flex items-center gap-2">
            <SkeletonPulse className="h-5 w-20" />
            <SkeletonPulse className="h-5 w-16" />
          </div>
          {/* Title */}
          <SkeletonPulse className="h-6 w-3/4" />
          {/* Description */}
          <SkeletonPulse className="h-4 w-full" />
          <SkeletonPulse className="h-4 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

function CompactSkeleton() {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <SkeletonPulse className="h-4 w-16" />
          </div>
          <SkeletonPulse className="h-5 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

function DetailedSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Header with badges */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SkeletonPulse className="h-6 w-24" />
              <SkeletonPulse className="h-6 w-20" />
            </div>
            <SkeletonPulse className="h-6 w-12" />
          </div>

          {/* Title */}
          <SkeletonPulse className="h-7 w-4/5" />

          {/* Description lines */}
          <div className="space-y-2">
            <SkeletonPulse className="h-4 w-full" />
            <SkeletonPulse className="h-4 w-full" />
            <SkeletonPulse className="h-4 w-3/4" />
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-4 pt-2">
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-4 w-20" />
            <SkeletonPulse className="h-4 w-16" />
          </div>

          {/* Highlights */}
          <div className="flex flex-wrap gap-2">
            <SkeletonPulse className="h-5 w-28 rounded-full" />
            <SkeletonPulse className="h-5 w-24 rounded-full" />
            <SkeletonPulse className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SearchSkeleton({
  count = 5,
  variant = "default",
  className,
}: SearchSkeletonProps) {
  const SkeletonComponent =
    variant === "compact"
      ? CompactSkeleton
      : variant === "detailed"
        ? DetailedSkeleton
        : DefaultSkeleton;

  return (
    <div
      className={cn("space-y-3", className)}
      role="status"
      aria-label="Loading search results"
    >
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
      <span className="sr-only">Loading search results...</span>
    </div>
  );
}

/**
 * Individual skeleton card for inline use
 */
export function SearchResultSkeleton({
  variant = "default",
  className,
}: Omit<SearchSkeletonProps, "count">) {
  return (
    <div className={className}>
      {variant === "compact" ? (
        <CompactSkeleton />
      ) : variant === "detailed" ? (
        <DetailedSkeleton />
      ) : (
        <DefaultSkeleton />
      )}
    </div>
  );
}

/**
 * Category sidebar skeleton
 */
export function CategorySidebarSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("space-y-2 p-4", className)}
      role="status"
      aria-label="Loading categories"
    >
      <SkeletonPulse className="h-5 w-24 mb-4" />
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <SkeletonPulse className="h-4 w-4 rounded" />
            <SkeletonPulse className="h-4 w-20" />
          </div>
          <SkeletonPulse className="h-4 w-6 rounded-full" />
        </div>
      ))}
      <span className="sr-only">Loading categories...</span>
    </div>
  );
}

/**
 * Input skeleton for search input
 */
export function SearchInputSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative", className)}
      role="status"
      aria-label="Loading search"
    >
      <SkeletonPulse className="h-12 w-full rounded-lg" />
      <span className="sr-only">Loading search input...</span>
    </div>
  );
}
