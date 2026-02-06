"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Plus, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { BugsSuggestionsDataTable, MediaThumbnails } from "@/components/features/ppdo/dashboard/BugsSuggestionsDataTable";
import { SuggestionModal } from "@/components/features/maintenance/SuggestionModal";
import { StatusDropdown } from "@/components/features/maintenance/StatusDropdown";

export default function SuggestionsPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch all suggestions
  const suggestions = useQuery(api.suggestions.getAll);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="font-medium text-stone-900 dark:text-stone-100">{row.getValue("title")}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusDropdown
          itemId={row.original._id}
          itemType="suggestion"
          currentStatus={row.getValue("status")}
        />
      ),
    },
    {
      accessorKey: "submitter",
      header: "Suggested By",
      cell: ({ row }) => {
        const submitter = row.original.submitter;
        if (!submitter) return <span className="text-muted-foreground text-xs">Unknown</span>;

        let name = "Unknown";
        if (submitter.firstName || submitter.lastName) {
          name = [submitter.firstName, submitter.lastName].filter(Boolean).join(" ");
        } else if (submitter.name) {
          name = submitter.name;
        } else if (submitter.email) {
          name = submitter.email;
        }
        return <span className="text-sm text-stone-600 dark:text-stone-400">{name}</span>;
      },
    },
    {
      accessorKey: "submittedAt",
      header: "Date Suggested",
      cell: ({ row }) => {
        return <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(row.getValue("submittedAt")).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          })}
        </span>
      }
    },
    {
      accessorKey: "updater",
      header: "Updated By",
      cell: ({ row }) => {
        const updater = row.original.updater;
        if (!updater) return <span className="text-muted-foreground text-xs">â€”</span>;

        let name = "Unknown";
        if (updater.firstName || updater.lastName) {
          name = [updater.firstName, updater.lastName].filter(Boolean).join(" ");
        } else if (updater.name) {
          name = updater.name;
        } else if (updater.email) {
          name = updater.email;
        }
        return <span className="text-sm text-stone-600 dark:text-stone-400">{name}</span>;
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Last Updated",
      cell: ({ row }) => {
        const updatedAt = row.getValue("updatedAt") as number;
        if (!updatedAt) return <span className="text-muted-foreground text-xs">â€”</span>;

        return <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          })}
        </span>
      }
    },
    {
      id: "multimedia",
      header: "Media",
      cell: ({ row }) => {
        return <MediaThumbnails multimedia={row.original.multimedia} />
      }
    }
  ];


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suggestions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Share your ideas to improve the system
          </p>
        </div>

        <Button
          className="gap-2 bg-[#15803D] hover:bg-[#15803D]/90 text-white"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Submit Suggestion
        </Button>

        <SuggestionModal
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>

      <BugsSuggestionsDataTable
        columns={columns}
        data={suggestions || []}
        loading={suggestions === undefined}
        onRowClick={(row) => router.push(`/dashboard/settings/updates/suggestions/${row._id}`)}
      />
    </div>
  );
}