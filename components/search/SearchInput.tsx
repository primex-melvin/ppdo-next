"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { EntityType } from "@/convex/search/types";

// Suggestion item from API (partial SearchSuggestion)
interface SuggestionItem {
  text: string;
  normalizedText: string;
  entityType?: EntityType;
  entityId?: string;
  secondaryText?: string;
  relevanceScore?: number;
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSuggestionSelect?: (suggestion: SuggestionItem) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  onSuggestionSelect,
  placeholder = "Search projects, departments, users...",
  className,
}: SearchInputProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const suggestionsRef = React.useRef<HTMLDivElement>(null);
  const debounceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch suggestions with debounce
  const suggestions = useQuery(
    api.search.index.suggestions,
    localValue.length >= 2 ? { query: localValue, limit: 8 } : "skip"
  );

  // Update local value when prop changes
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setSelectedIndex(-1);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer (300ms debounce)
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
      if (newValue.length >= 2) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }, 300);
  };

  // Clear search
  const handleClear = () => {
    setLocalValue("");
    onChange("");
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    setLocalValue(suggestion.text);
    onChange(suggestion.text);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSuggestionSelect?.(suggestion);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        setShowSuggestions(true);
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex] as SuggestionItem);
        } else {
          setShowSuggestions(false);
        }
        break;

      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close suggestions on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup debounce timer
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Get suggestion type badge color
  const getSuggestionBadgeColor = (type: string) => {
    switch (type) {
      case "entity":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "keyword":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "recent":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
      case "popular":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (localValue.length >= 2) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-10 h-12 sm:h-14 text-base w-full"
          aria-label="Search"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={showSuggestions}
        />
        {localValue && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 sm:h-9 sm:w-9"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          id="search-suggestions"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-background border border-input rounded-md shadow-lg z-50 max-h-96 overflow-y-auto dark:bg-gray-900/95"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`suggestion-${suggestion.text}-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSuggestionClick(suggestion as SuggestionItem)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                "w-full px-4 py-3 sm:py-3.5 text-left flex items-center justify-between gap-3 transition-colors min-h-[48px]",
                "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
                index === selectedIndex &&
                  "bg-accent text-accent-foreground dark:bg-accent/50"
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Search className="size-4 text-muted-foreground shrink-0" />
                <span className="truncate text-sm sm:text-base">{suggestion.text}</span>
              </div>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full shrink-0",
                  getSuggestionBadgeColor("entity")
                )}
              >
                entity
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
