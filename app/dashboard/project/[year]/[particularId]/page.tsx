
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccessDeniedPage from "@/components/AccessDeniedPage";
import { TrashBinModal } from "@/components/TrashBinModal";

// Import from reusable component library
// Note: We use relative imports if we are inside the same feature folder structure, 
// but since we moved everything to components/ppdo/projects, we import from there.
// However, next.js alias @/components is safer.
import {
  ProjectsTable,
  ParticularPageHeader,
  StatusInfoCard,
  ProjectSummaryStats,
  ProjectLoadingState,
  ProjectExpandModal,
  useParticularData,
  useProjectMutations,
  useParticularAccess,
  getParticularFullName,
  calculateProjectStats
} from "@/components/ppdo/projects";

export default function ParticularProjectsPage() {
  const params = useParams();
  const router = useRouter();
  const particular = decodeURIComponent(params.particularId as string);
  const year = params.year as string;

  // ============================================================================
  // ACCESS CONTROL - Check if user can access this particular
  // ============================================================================
  const { accessCheck, isLoading: isLoadingAccess, canAccess } = useParticularAccess(particular);

  // ============================================================================
  // EXISTING STATE
  // ============================================================================
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

  const [showTrashModal, setShowTrashModal] = useState(false);
  const [newlyAddedProjectId, setNewlyAddedProjectId] = useState<string | null>(null);
  const [isExpandModalOpen, setIsExpandModalOpen] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================
  const { budgetItem, breakdownStats, projects, isLoading: isLoadingData } = useParticularData(particular);

  const { handleAddProject, handleEditProject, handleDeleteProject, handleRecalculate } =
    useProjectMutations(budgetItem?._id);

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

  // ============================================================================
  // LOADING STATE - Checking Access
  // ============================================================================
  if (isLoadingAccess) {
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
        departmentName={accessCheck?.department?.name || "Not Assigned"}
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

      {showDetails && budgetItem && (
        <StatusInfoCard
          budgetStatus={budgetItem.status}
          totalProjects={projects.length}
          projectCompleted={budgetItem.projectCompleted}
          projectDelayed={budgetItem.projectDelayed}
          projectsOngoing={budgetItem.projectsOngoing || 0}
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
        <ProjectsTable
          projects={projects}
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
