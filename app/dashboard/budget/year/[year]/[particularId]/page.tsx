"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useBreadcrumb } from "../../../../contexts/BreadcrumbContext";
import { ProjectsTable } from "./components/ProjectsTable";
import { ParticularPageHeader } from "./components/ParticularPageHeader";
import { StatusInfoCard } from "./components/StatusInfoCard";
import { ProjectSummaryStats } from "./components/ProjectSummaryStats";
import { ProjectLoadingState } from "./components/ProjectLoadingState";
import { TrashBinModal } from "../../../../components/TrashBinModal";
import { useParticularData } from "./components/useParticularData";
import { useProjectMutations } from "./components/useProjectMutations";
import { getParticularFullName, calculateProjectStats } from "./utils";

export default function ParticularProjectsPage() {
  const params = useParams();
  const particular = decodeURIComponent(params.particularId as string);
  const year = Number(params.year);
  const { setCustomBreadcrumbs } = useBreadcrumb();

  const [showDetails, setShowDetails] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("showBudgetDetails");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("showBudgetDetails", JSON.stringify(showDetails));
    }
  }, [showDetails]);

  useEffect(() => {
    if (!Number.isNaN(year)) {
      setCustomBreadcrumbs([
        { label: "Home", href: "/dashboard" },
        { label: "Budget", href: "/dashboard/budget" },
        { label: String(year), href: `/dashboard/budget/year/${year}` },
        { label: getParticularFullName(particular) },
      ]);
    }
    return () => setCustomBreadcrumbs(null);
  }, [particular, setCustomBreadcrumbs, year]);

  const [showTrashModal, setShowTrashModal] = useState(false);
  const [newlyAddedProjectId, setNewlyAddedProjectId] = useState<string | null>(null);

  const { budgetItem, breakdownStats, projects, isLoading } = useParticularData(particular);
  const { handleAddProject, handleEditProject, handleDeleteProject, handleRecalculate } = 
    useProjectMutations(budgetItem?._id);

  // Wrapper for handleAddProject to track newly added project
  const handleAddProjectWithTracking = async (projectData: any) => {
    const projectId = await handleAddProject(projectData);
    if (projectId) {
      setNewlyAddedProjectId(projectId);
      // Clear the highlight after 3 seconds
      setTimeout(() => setNewlyAddedProjectId(null), 3000);
    }
  };

  const particularFullName = getParticularFullName(particular);
  const stats = calculateProjectStats(projects);

  if (!isLoading && !budgetItem) {
    return (
      <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
          Budget item not found. It may have been removed or you may not have access.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-3 text-sm text-blue-700 dark:text-blue-300 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <>
      <ParticularPageHeader
        particularFullName={particularFullName}
        budgetItemId={budgetItem?._id}
        budgetItemParticulars={budgetItem?.particulars}
        budgetItemStatus={budgetItem?.status}
        showDetails={showDetails}
        onToggleDetails={() => setShowDetails(!showDetails)}
        onRecalculate={handleRecalculate}
      />

      {showDetails && budgetItem && (
        <StatusInfoCard
          budgetStatus={budgetItem.status}
          totalProjects={projects.length}
          projectCompleted={budgetItem.projectCompleted}
          projectDelayed={budgetItem.projectDelayed}
          projectsOnTrack={budgetItem.projectsOnTrack}
          totalBreakdowns={breakdownStats?.totalBreakdowns || 0}
        />
      )}

      {showDetails && (
        <ProjectSummaryStats
          totalAllocated={stats.totalAllocated}
          totalUtilized={stats.totalUtilized}
          avgUtilizationRate={stats.avgUtilizationRate}
          totalProjects={projects.length}
        />
      )}

      <div className="mb-6">
        {isLoading ? (
          <ProjectLoadingState />
        ) : (
          <ProjectsTable
            projects={projects}
            particularId={particular}
            budgetItemId={budgetItem!._id}
            onAdd={handleAddProjectWithTracking}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
            onOpenTrash={() => setShowTrashModal(true)}
            newlyAddedProjectId={newlyAddedProjectId}
          />
        )}
      </div>

      <TrashBinModal
        isOpen={showTrashModal}
        onClose={() => setShowTrashModal(false)}
        type="project"
      />
    </>
  );
}
