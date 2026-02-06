/**
 * Shared PageHeaderWithIcon Component
 *
 * Standardized page header with icon box pattern used across all table pages.
 * Matches the Budget Tracking 2025 reference design.
 */

"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export interface PageHeaderWithIconProps {
  icon: LucideIcon;
  iconBgClass: string;
  iconTextClass: string;
  title: string;
  description?: string;
  actionButton?: React.ReactNode;
  className?: string;
}

export function PageHeaderWithIcon({
  icon: Icon,
  iconBgClass,
  iconTextClass,
  title,
  description,
  actionButton,
  className = "",
}: PageHeaderWithIconProps) {
  return (
    <div className={`mb-6 no-print ${className}`}>
      <div className="flex items-center justify-between gap-4 mb-1">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${iconBgClass}`}>
            <Icon className={`w-6 h-6 ${iconTextClass}`} />
          </div>
          <div>
            <h1
              className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {title}
            </h1>
            {description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {description}
              </p>
            )}
          </div>
        </div>

        {actionButton && (
          <div className="flex-shrink-0">
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeaderWithIcon;
