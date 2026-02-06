/**
 * Inspection Page
 *
 * Ground-up rewrite using DRY principles and reusable components.
 * Follows the Breakdown Page design pattern for consistency.
 */

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

// Breadcrumb utilities
import { useDashboardBreadcrumbs } from "@/lib/hooks/useDashboardBreadcrumbs";
import {
  decodeLabel,
  extractIdFromSlug,
  extractCleanNameFromSlug,
  getParticularFullName,
  formatYearLabel,
} from "@/lib/utils/breadcrumb-utils";

// New standardized components
import { InspectionPageHeader } from "@/components/features/ppdo/inspection/_components/InspectionPageHeader";
import { InspectionStatistics } from "@/components/features/ppdo/inspection/_components/InspectionStatistics";
import { InspectionTable } from "@/components/features/ppdo/inspection/_components/InspectionTable";
import { useInspectionStats } from "@/components/features/ppdo/inspection/_hooks/useInspectionStats";

// Existing inspection components
import { NewInspectionForm } from "@/components/features/ppdo/inspection/components/modals/NewInspectionForm";
import { InspectionDetailsModal } from "@/components/features/ppdo/inspection/components/modals/InspectionDetailsModal";

// Types
import { Inspection } from "@/components/features/ppdo/inspection/types";

export default function InspectionPage() {
  const params = useParams();
  const router = useRouter();

  // UI State
  const [showDetails, setShowDetails] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Extract URL params
  const year = params.year as string;
  const particularId = decodeLabel(params.particularId as string);
  const projectbreakdownId = decodeLabel(params.projectbreakdownId as string);
  const inspectionSlug = decodeLabel(params.inspectionId as string);

  // Extract IDs from slugs
  const breakdownId = extractIdFromSlug(inspectionSlug) as Id<"govtProjectBreakdowns">;

  // Fetch breakdown data
  const breakdown = useQuery(
    api.govtProjects.getProjectBreakdown,
    breakdownId ? { breakdownId } : "skip"
  );

  // Fetch parent project
  const project = useQuery(
    api.projects.get,
    breakdown?.projectId ? { id: breakdown.projectId as Id<"projects"> } : "skip"
  );

  // Fetch inspections for this project
  const inspections = useQuery(
    api.inspections.listInspectionsByProject,
    project?._id ? { projectId: project._id } : "skip"
  );

  // Calculate statistics
  const stats = useInspectionStats(inspections as Inspection[] | undefined);

  // Set up breadcrumbs
  const particularFullName = getParticularFullName(particularId);
  const cleanProjectName = extractCleanNameFromSlug(projectbreakdownId);
  const cleanBreakdownName = extractCleanNameFromSlug(inspectionSlug);
  const yearLabel = formatYearLabel(year);

  useDashboardBreadcrumbs({
    isDataLoaded: !!(breakdown && project),
    loadingBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "Project", href: "/dashboard/project" },
      { label: yearLabel, href: `/dashboard/project/${year}` },
      { label: particularFullName, loading: true },
      { label: cleanProjectName, loading: true },
      { label: cleanBreakdownName, loading: true },
    ],
    loadedBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "Project", href: "/dashboard/project" },
      { label: yearLabel, href: `/dashboard/project/${year}` },
      {
        label: particularFullName,
        href: `/dashboard/project/${year}/${encodeURIComponent(particularId)}`,
      },
      {
        label: cleanProjectName,
        href: `/dashboard/project/${year}/${encodeURIComponent(particularId)}/${encodeURIComponent(projectbreakdownId)}`,
      },
      { label: "Inspections" },
    ],
    dependencies: [breakdown, project, year, particularId, projectbreakdownId, inspectionSlug],
  });

  // Mutations
  const createInspection = useMutation(api.inspections.createInspection);
  const updateInspection = useMutation(api.inspections.updateInspection);
  const deleteInspection = useMutation(api.inspections.deleteInspection);
  const incrementViewCount = useMutation(api.inspections.incrementViewCount);

  // Handlers
  const handleAdd = async (formData: any) => {
    try {
      if (!project?._id) {
        toast.error("Project not found");
        return;
      }

      await createInspection({
        projectId: project._id,
        programNumber: formData.programNumber,
        title: formData.title,
        category: formData.category,
        inspectionDateTime: new Date(formData.date).getTime(),
        // Keep sending empty remarks if not provided (it's optional now)
        remarks: formData.remarks || "",
        status: "pending",
        uploadSessionId: formData.uploadSessionId,
      });

      toast.success("Inspection created successfully!");
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error creating inspection:", error);
      toast.error("Failed to create inspection. Please try again.");
    }
  };

  const handleView = async (inspection: Inspection) => {
    try {
      await incrementViewCount({ inspectionId: inspection._id as Id<"inspections"> });
      setSelectedInspection(inspection);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error("Error viewing inspection:", error);
    }
  };

  const handleEdit = (inspection: Inspection) => {
    // TODO: Implement edit modal
    toast.info("Edit functionality coming soon");
  };

  const handleDelete = async (inspection: Inspection) => {
    try {
      await deleteInspection({ inspectionId: inspection._id as Id<"inspections"> });
      toast.success("Inspection deleted successfully!");
    } catch (error) {
      console.error("Error deleting inspection:", error);
      toast.error("Failed to delete inspection");
    }
  };

  // Loading state
  if (!breakdown || !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div>
            <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            </div>
            <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const backUrl = `/dashboard/project/${year}/${encodeURIComponent(particularId)}/${encodeURIComponent(projectbreakdownId)}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <InspectionPageHeader
          backUrl={backUrl}
          backLabel="Back to Breakdown"
          breakdownName={breakdown.projectTitle || breakdown.projectName || "Inspections"}
          projectName={project.particulars}
          implementingOffice={project.implementingOffice}
          year={year}
          showDetails={showDetails}
          setShowDetails={setShowDetails}
        />

        {/* Statistics */}
        <InspectionStatistics stats={stats} showDetails={showDetails} />

        {/* Inspection Table */}
        <InspectionTable
          inspections={(inspections as unknown as Inspection[]) || []}
          isLoading={inspections === undefined}
          onAdd={() => setIsAddModalOpen(true)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />

        {/* Add Inspection Modal */}
        <NewInspectionForm
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          onSubmit={handleAdd}
        />

        {/* View Details Modal */}
        <InspectionDetailsModal
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          inspection={selectedInspection}
        />
      </div>
    </div>
  );
}
