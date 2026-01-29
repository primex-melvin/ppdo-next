// components/ActivityLogSheet/ActivityLogFilters.tsx

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityLogType } from "./types";

interface ActivityLogFiltersProps {
  searchQuery: string;
  actionFilter: string;
  type: ActivityLogType;
  onSearchChange: (query: string) => void;
  onActionChange: (action: string) => void;
}

export function ActivityLogFilters({
  searchQuery,
  actionFilter,
  type,
  onSearchChange,
  onActionChange,
}: ActivityLogFiltersProps) {
  const actionOptions = getActionOptions(type);

  return (
    <div className="px-4 py-3 space-y-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          type="text"
          placeholder={getSearchPlaceholder(type)}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9 h-9 text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Action Filter */}
      <Select value={actionFilter} onValueChange={onActionChange}>
        <SelectTrigger className="h-9 text-sm bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <SelectValue placeholder="Filter by action" />
        </SelectTrigger>
        <SelectContent>
          {actionOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function getActionOptions(type: ActivityLogType) {
  if (type === "breakdown" || type === "twentyPercentDFBreakdown") {
    return [
      { value: "all", label: "All Actions" },
      { value: "created", label: "Created" },
      { value: "updated", label: "Updated" },
      { value: "deleted", label: "Deleted" },
      { value: "bulk_created", label: "Bulk Created" },
      { value: "bulk_updated", label: "Bulk Updated" },
      { value: "bulk_deleted", label: "Bulk Deleted" },
    ];
  }

  if (type === "trustFund" || type === "specialEducationFund" || type === "specialHealthFund") {
    return [
      { value: "all", label: "All Actions" },
      { value: "created", label: "Created" },
      { value: "updated", label: "Updated" },
      { value: "deleted", label: "Deleted" },
      { value: "restored", label: "Restored" },
    ];
  }

  if (type === "project" || type === "twentyPercentDF") {
    return [
      { value: "all", label: "All Actions" },
      { value: "created", label: "Created" },
      { value: "updated", label: "Updated" },
      { value: "deleted", label: "Deleted" },
      { value: "restored", label: "Restored" },
    ];
  }

  // Budget items
  return [
    { value: "all", label: "All Actions" },
    { value: "created", label: "Created" },
    { value: "updated", label: "Updated" },
    { value: "deleted", label: "Deleted" },
  ];
}

function getSearchPlaceholder(type: ActivityLogType) {
  switch (type) {
    case "breakdown":
    case "twentyPercentDFBreakdown":
      return "Search by project, office, user...";
    case "project":
    case "twentyPercentDF":
      return "Search by project name, office, user...";
    case "trustFund":
    case "specialEducationFund":
    case "specialHealthFund":
      return "Search by project title, office, user...";
    case "budgetItem":
      return "Search by particulars, user...";
    default:
      return "Search activities...";
  }
}