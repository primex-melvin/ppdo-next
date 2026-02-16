"use client";

import React from "react";
import { ArrowUpDown, Check, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SortOption, SORT_OPTIONS } from "@/types/sort";

interface SortDropdownProps {
  /** Currently selected sort option value */
  value?: SortOption;
  /** Callback when sort option changes */
  onChange: (value: SortOption) => void;
  /** Optional tooltip text */
  tooltipText?: string;
  /** Optional placeholder text */
  placeholder?: string;
  /** Optional className */
  className?: string;
}

/**
 * Sort Dropdown Component
 *
 * A reusable dropdown for selecting sort options with:
 * - Tooltip support for better UX
 * - Visual indicators for sort direction
 * - Responsive design (label hidden on mobile)
 * - Dark mode support
 */
export function SortDropdown({
  value,
  onChange,
  tooltipText = "Sort items",
  placeholder = "Sort By",
  className,
}: SortDropdownProps) {
  const handleSelect = (optionValue: SortOption) => {
    onChange(optionValue);
  };

  // Get display label for current value
  const currentOption = SORT_OPTIONS.find((opt) => opt.value === value);
  const displayLabel = currentOption?.label || placeholder;

  // Helper to determine direction from option value
  const getDirection = (optionValue: SortOption): "asc" | "desc" => {
    if (optionValue.endsWith("Asc")) return "asc";
    if (optionValue.endsWith("Desc")) return "desc";
    return "desc"; // default for lastModified
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={className}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <span className="hidden sm:inline truncate max-w-[150px]">{displayLabel}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SORT_OPTIONS.map((option) => {
                  const direction = getDirection(option.value);
                  const isActive = value === option.value;
                  
                  return (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        {direction === "asc" ? (
                          <ArrowUp className="w-3.5 h-3.5 text-zinc-400" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        {option.label}
                      </span>
                      {isActive && (
                        <Check className="w-4 h-4 text-blue-500" />
                      )}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export type { SortDropdownProps };
