
import { useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { budgetProjectApi } from "../api/budgetProjectApi";
import { ProjectApiConfig, ProjectFormData } from "../types";

// Type guard for MutationResponse
type MutationResponse =
    | {
        success: true;
        data?: any;
        message?: string;
    }
    | {
        success: false;
        error: {
            message: string;
            code?: string;
        };
        message?: string;
    };

function isMutationResponse(value: unknown): value is MutationResponse {
    return (
        typeof value === 'object' &&
        value !== null &&
        'success' in value &&
        typeof (value as any).success === 'boolean'
    );
}

interface UseProjectMutationsOptions {
    budgetItemId?: Id<"budgetItems">;
    apiConfig?: ProjectApiConfig;  // Optional: defaults to budget projects
}

export function useProjectMutations({ 
    budgetItemId, 
    apiConfig = budgetProjectApi 
}: UseProjectMutationsOptions = {}) {
    const createProject = useMutation(apiConfig.mutations.create);
    const updateProject = useMutation(apiConfig.mutations.update);
    const deleteProject = useMutation(apiConfig.mutations.moveToTrash);
    const recalculateBudgetItem = useMutation(apiConfig.queries.getBreakdownStats);

    const handleAddProject = async (projectData: ProjectFormData): Promise<string | null> => {
        if (!budgetItemId) {
            console.error("Budget item not found. Cannot create project.");
            toast.error("Budget item not found");
            return null;
        }

        try {
            const toastId = toast.loading("Creating project...");

            const response = await createProject({
                aipRefCode: projectData.aipRefCode || undefined,
                particulars: projectData.particulars,
                budgetItemId,
                categoryId: projectData.categoryId || undefined,
                implementingOffice: projectData.implementingOffice,
                totalBudgetAllocated: projectData.totalBudgetAllocated,
                obligatedBudget: projectData.obligatedBudget || undefined,
                totalBudgetUtilized: projectData.totalBudgetUtilized || 0,
                remarks: projectData.remarks || undefined,
                year: projectData.year || undefined,
                targetDateCompletion: projectData.targetDateCompletion || undefined,
                projectManagerId: projectData.projectManagerId || undefined,
                autoCalculateBudgetUtilized: projectData.autoCalculateBudgetUtilized,
            });

            toast.dismiss(toastId);

            // Handle response based on structure
            if (isMutationResponse(response)) {
                // MutationResponse format
                if (response.success && response.data?.projectId) {
                    toast.success(`Project "${projectData.particulars}" created successfully!`);
                    return response.data.projectId as string;
                } else if (!response.success) {
                    toast.error(response.error.message || "Failed to create project");
                    return null;
                } else {
                    toast.error("Failed to create project");
                    return null;
                }
            } else {
                // Direct ID return format or unknown format
                toast.success(`Project "${projectData.particulars}" created successfully!`);
                // Handle both direct string ID and objects with projectId
                if (typeof response === 'string') {
                    return response;
                } else if (response && typeof response === 'object' && 'projectId' in response) {
                    return (response as any).projectId as string;
                } else if (response && typeof response === 'object' && 'data' in response && (response as any).data?.projectId) {
                    return (response as any).data.projectId as string;
                }
                return response as unknown as string;
            }
        } catch (error) {
            toast.error("Failed to create project");
            console.error("Create project error:", error);
            return null;
        }
    };

    const handleEditProject = async (id: string, projectData: ProjectFormData) => {
        if (!budgetItemId) {
            console.error("Budget item not found. Cannot edit project.");
            toast.error("Budget item not found");
            return false;
        }

        try {
            const toastId = toast.loading("Updating project...");

            const response = await updateProject({
                id: id as Id<"projects">,
                aipRefCode: projectData.aipRefCode || undefined,
                particulars: projectData.particulars,
                budgetItemId,
                categoryId: projectData.categoryId || undefined,
                implementingOffice: projectData.implementingOffice,
                totalBudgetAllocated: projectData.totalBudgetAllocated,
                obligatedBudget: projectData.obligatedBudget || undefined,
                totalBudgetUtilized: projectData.totalBudgetUtilized || 0,
                remarks: projectData.remarks || undefined,
                year: projectData.year || undefined,
                targetDateCompletion: projectData.targetDateCompletion || undefined,
                projectManagerId: projectData.projectManagerId || undefined,
                autoCalculateBudgetUtilized: projectData.autoCalculateBudgetUtilized,
                reason: "Updated via dashboard UI",
            });

            toast.dismiss(toastId);

            // Handle response based on structure
            if (isMutationResponse(response)) {
                // MutationResponse format
                if (response.success) {
                    toast.success(`Project "${projectData.particulars}" updated successfully!`);
                    return true;
                } else {
                    toast.error(response.error.message || "Failed to update project");
                    return false;
                }
            } else {
                // Direct success (void or ID)
                toast.success(`Project "${projectData.particulars}" updated successfully!`);
                return true;
            }
        } catch (error) {
            toast.error("Failed to update project");
            console.error("Update project error:", error);
            return false;
        }
    };

    const handleDeleteProject = async (id: string) => {
        try {
            const toastId = toast.loading("Moving to trash...");

            const response = await deleteProject({
                id: id as Id<"projects">,
                reason: "Moved to trash via project dashboard",
            });

            toast.dismiss(toastId);

            // Handle response based on structure
            if (isMutationResponse(response)) {
                // MutationResponse format
                if (response.success) {
                    toast.success("Project moved to trash successfully!");
                    return true;
                } else {
                    toast.error(response.error.message || "Failed to delete project");
                    return false;
                }
            } else {
                // Direct success
                toast.success("Project moved to trash successfully!");
                return true;
            }
        } catch (error) {
            toast.error("Failed to delete project");
            console.error("Delete project error:", error);
            return false;
        }
    };

    const handleRecalculate = async () => {
        if (!budgetItemId) {
            console.error("Budget item not found. Cannot recalculate.");
            toast.error("Budget item not found");
            return false;
        }

        try {
            const toastId = toast.loading("Recalculating...");

            const response = await recalculateBudgetItem({ budgetItemId });

            toast.dismiss(toastId);

            // Handle response based on structure
            if (isMutationResponse(response)) {
                // MutationResponse format
                if (response.success) {
                    toast.success("Budget item recalculated successfully!");
                    return true;
                } else {
                    toast.error(response.error.message || "Failed to recalculate budget item");
                    return false;
                }
            } else {
                // Direct success
                toast.success("Budget item recalculated successfully!");
                return true;
            }
        } catch (error) {
            toast.error("Failed to recalculate budget item");
            console.error("Recalculate error:", error);
            return false;
        }
    };

    return {
        handleAddProject,
        handleEditProject,
        handleDeleteProject,
        handleRecalculate,
    };
}
