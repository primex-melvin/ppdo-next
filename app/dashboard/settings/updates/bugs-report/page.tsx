"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Plus, CheckCircle2, AlertCircle, Clock, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResizableModal,
  ResizableModalContent,
  ResizableModalHeader,
  ResizableModalTitle,
  ResizableModalDescription,
  ResizableModalBody,
  ResizableModalFooter,
  ResizableModalTrigger,
} from "@/components/ui/resizable-modal";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { BugsSuggestionsDataTable, MediaThumbnails } from "@/components/ppdo/dashboard/BugsSuggestionsDataTable";
import { Badge } from "@/components/ui/badge"; // You might need to import Badge or use the one in component
import RichTextEditor from "@/components/ui/RichTextEditor";

export default function BugReportsPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch all bug reports
  const reports = useQuery(api.bugReports.getAll);
  const createBugReport = useMutation(api.bugReports.create);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stepsToReplicate, setStepsToReplicate] = useState("");
  const [multimedia, setMultimedia] = useState<Array<{ storageId: string, type: "image" | "video", name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateBugReport = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createBugReport({
        title,
        description,
        stepsToReplicate,
        multimedia: multimedia.map(m => ({
          storageId: m.storageId as any, // Cast to any to avoid Id<"_storage"> type issues in frontend
          type: m.type,
          name: m.name
        }))
      });
      console.log("✅ Bug report created:", result);

      toast.success("Bug Report Submitted", {
        description: "Your bug report has been successfully submitted",
      });
      setIsCreateDialogOpen(false);
      setTitle("");
      setDescription("");
      setStepsToReplicate("");
      setMultimedia([]);

      // Navigating to detail page if needed, or just let the table update
      // router.push(`/dashboard/settings/updates/bugs-report/${result.reportId}`);
    } catch (error) {
      console.error("❌ Error creating bug report:", error);
      toast.error("Error", {
        description: "Failed to submit bug report. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="font-medium text-stone-900 dark:text-stone-100">{row.getValue("title")}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let colorClass = "";
        let icon = null;
        let label = "";

        switch (status) {
          case "fixed":
            colorClass = "bg-[#15803D]/10 text-[#15803D] border-[#15803D]/20";
            icon = <CheckCircle2 className="w-3 h-3 mr-1" />;
            label = "Fixed";
            break;
          case "not_fixed":
            colorClass = "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
            icon = <AlertCircle className="w-3 h-3 mr-1" />;
            label = "Not Fixed";
            break;
          default:
            colorClass = "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
            icon = <Clock className="w-3 h-3 mr-1" />;
            label = "Pending";
        }

        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
            {icon}
            {label}
          </span>
        );
      },
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
      header: "Date",
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

        <ResizableModal open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <ResizableModalTrigger asChild>
            <Button className="gap-2 bg-[#15803D] hover:bg-[#15803D]/90 text-white">
              <Plus className="w-4 h-4" />
              Report a Bug
            </Button>
          </ResizableModalTrigger>
          <ResizableModalContent className="sm:max-w-[800px] sm:max-h-[80vh] flex flex-col" allowOverflow>
            <ResizableModalHeader>
              <ResizableModalTitle>Report a Bug</ResizableModalTitle>
              <ResizableModalDescription>
                Describe the bug you encountered. You can upload images or videos.
              </ResizableModalDescription>
            </ResizableModalHeader>
            <ResizableModalBody className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the bug"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Describe the bug..."
                  onMultimediaChange={(newMedia) => {
                    setMultimedia(prev => [...prev, ...newMedia]);
                  }}
                  className="min-h-[300px]"
                />
                <p className="text-xs text-muted-foreground">
                  You can paste images directly or upload videos using the toolbar.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Steps to Replicate (Optional)</Label>
                <RichTextEditor
                  value={stepsToReplicate}
                  onChange={setStepsToReplicate}
                  placeholder="List the steps to reproduce this bug..."
                  className="min-h-[150px]"
                  variant="ordered-list"
                />
              </div>
            </ResizableModalBody>
            <ResizableModalFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBugReport}
                disabled={isSubmitting}
                className="bg-[#15803D] hover:bg-[#15803D]/90 text-white"
              >
                {isSubmitting ? "Submitting..." : "Submit Bug Report"}
              </Button>
            </ResizableModalFooter>
          </ResizableModalContent>
        </ResizableModal>
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