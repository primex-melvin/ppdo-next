
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccessDeniedPage from "@/components/shared/pages/AccessDeniedPage";
import { TrashBinModal } from "@/components/shared/modals";
import { extractIdFromSlug } from "@/lib/utils/breadcrumb-utils";
import { useSort } from "@/hooks/useSort";

// Import from reusable component library
// Note: We use relative imports if we are inside the same feature folder structure, 
// but since we moved everything to components/ppdo/projects, we import from there.
// However, next.js alias @/components is safer.
import {
  ProjectsTable,
  ParticularPageHeader,
  ProjectSummaryStats,
  ProjectLoadingState,
  ProjectExpandModal,
  useParticularData,
  useProjectMutations,
  useParticularAccess,
  getParticularFullName,
  calculateProjectStats
} from "@/components/features/ppdo/odpp/table-pages/projects";
import { Project } from "@/components/features/ppdo/odpp/table-pages/projects/types";

export default function ParticularProjectsPage() {
  const params = useParams();
  const router = useRouter();
  const rawParam = decodeURIComponent(params.particularId as string);
  const year = params.year as string;

  // Detect if the URL param is a slug (from search navigation) or a raw particular name
  // Slugs contain hyphens and end with a long alphanumeric ID (e.g., "drug-testing-laboratory-k5781w0ghb46yjy2ypf7...")
  const extractedId = rawParam.includes('-') ? extractIdFromSlug(rawParam) : undefined;
  const isSlugFormat = !!(extractedId && extractedId !== rawParam && extractedId.length > 15);
  const budgetItemId = isSlugFormat ? extractedId : undefined;

  // ============================================================================
  // DATA FETCHING (moved before access check so we can use actual particulars)
  // ============================================================================
  const [showDetails, setShowDetails] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [newlyAddedProjectId, setNewlyAddedProjectId] = useState<string | null>(null);
  const [isExpandModalOpen, setIsExpandModalOpen] = useState(false);

  const { budgetItem, breakdownStats, projects, isLoading: isLoadingData } = useParticularData({
    particular: rawParam,
    budgetItemId,
  });

  // Use the actual particulars from budget item when available (handles slug-based navigation)
  const particular = budgetItem?.particulars ?? rawParam;

  // ============================================================================
  // ACCESS CONTROL - Check if user can access this particular
  // ============================================================================
  const { accessCheck, isLoading: isLoadingAccess, canAccess } = useParticularAccess(particular);

  const { handleAddProject, handleEditProject, handleDeleteProject, handleRecalculate } =
    useProjectMutations({ budgetItemId: budgetItem?._id });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  const handleAddProjectWithTracking = async (projectData: any) => {
    const projectId = await handleAddProject(projectData);
    if (projectId) {
      setNewlyAddedProjectId(projectId);
      setTimeout(() => setNewlyAddedProjectId(null), 3000);
    }
  };

  const particularFullName = getParticularFullName(particular);
  const stats = calculateProjectStats(projects);

  // Calculate status counts from projects
  const statusCounts = projects.reduce(
    (acc, project) => {
      if (project.status === "completed") acc.completed++;
      else if (project.status === "ongoing") acc.ongoing++;
      else if (project.status === "delayed") acc.delayed++;
      return acc;
    },
    { completed: 0, ongoing: 0, delayed: 0 }
  );

  // Calculate total obligated budget
  const totalObligated = projects.reduce(
    (sum, project) => sum + (project.obligatedBudget || 0),
    0
  );

  // Sort functionality with URL persistence
  const { sortedItems, sortOption, setSortOption } = useSort<Project>({
    items: projects,
    sortFieldMap: {
      nameField: "particulars",
      allocatedField: "totalBudgetAllocated",
      obligatedField: "obligatedBudget",
      utilizedField: "totalBudgetUtilized",
      modifiedField: "_creationTime",
    },
    enableUrlPersistence: true,
  });

  // ============================================================================
  // LOADING STATE - Checking Access
  // For slug-based navigation, wait for budget item to load before checking access
  // ============================================================================
  if (isLoadingAccess || (isSlugFormat && !budgetItem)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="text-sm text-muted-foreground">
            Checking access permissions...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ACCESS DENIED - Show Access Denied Page
  // ============================================================================
  if (!canAccess) {
    return (
      <AccessDeniedPage
        userName={accessCheck?.user?.name || ""}
        userEmail={accessCheck?.user?.email || ""}
        departmentName={(accessCheck?.department as any)?.name ?? (accessCheck?.department as any)?.fullName ?? "Not Assigned"}
        pageRequested={`Budget Tracking ${year} - ${particularFullName}`}
      />
    );
  }

  // ============================================================================
  // LOADING STATE - Fetching Data
  // ============================================================================
  if (isLoadingData) {
    return <ProjectLoadingState />;
  }

  // ============================================================================
  // MAIN RENDER - User has access
  // ============================================================================
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

      {showDetails && (
        <ProjectSummaryStats
          totalAllocated={stats.totalAllocated}
          totalUtilized={stats.totalUtilized}
          totalObligated={totalObligated}
          avgUtilizationRate={stats.avgUtilizationRate}
          totalProjects={projects.length}
          statusCounts={statusCounts}
        />
      )}

      <div className="mb-6">
        <ProjectsTable
          projects={sortedItems}
          sortOption={sortOption}
          onSortChange={setSortOption}
          particularId={particular}
          budgetItemId={budgetItem!._id}
          budgetItemYear={budgetItem?.year}
          onAdd={handleAddProjectWithTracking}
          onEdit={handleEditProject}
          onDelete={handleDeleteProject}
          onOpenTrash={() => setShowTrashModal(true)}
          newlyAddedProjectId={newlyAddedProjectId}
          expandButton={
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Expand table"
              onClick={() => setIsExpandModalOpen(true)}
            >
              <Expand className="w-4 h-4" />
            </Button>
          }
        />
      </div>

      <TrashBinModal
        isOpen={showTrashModal}
        onClose={() => setShowTrashModal(false)}
        type="project"
      />

      {budgetItem && (
        <ProjectExpandModal
          isOpen={isExpandModalOpen}
          onClose={() => setIsExpandModalOpen(false)}
          budgetItemId={budgetItem._id}
          particular={particularFullName}
        />
      )}
    </>
  );
}
