// components/ppdo/odpp/data-tables/core/TableEmptyState.tsx

"use client";

import React from "react";
import { FileX } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TableEmptyStateProps {
  /** Main message to display */
  message?: string;
  /** Optional sub-message */
  subMessage?: string;
  /** Icon to display (default: FileX) */
  icon?: React.ComponentType<{ className?: string }>;
  /** Action button config */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** CSS class for container */
  className?: string;
  /**
   * When true, renders as a table row (<tr>) for use inside <tbody>.
   * When false, renders as a div container.
   * @default true
   */
  asTableRow?: boolean;
  /**
   * Number of columns to span when asTableRow is true.
   * @default 1
   */
  colSpan?: number;
}

/**
 * Unified empty state component for tables.
 * Can render as a table row (default) or as a div container.
 */
export function TableEmptyState({
  message = "No results found",
  subMessage,
  icon: Icon = FileX,
  action,
  className = "",
  asTableRow = true,
  colSpan = 1,
}: TableEmptyStateProps) {
  const content = (
    <div
      className={`flex flex-col items-center justify-center py-12 ${className}`}
    >
      <Icon className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-3" />
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
        {message}
      </p>
      {subMessage && (
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-3">
          {subMessage}
        </p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="mt-2"
        >
          {action.label}
        </Button>
      )}
    </div>
  );

  if (asTableRow) {
    return (
      <tr>
        <td colSpan={colSpan} className="px-4">
          {content}
        </td>
      </tr>
    );
  }

  return content;
}

/**
 * Simple text-only empty state for inline use.
 * Renders as a table row with minimal styling.
 */
export function TableEmptyStateSimple({
  message = "No results found",
  colSpan = 1,
  className = "",
}: {
  message?: string;
  colSpan?: number;
  className?: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={`px-4 py-12 text-center text-sm text-zinc-500 ${className}`}
      >
        {message}
      </td>
    </tr>
  );
}
