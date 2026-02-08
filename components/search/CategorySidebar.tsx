"use client";

import * as React from "react";
import {
  Folder,
  Percent,
  Wallet,
  GraduationCap,
  HeartPulse,
  Building2,
  Landmark,
  UserCircle,
  ListFilter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/convex/search/types";

interface CategorySidebarProps {
  activeCategory: EntityType | "all";
  counts: Partial<Record<EntityType, number>>;
  totalCount: number;
  onCategoryChange: (category: EntityType | "all") => void;
  className?: string;
}

interface CategoryConfig {
  type: EntityType | "all";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  ringColor: string;
}

const categories: CategoryConfig[] = [
  {
    type: "all",
    label: "All Results",
    icon: ListFilter,
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
    ringColor: "ring-gray-400 dark:ring-gray-500",
  },
  {
    type: "project",
    label: "Project",
    icon: Folder,
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    ringColor: "ring-blue-400 dark:ring-blue-500",
  },
  {
    type: "twentyPercentDF",
    label: "20% DF",
    icon: Percent,
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    ringColor: "ring-emerald-400 dark:ring-emerald-500",
  },
  {
    type: "trustFund",
    label: "Trust Funds",
    icon: Wallet,
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    ringColor: "ring-purple-400 dark:ring-purple-500",
  },
  {
    type: "specialEducationFund",
    label: "Special Education",
    icon: GraduationCap,
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    ringColor: "ring-amber-400 dark:ring-amber-500",
  },
  {
    type: "specialHealthFund",
    label: "Special Health",
    icon: HeartPulse,
    color: "text-rose-700 dark:text-rose-300",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
    ringColor: "ring-rose-400 dark:ring-rose-500",
  },
  {
    type: "department",
    label: "Department",
    icon: Building2,
    color: "text-indigo-700 dark:text-indigo-300",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    ringColor: "ring-indigo-400 dark:ring-indigo-500",
  },
  {
    type: "agency",
    label: "Agency/Office",
    icon: Landmark,
    color: "text-cyan-700 dark:text-cyan-300",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
    ringColor: "ring-cyan-400 dark:ring-cyan-500",
  },
  {
    type: "user",
    label: "User",
    icon: UserCircle,
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    ringColor: "ring-orange-400 dark:ring-orange-500",
  },
];

export function CategorySidebar({
  activeCategory,
  counts,
  totalCount,
  onCategoryChange,
  className,
}: CategorySidebarProps) {
  const getCount = (type: EntityType | "all"): number => {
    if (type === "all") return totalCount;
    return counts[type] || 0;
  };

  return (
    <aside
      className={cn(
        "fixed right-0 top-0 pt-36 h-screen w-64 bg-background border-l border-input overflow-y-auto",
        "dark:bg-gray-950/50 dark:border-gray-800",
        className
      )}
    >
      <div className="p-4 space-y-1">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Filter by Category
        </h2>

        {categories.map((category) => {
          const Icon = category.icon;
          const count = getCount(category.type);
          const isActive = activeCategory === category.type;
          const isDisabled = count === 0 && category.type !== "all";

          return (
            <button
              key={category.type}
              onClick={() => !isDisabled && onCategoryChange(category.type)}
              disabled={isDisabled}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
                isActive && [
                  "ring-2",
                  category.ringColor,
                  category.bgColor,
                  category.color,
                ],
                isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent",
                !isActive && !isDisabled && "hover:shadow-sm"
              )}
              aria-pressed={isActive}
              aria-disabled={isDisabled}
            >
              <div
                className={cn(
                  "flex items-center justify-center size-8 rounded-md shrink-0",
                  isActive ? category.bgColor : "bg-muted dark:bg-muted/30"
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    isActive ? category.color : "text-muted-foreground"
                  )}
                />
              </div>

              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium truncate">
                  {category.label}
                </div>
              </div>

              <div
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full shrink-0",
                  isActive
                    ? cn(category.bgColor, category.color, "ring-1", category.ringColor)
                    : "bg-muted text-muted-foreground dark:bg-muted/30"
                )}
              >
                {count.toLocaleString()}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
