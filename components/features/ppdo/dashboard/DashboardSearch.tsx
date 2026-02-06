"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, X, Wallet, TrendingUp, LockKeyhole, GraduationCap, HeartPulse, FileText, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Category definitions with icons
const categories = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "project", label: "Projects", icon: Wallet },
  { id: "twentyPercentDF", label: "20% DF", icon: TrendingUp },
  { id: "trustFund", label: "Trust Funds", icon: LockKeyhole },
  { id: "specialEducationFund", label: "Special Education", icon: GraduationCap },
  { id: "specialHealthFund", label: "Special Health", icon: HeartPulse },
  { id: "particular", label: "Particulars", icon: FileText },
] as const;

type CategoryId = typeof categories[number]["id"];

// Type for search results
interface SearchResult {
  id: string;
  type: "project" | "twentyPercentDF" | "trustFund" | "specialEducationFund" | "specialHealthFund" | "particular";
  title: string;
  subtitle?: string;
  description?: string;
  year?: number;
  amount: number;
  utilized?: number;
  status?: string;
  office?: string;
  createdAt: number;
}

interface DashboardSearchProps {
  onClose: () => void;
  isActive: boolean;
}

// Close button component
function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-lg",
        "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700",
        "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-blue-500"
      )}
      aria-label="Close search"
    >
      <X className="w-5 h-5" />
    </button>
  );
}

// Format currency
const formatCurrency = (amount: number) => {
  return `₱${amount.toLocaleString("en-PH")}`;
};

// Format date
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Get category color
const getCategoryColor = (type: string) => {
  switch (type) {
    case "project":
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "twentyPercentDF":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
    case "trustFund":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
    case "specialEducationFund":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800";
    case "specialHealthFund":
      return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800";
    case "particular":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
    default:
      return "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
  }
};

// Get category label
const getCategoryLabel = (type: string) => {
  const cat = categories.find((c) => c.id === type);
  return cat?.label || type;
};

export function DashboardSearch({ onClose, isActive }: DashboardSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch search results
  const searchResults = useQuery(
    api.dashboardSearch.searchAll,
    (debouncedQuery || activeCategory !== "all") && isActive
      ? { query: debouncedQuery, category: activeCategory, limit: 100 }
      : "skip"
  );

  // Fetch category counts
  const categoryCounts = useQuery(
    api.dashboardSearch.getCategoryCounts,
    debouncedQuery && isActive ? { query: debouncedQuery } : "skip"
  );

  const isLoading = searchResults === undefined && (debouncedQuery || activeCategory !== "all") && isActive;

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isActive) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isActive, onClose]);

  // Auto-focus input when search becomes active
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    setActiveCategory("all");
  };

  // Only show results when search is active
  if (!isActive) return null;

  return (
    <motion.div
      ref={searchContainerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Search Bar with Close Button */}
      <div className="flex items-center gap-3 max-w-4xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search across all funds and particulars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "w-full pl-12 pr-10 py-4 text-lg rounded-xl",
              "bg-white dark:bg-zinc-900",
              "border-2 border-zinc-200 dark:border-zinc-800",
              "focus:outline-none focus:border-blue-500 dark:focus:border-blue-400",
              "placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
              "transition-all duration-200",
              "shadow-sm hover:shadow-md focus:shadow-lg"
            )}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          )}
        </div>
        <CloseButton onClick={onClose} />
      </div>

      {/* Navigation Tabs */}
      <div className="relative">
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((category) => {
            const Icon = category.icon;
            const count = categoryCounts?.[category.id as keyof typeof categoryCounts] ?? 0;
            const isActive = activeCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm",
                  "transition-all duration-200 border-2",
                  isActive
                    ? "bg-blue-500 text-white border-blue-500 shadow-md"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-zinc-700"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "ml-1 px-2 py-0.5 text-xs rounded-full",
                      isActive
                        ? "bg-blue-400 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Results */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
            <p className="mt-4 text-zinc-500 dark:text-zinc-400">Searching...</p>
          </motion.div>
        ) : searchResults && searchResults.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin"
          >
            <div className="flex items-center justify-between px-1">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Found <span className="font-semibold text-zinc-900 dark:text-zinc-100">{searchResults.length}</span> results
                {debouncedQuery && (
                  <span> for &quot;<span className="font-medium">{debouncedQuery}</span>&quot;</span>
                )}
              </p>
            </div>

            <div className="grid gap-3">
              {searchResults.map((item: SearchResult, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "group p-4 rounded-xl border-2 transition-all duration-200",
                    "bg-white dark:bg-zinc-900",
                    "border-zinc-200 dark:border-zinc-800",
                    "hover:border-blue-300 dark:hover:border-zinc-700",
                    "hover:shadow-md"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Category Badge */}
                    <div
                      className={cn(
                        "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border",
                        getCategoryColor(item.type)
                      )}
                    >
                      {getCategoryLabel(item.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              {item.subtitle}
                            </p>
                          )}
                          {item.description && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Amount */}
                        {item.amount > 0 && (
                          <div className="text-right">
                            <p className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                              {formatCurrency(item.amount)}
                            </p>
                            {item.utilized !== undefined && item.utilized > 0 && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Utilized: {formatCurrency(item.utilized)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                        {item.year && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Year:</span> {item.year}
                          </span>
                        )}
                        {item.status && (
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Status:</span>
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-medium uppercase",
                                item.status === "completed" || item.status === "completed"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : item.status === "ongoing" || item.status === "ongoing"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : item.status === "delayed" || item.status === "delayed"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                              )}
                            >
                              {item.status}
                            </span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="font-medium">Added:</span> {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : debouncedQuery || activeCategory !== "all" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
              <Search className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              No results found
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              {debouncedQuery
                ? `No matches found for "${debouncedQuery}"`
                : "No items in this category"}
            </p>
            {(debouncedQuery || activeCategory !== "all") && (
              <button
                onClick={() => {
                  handleClearSearch();
                  setActiveCategory("all");
                }}
                className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12 text-zinc-400 dark:text-zinc-600"
          >
            <p>Type to search across all funds and particulars</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default DashboardSearch;
