"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function ActivitySearchFilter({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  resultCount,
}: {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: "all" | "verified" | "pending"
  onStatusFilterChange: (status: "all" | "verified" | "pending") => void
  resultCount: number
}) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="mt-8 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search activities by description or inspector name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-border rounded-lg"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {showFilters && (
        <div className="p-4 bg-muted/30 border border-border/50 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Status</p>
            <div className="flex gap-2">
              {(["all", "verified", "pending"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusFilterChange(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium uppercase tracking-wide transition-all",
                    statusFilter === status
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-background border border-border hover:border-primary/50",
                  )}
                >
                  {status === "all" && "All Activities"}
                  {status === "verified" && "Verified"}
                  {status === "pending" && "Pending"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground font-medium">
        Showing {resultCount} {resultCount === 1 ? "activity" : "activities"}
      </div>
    </div>
  )
}
