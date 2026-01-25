// components/shared/ui/EmptyState.tsx

"use client";

import React from "react";
import { LucideIcon, FileX, Search, Inbox, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemedButton } from "../themed/ThemedButton";

/**
 * Props for EmptyState component
 */
export interface EmptyStateProps {
  /** Icon to display (defaults to FileX) */
  icon?: LucideIcon;
  /** Main title/message */
  title: string;
  /** Optional description/subtitle */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    variant?: "primary" | "default" | "outline";
  };
  /** Optional secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Custom className for container */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Generic empty state component
 *
 * Displays a consistent empty state UI with optional icon, title, description, and action buttons.
 * Use this throughout the application for:
 * - Empty tables/lists
 * - No search results
 * - No data available
 * - Error states
 *
 * @example
 * // Basic usage:
 * <EmptyState
 *   title="No results found"
 *   description="Try adjusting your search or filters"
 * />
 *
 * @example
 * // With action button:
 * <EmptyState
 *   icon={Plus}
 *   title="No projects yet"
 *   description="Get started by creating your first project"
 *   action={{
 *     label: "Create Project",
 *     onClick: handleCreate,
 *     icon: Plus,
 *     variant: "primary"
 *   }}
 * />
 */
export function EmptyState({
  icon: Icon = FileX,
  title,
  description,
  action,
  secondaryAction,
  className = "",
  size = "md",
}: EmptyStateProps) {
  // Size-based styling
  const sizeClasses = {
    sm: {
      container: "h-48",
      icon: "w-8 h-8 mb-2",
      title: "text-sm",
      description: "text-xs",
    },
    md: {
      container: "h-64",
      icon: "w-12 h-12 mb-3",
      title: "text-sm",
      description: "text-sm",
    },
    lg: {
      container: "h-96",
      icon: "w-16 h-16 mb-4",
      title: "text-base",
      description: "text-sm",
    },
  };

  const styles = sizeClasses[size];

  return (
    <div
      className={`flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 ${styles.container} ${className}`}
    >
      {/* Icon */}
      <Icon className={`${styles.icon} text-zinc-300 dark:text-zinc-600`} />

      {/* Title */}
      <p className={`${styles.title} font-medium text-zinc-600 dark:text-zinc-400 mb-1`}>
        {title}
      </p>

      {/* Description */}
      {description && (
        <p className={`${styles.description} text-zinc-500 dark:text-zinc-500 mb-4 text-center max-w-md`}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-2">
          {action && (
            <ThemedButton
              variant={action.variant || "primary"}
              onClick={action.onClick}
              icon={action.icon}
              size={size === "sm" ? "sm" : "default"}
            >
              {action.label}
            </ThemedButton>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              size={size === "sm" ? "sm" : "default"}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Specialized empty state for search results
 *
 * @example
 * <SearchEmptyState searchQuery="budget 2024" onClear={handleClear} />
 */
export function SearchEmptyState({
  searchQuery,
  onClear,
}: {
  searchQuery: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={
        searchQuery
          ? `No results for "${searchQuery}". Try adjusting your search.`
          : "Try adjusting your search or filters"
      }
      action={
        onClear
          ? {
              label: "Clear Search",
              onClick: onClear,
              variant: "outline",
            }
          : undefined
      }
    />
  );
}

/**
 * Specialized empty state for empty collections
 *
 * @example
 * <CollectionEmptyState
 *   title="No projects yet"
 *   description="Create your first project to get started"
 *   onAction={handleCreate}
 *   actionLabel="Create Project"
 * />
 */
export function CollectionEmptyState({
  title,
  description,
  onAction,
  actionLabel = "Add New",
  icon,
}: {
  title: string;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
  icon?: LucideIcon;
}) {
  return (
    <EmptyState
      icon={icon || Inbox}
      title={title}
      description={description}
      action={
        onAction
          ? {
              label: actionLabel,
              onClick: onAction,
              variant: "primary",
            }
          : undefined
      }
    />
  );
}

/**
 * Specialized empty state for error conditions
 *
 * @example
 * <ErrorEmptyState
 *   title="Failed to load data"
 *   description="An error occurred while fetching the data"
 *   onRetry={handleRetry}
 * />
 */
export function ErrorEmptyState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description || "An error occurred. Please try again."}
      action={
        onRetry
          ? {
              label: "Try Again",
              onClick: onRetry,
              variant: "outline",
            }
          : undefined
      }
    />
  );
}

/**
 * Compact empty state for table rows
 * Renders as a table row with full colspan
 *
 * @example
 * <tbody>
 *   {data.length === 0 ? (
 *     <TableEmptyState colSpan={8} message="No records found" />
 *   ) : (
 *     data.map(row => <TableRow key={row.id} {...row} />)
 *   )}
 * </tbody>
 */
export function TableEmptyState({
  colSpan,
  message = "No data found",
  searchMode = false,
}: {
  colSpan: number;
  message?: string;
  searchMode?: boolean;
}) {
  const Icon = searchMode ? Search : FileX;

  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <Icon className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            {message}
          </p>
          {searchMode && (
            <p className="text-xs text-zinc-500 dark:text-zinc-500">
              Try adjusting your search or filters
            </p>
          )}
        </div>
      </td>
    </tr>
  );
}

/**
 * Inline empty state for smaller spaces
 *
 * @example
 * <InlineEmptyState message="No items selected" />
 */
export function InlineEmptyState({
  message,
  icon: Icon = Inbox,
}: {
  message: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 py-4">
      <Icon className="w-5 h-5 text-zinc-400 dark:text-zinc-600" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
