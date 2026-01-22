// app/dashboard/project/[year]/[particularId]/components/ProjectsTable/ProjectCategoryFilter.tsx

"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, X } from "lucide-react";

interface ProjectCategory {
  _id: string;
  code: string;
  fullName: string;
  colorCode?: string;
}

interface ProjectCategoryFilterProps {
  categories: ProjectCategory[] | undefined;
  selectedCategoryIds: string[];
  onSelectionChange: (categoryIds: string[]) => void;
  accentColor: string;
}

/**
 * YouTube-style category filter pills
 * Horizontal scrollable, sticky on scroll, updates URL
 */
export function ProjectCategoryFilter({
  categories,
  selectedCategoryIds,
  onSelectionChange,
  accentColor,
}: ProjectCategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Check scroll position to show/hide scroll indicators
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftScroll(scrollLeft > 0);
    setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleToggleCategory = (categoryId: string) => {
    const newSelection = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    onSelectionChange(newSelection);
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  if (!categories || categories.length === 0) return null;

  const allCategories = [
    { _id: "all" as any, code: "ALL", fullName: "All Categories" },
    ...categories,
  ];

  return (
    <div className="sticky top-0 z-30 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="relative flex items-center">
        {/* Left Scroll Indicator */}
        {showLeftScroll && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 z-10 h-full px-2 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent"
            aria-label="Scroll left"
          >
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>
        )}

        {/* Scrollable Categories */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 py-3"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Clear All Button (only show when filters active) */}
          {selectedCategoryIds.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border transition-colors bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}

          {/* Category Pills */}
          {allCategories.map((category) => {
            const isAll = category._id === "all";
            const isSelected = isAll
              ? selectedCategoryIds.length === 0
              : selectedCategoryIds.includes(category._id);

            return (
              <button
                key={category._id}
                onClick={() => {
                  if (isAll) {
                    handleClearAll();
                  } else {
                    handleToggleCategory(category._id);
                  }
                }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border transition-all"
                style={
                  isSelected
                    ? {
                        backgroundColor: accentColor,
                        borderColor: accentColor,
                        color: "white",
                      }
                    : undefined
                }
                {...(!isSelected && {
                  className:
                    "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border transition-colors bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800",
                })}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                {category.fullName}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Indicator */}
        {showRightScroll && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 z-10 h-full px-2 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent"
            aria-label="Scroll right"
          >
            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}