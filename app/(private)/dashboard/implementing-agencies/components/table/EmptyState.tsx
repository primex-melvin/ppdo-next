// app/(private)/dashboard/implementing-agencies/components/table/EmptyState.tsx

"use client";

import { Building2 } from "lucide-react";

interface EmptyStateProps {
  searchQuery?: string;
}

export function EmptyState({ searchQuery }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Building2 className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4" />
      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
        {searchQuery ? "No agencies found" : "No implementing agencies"}
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center max-w-sm">
        {searchQuery
          ? `No agencies match "${searchQuery}". Try a different search term.`
          : "No implementing agencies have been added yet. Click the Add button to create one."}
      </p>
    </div>
  );
}
