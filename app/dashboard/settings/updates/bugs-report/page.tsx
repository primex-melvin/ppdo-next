"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Plus, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { BugsSuggestionsDataTable, MediaThumbnails } from "@/components/ppdo/dashboard/BugsSuggestionsDataTable";
import { BugReportModal } from "@/components/maintenance/BugReportModal";
import { StatusDropdown } from "@/components/maintenance/StatusDropdown";

export default function BugReportsPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch all bug reports
  const reports = useQuery(api.bugReports.getAll);

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
          itemType="bug"
          currentStatus={row.getValue("status")}
        />
      ),
    },
    {
      accessorKey: "submitter",
      header: "Reported By",
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
      header: "Date Reported",
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
        if (!updater) return <span className="text-muted-foreground text-xs">—</span>;

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
        if (!updatedAt) return <span className="text-muted-foreground text-xs">—</span>;

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bug Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track and manage reported bugs
          </p>
        </div>

        <Button
          className="gap-2 bg-[#15803D] hover:bg-[#15803D]/90 text-white"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Report a Bug
        </Button>

        <BugReportModal
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        />
      </div>

      <BugsSuggestionsDataTable
        columns={columns}
        data={reports || []}
        loading={reports === undefined}
        onRowClick={(row) => router.push(`/dashboard/settings/updates/bugs-report/${row._id}`)}
      />
    </div>
  );
}