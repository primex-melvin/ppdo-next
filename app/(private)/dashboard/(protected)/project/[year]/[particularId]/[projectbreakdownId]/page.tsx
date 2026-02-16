// app/dashboard/project/[year]/[particularId]/[projectbreakdownId]/page.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";

// API & Models
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Contexts
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";

// Hooks
import { useSort } from "@/hooks/useSort";

// Centralized Breakdown Components
import {
  BreakdownHeader,
  BreakdownHistoryTable,
  BreakdownForm,
  Breakdown,
  BreakdownStatistics,
} from "@/components/features/ppdo/odpp/table-pages/breakdown";

// Shared Components
import { TrashBinModal } from "@/components/shared/modals";
import { TrashConfirmationModal } from "@/components/shared/modals/TrashConfirmationModal";
import { Modal } from "@/components/features/ppdo/odpp/table-pages/11_project_plan";
import { ConfirmationModal } from "@/components/features/ppdo/odpp/table-pages/11_project_plan";

// Shared Hooks
import { useEntityStats, useEntityMetadata } from "@/lib/hooks/useEntityStats";

// Utils
import { extractIdFromSlug, getParticularFullName, extractCleanNameFromSlug, decodeLabel, formatYearLabel } from "@/lib/utils/breadcrumb-utils";
import { getStatusColor } from "./_lib/page-helpers";
import { useDashboardBreadcrumbs } from "@/lib/hooks/useDashboardBreadcrumbs";
import { Folder } from "lucide-react";

export default function ProjectBreakdownPage() {
  const params = useParams();

  // Extract Params with decoding
  const year = params.year as string;
  const particularId = decodeLabel(params.particularId as string);
  const slugWithId = params.projectbreakdownId as string;
  const projectId = extractIdFromSlug(slugWithId);

  // Local State
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTrashConfirmModal, setShowTrashConfirmModal] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<Breakdown | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Trash Preview Query
  const trashPreviewArgs = useMemo(() => {
    if (!selectedBreakdown) return "skip" as const;
    return {
      entityType: "breakdown" as const,
      entityId: selectedBreakdown._id,
    };
  }, [selectedBreakdown]);

  const trashPreviewData = useQuery(
    api.trash.getTrashPreview,
    trashPreviewArgs === "skip" ? "skip" : trashPreviewArgs
  );
  const isTrashPreviewLoading = trashPreviewArgs !== "skip" && trashPreviewData === undefined;

  // Queries
  const project = useQuery(
    api.projects.get,
    projectId ? { id: projectId as Id<"projects"> } : "skip"
  );

  const parentBudgetItem = useQuery(
    api.budgetItems.get,
    project?.budgetItemId ? { id: project.budgetItemId } : "skip"
  );

  const breakdownHistory = useQuery(
    api.govtProjects.getProjectBreakdowns,
    project ? { projectId: projectId as Id<"projects"> } : "skip"
  );

  const departments = useQuery(api.departments.list, { includeInactive: false });

  // Hooks - Using shared hooks for statistics
  const stats = useEntityStats(breakdownHistory as Breakdown[] | undefined);
  const metadata = useEntityMetadata(breakdownHistory as Breakdown[] | undefined);

  // Sort functionality with URL persistence
  const { sortedItems, sortOption, setSortOption } = useSort<Breakdown>({
    items: breakdownHistory || [],
    sortFieldMap: {
      nameField: "projectName",
      allocatedField: "allocatedBudget",
      obligatedField: "obligatedBudget",
      utilizedField: "utilizedBudget",
      modifiedField: "_creationTime",
    },
    enableUrlPersistence: true,
  });

  // Breadcrumbs with shared logic
  const particularFullName = getParticularFullName(particularId);
  const cleanProjectName = extractCleanNameFromSlug(slugWithId);
  const yearLabel = formatYearLabel(year);

  useDashboardBreadcrumbs({
    isDataLoaded: !!project,
    loadingBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "Project", href: "/dashboard/project" },
      { label: yearLabel, href: `/dashboard/project/${year}` },
      { label: particularFullName, loading: true },
      { label: cleanProjectName, loading: true },
    ],
    loadedBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "Project", href: "/dashboard/project" },
      { label: yearLabel, href: `/dashboard/project/${year}` },
      { label: particularFullName, href: `/dashboard/project/${year}/${encodeURIComponent(particularId)}` },
      { label: cleanProjectName },
    ],
    dependencies: [project, particularFullName, particularId, year, slugWithId],
  });

  // Mutations
  const createBreakdown = useMutation(api.govtProjects.createProjectBreakdown);
  const updateBreakdown = useMutation(api.govtProjects.updateProjectBreakdown);
  const deleteBreakdown = useMutation(api.govtProjects.moveToTrash);
  const recalculateProject = useMutation(api.govtProjects.recalculateProject);

  // Handlers
  const handleRecalculate = async () => {
    if (!project) return;
    setIsRecalculating(true);
    try {
      const result = await recalculateProject({ projectId: projectId as Id<"projects"> });
      toast.success("Status recalculated successfully!", {
        description: `Project status: ${result.status}, Breakdowns: ${result.breakdownsCount}`,
      });
    } catch (error) {
      console.error("Recalculation error:", error);
      toast.error("Failed to recalculate status");
    } finally {
      setIsRecalculating(false);
    }
  };

  const handlePrint = () => window.print();

  const handleAdd = async (breakdownData: Omit<Breakdown, "_id">) => {
    try {
      if (!project) {
        toast.error("Project not found");
        return;
      }
      await createBreakdown({
        ...breakdownData,
        projectId: projectId as Id<"projects">,
        reportDate: breakdownData.reportDate || Date.now(),
        reason: "Created via dashboard form",
      } as any); // Cast to any to satisfy specific Convex args if types slightly mismatch

      toast.success("Breakdown record created successfully!");
      setShowAddModal(false);
    } catch (error: any) {
      toast.error("Failed to create breakdown record", { description: error.message });
    }
  };

  const handleUpdate = async (breakdownData: Omit<Breakdown, "_id">) => {
    try {
      if (!selectedBreakdown) {
        toast.error("No breakdown selected");
        return;
      }
      // Remove client-only / audit fields not accepted by the server validator
      // (e.g. `batchId` is present on records created by bulk imports)
      const { batchId, ...validData } = breakdownData as any;

      await updateBreakdown({
        breakdownId: selectedBreakdown._id as Id<"govtProjectBreakdowns">,
        ...validData,
        projectId: projectId as Id<"projects">,
        reason: "Updated via dashboard edit form",
      } as any);

      toast.success("Breakdown record updated successfully!");
      setShowEditModal(false);
      setSelectedBreakdown(null);
    } catch (error: any) {
      toast.error("Failed to update breakdown record", { description: error.message });
    }
  };

  const handleConfirmDelete = async (reason?: string) => {
    try {
      if (!selectedBreakdown) return;
      await deleteBreakdown({
        breakdownId: selectedBreakdown._id as Id<"govtProjectBreakdowns">,
        reason: reason || "Moved to trash via dashboard confirmation",
      });
      toast.success("Breakdown record moved to trash!");
      setShowTrashConfirmModal(false);
      setSelectedBreakdown(null);
    } catch (error) {
      toast.error("Failed to move breakdown record to trash");
    }
  };

  const handleCancelDelete = () => {
    setShowTrashConfirmModal(false);
    setSelectedBreakdown(null);
  };

  const handleEdit = (breakdown: Breakdown) => {
    setSelectedBreakdown(breakdown);
    setShowEditModal(true);
  };

  const handleDelete = (id: string) => {
    const breakdown = breakdownHistory?.find((b) => b._id === id);
    if (breakdown) {
      setSelectedBreakdown(breakdown);
      setShowTrashConfirmModal(true);
    }
  };

  return (
    <>
      {/* Shared Header Component with recalculate button for Projects */}
      <BreakdownHeader
        backUrl={`/dashboard/project/${year}/${encodeURIComponent(particularId)}`}
        backLabel="Back to Projects"
        icon={Folder}
        iconBgClass="bg-blue-100 dark:bg-blue-900/30"
        iconTextClass="text-blue-700 dark:text-blue-300"
        entityName={project?.particulars}
        entityType="project"
        implementingOffice={project?.implementingOffice}
        year={year}
        subtitle={`Historical breakdown and progress tracking for ${year}`}
        showHeader={showDetails}
        setShowHeader={setShowDetails}
        showRecalculateButton={true}
        isRecalculating={isRecalculating}
        onRecalculate={handleRecalculate}
        showActivityLog={true}
      />

      <BreakdownStatistics
        showDetails={showDetails}
        totalAllocated={project?.totalBudgetAllocated || 0}
        totalUtilized={stats?.totalUtilizedBudget || 0}
        totalObligated={project?.obligatedBudget || 0}
        averageUtilizationRate={stats?.averageUtilizationRate || 0}
        totalBreakdowns={breakdownHistory?.length || 0}
        statusCounts={stats?.statusCounts || { completed: 0, ongoing: 0, delayed: 0 }}
      />

      <div className="mb-6">
        {breakdownHistory === undefined ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent"></div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading breakdown history...</p>
          </div>
        ) : (
          <BreakdownHistoryTable
            breakdowns={sortedItems}
            sortOption={sortOption}
            onSortChange={setSortOption}
            onPrint={handlePrint}
            onAdd={() => setShowAddModal(true)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onOpenTrash={() => setShowTrashModal(true)}
            entityName={project?.particulars}
            enableInspectionNavigation={true}
          />
        )}
      </div>

      {/* Modals */}
      {showAddModal && project && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Breakdown Record" size="xl">
          <BreakdownForm
            defaultProjectName={project.particulars}
            defaultImplementingOffice={project.implementingOffice}
            projectId={projectId}
            onSave={handleAdd}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {showEditModal && selectedBreakdown && (
        <Modal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setSelectedBreakdown(null); }}
          title="Edit Breakdown Record"
          size="xl"
        >
          <BreakdownForm
            breakdown={selectedBreakdown}
            projectId={projectId}
            onSave={handleUpdate}
            onCancel={() => { setShowEditModal(false); setSelectedBreakdown(null); }}
          />
        </Modal>
      )}

      {/* Trash Confirmation Modal */}
      <TrashConfirmationModal
        open={showTrashConfirmModal}
        onOpenChange={setShowTrashConfirmModal}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        previewData={trashPreviewData}
        isLoading={isTrashPreviewLoading}
      />

      <TrashBinModal isOpen={showTrashModal} onClose={() => setShowTrashModal(false)} type="breakdown" />
    </>
  );
}
