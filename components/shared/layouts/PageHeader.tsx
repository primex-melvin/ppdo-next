// components/shared/layouts/PageHeader.tsx

"use client";

import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Breadcrumb item for navigation
 */
export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Optional href for navigation */
  href?: string;
  /** Optional click handler */
  onClick?: () => void;
}

/**
 * Props for PageHeader component
 */
export interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  description?: string;
  /** Optional icon to display */
  icon?: LucideIcon;
  /** Icon color theme (used for background and icon colors) */
  iconColor?:
    | "blue"
    | "green"
    | "purple"
    | "orange"
    | "red"
    | "yellow"
    | "indigo"
    | "pink";
  /** Breadcrumb items for navigation */
  breadcrumbItems?: BreadcrumbItem[];
  /** Action buttons/components to display on the right */
  action?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to apply the Cinzel font to the title */
  useCinzelFont?: boolean;
  /** Whether this header should be hidden in print mode */
  noPrint?: boolean;
}

/**
 * Generic PageHeader component for consistent page headers across the application
 *
 * Provides a standardized header layout with:
 * - Title with optional icon
 * - Description text
 * - Breadcrumb navigation
 * - Action buttons area
 * - Responsive design
 * - Print-friendly option
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Budget Tracking"
 *   description="Monitor budget allocation and utilization"
 *   icon={Wallet}
 *   iconColor="blue"
 *   action={<ActivityLogSheet type="budgetItem" />}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Projects"
 *   description="Manage your projects"
 *   breadcrumbItems={[
 *     { label: "Dashboard", href: "/dashboard" },
 *     { label: "2024", href: "/dashboard/2024" },
 *     { label: "Projects" }
 *   ]}
 *   action={
 *     <div className="flex gap-2">
 *       <Button>Export</Button>
 *       <Button>Add New</Button>
 *     </div>
 *   }
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  iconColor = "blue",
  breadcrumbItems,
  action,
  className,
  useCinzelFont = true,
  noPrint = true,
}: PageHeaderProps) {
  // Color mappings for icon background and text
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    green:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    purple:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
    orange:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
    red: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    yellow:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
    indigo:
      "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
    pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300",
  };

  return (
    <div className={cn("mb-6", noPrint && "no-print", className)}>
      {/* Breadcrumbs (if provided) */}
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <nav className="mb-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-zinc-400">/</span>}
              {item.href || item.onClick ? (
                <button
                  onClick={item.onClick}
                  className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                >
                  {item.label}
                </button>
              ) : (
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Header Content */}
      <div className="flex items-center justify-between gap-4 mb-1 flex-wrap">
        {/* Left: Icon + Title + Description */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {Icon && (
            <div
              className={cn(
                "p-3 rounded-lg flex-shrink-0",
                colorClasses[iconColor]
              )}
            >
              <Icon className="w-6 h-6" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1
              className={cn(
                "text-2xl sm:text-3xl md:text-4xl font-semibold text-zinc-900 dark:text-zinc-100",
                Icon ? "truncate" : ""
              )}
              style={useCinzelFont ? { fontFamily: "var(--font-cinzel), serif" } : undefined}
              title={title}
            >
              {title}
            </h1>

            {description && (
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Action Buttons */}
        {action && (
          <div className="flex items-center gap-2 flex-shrink-0">{action}</div>
        )}
      </div>
    </div>
  );
}

/**
 * Simplified PageHeader for pages without icons
 */
export function SimplePageHeader({
  title,
  description,
  action,
  className,
}: Pick<PageHeaderProps, "title" | "description" | "action" | "className">) {
  return (
    <div className={cn("mb-6 no-print", className)}>
      <div className="flex items-center justify-between gap-4 mb-1">
        <h1
          className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          {title}
        </h1>

        {action && action}
      </div>

      {description && (
        <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
      )}
    </div>
  );
}
