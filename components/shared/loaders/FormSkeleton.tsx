// components/shared/loaders/FormSkeleton.tsx

"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Props for FormSkeleton component
 */
export interface FormSkeletonProps {
  /** Number of form fields to display */
  fields?: number;
  /** Use 2-column layout (responsive) */
  twoColumn?: boolean;
  /** Show submit buttons at the bottom */
  showActions?: boolean;
  /** Custom className for container */
  className?: string;
}

/**
 * Form skeleton loader component
 *
 * Displays a shimmering placeholder matching standard form layout.
 * Prevents layout shift when forms are loading.
 *
 * @example
 * // Basic usage:
 * if (isLoading) return <FormSkeleton />;
 *
 * @example
 * // Two-column layout with actions:
 * if (isLoading) {
 *   return (
 *     <FormSkeleton
 *       fields={8}
 *       twoColumn={true}
 *       showActions={true}
 *     />
 *   );
 * }
 */
export function FormSkeleton({
  fields = 6,
  twoColumn = false,
  showActions = true,
  className = "",
}: FormSkeletonProps) {
  const gridClass = twoColumn
    ? "grid grid-cols-1 md:grid-cols-2 gap-4"
    : "space-y-4";

  return (
    <div className={`bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 ${className}`}>
      {/* Form Fields */}
      <div className={gridClass}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={`field-${i}`} className="space-y-2">
            {/* Label */}
            <Skeleton className="h-4 w-24" />
            {/* Input */}
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-zinc-200 dark:border-zinc-800">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </div>
  );
}

/**
 * Compact form skeleton for modals or smaller forms
 *
 * @example
 * if (isLoading) return <CompactFormSkeleton fields={4} />;
 */
export function CompactFormSkeleton({
  fields = 4,
  showActions = true,
}: {
  fields?: number;
  showActions?: boolean;
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={`field-${i}`} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}

      {showActions && (
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      )}
    </div>
  );
}

/**
 * Sectioned form skeleton with multiple sections and headings
 *
 * @example
 * if (isLoading) return <SectionedFormSkeleton sections={3} />;
 */
export function SectionedFormSkeleton({
  sections = 2,
  fieldsPerSection = 4,
}: {
  sections?: number;
  fieldsPerSection?: number;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 space-y-6">
      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <div key={`section-${sectionIndex}`} className="space-y-4">
          {/* Section Header */}
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>

          {/* Section Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: fieldsPerSection }).map((_, fieldIndex) => (
              <div key={`field-${sectionIndex}-${fieldIndex}`} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>

          {/* Divider (except for last section) */}
          {sectionIndex < sections - 1 && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 my-4" />
          )}
        </div>
      ))}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

/**
 * Card form skeleton for wizard-style multi-step forms
 *
 * @example
 * if (isLoading) return <CardFormSkeleton />;
 */
export function CardFormSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <Skeleton className="w-10 h-10 rounded-full" />
            {step < 3 && <Skeleton className="h-1 flex-1 mx-2" />}
          </div>
        ))}
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        {/* Title */}
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-6" />

        {/* Fields */}
        <div className="space-y-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Inline form skeleton for small forms embedded in pages
 *
 * @example
 * if (isLoading) return <InlineFormSkeleton fields={3} />;
 */
export function InlineFormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="flex items-end gap-3">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-24" />
    </div>
  );
}
