"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { TwentyPercentDFFormData } from "../types";

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

interface UseTwentyPercentDFMutationsOptions {
    fundId?: Id<"twentyPercentDF">;
}

export function useTwentyPercentDFMutations({ fundId }: UseTwentyPercentDFMutationsOptions = {}) {
    const createItem = useMutation(api.twentyPercentDF.create);
    const updateItem = useMutation(api.twentyPercentDF.update);
    const deleteItem = useMutation(api.twentyPercentDF.moveToTrash);

    const handleAdd = async (data: TwentyPercentDFFormData): Promise<string | null> => {
        try {
            const toastId = toast.loading("Creating...");

            const response = await createItem({
                particulars: data.particulars,
                categoryId: data.categoryId || undefined,
                departmentId: (data.departmentId as any) || undefined,
                implementingOffice: data.implementingOffice,
                totalBudgetAllocated: data.totalBudgetAllocated,
                obligatedBudget: data.obligatedBudget || undefined,
                totalBudgetUtilized: data.totalBudgetUtilized || 0,
                remarks: data.remarks || undefined,
                year: data.year || undefined,
                targetDateCompletion: data.targetDateCompletion || undefined,
                projectManagerId: data.projectManagerId || undefined,
                autoCalculateBudgetUtilized: data.autoCalculateBudgetUtilized,
            });

            toast.dismiss(toastId);

            if (isMutationResponse(response)) {
                if (response.success && response.data?.id) {
                    toast.success(`"${data.particulars}" created successfully!`);
                    return response.data.id as string;
                } else if (!response.success) {
                    toast.error(response.error.message || "Failed to create");
                    return null;
                }
            } else {
                toast.success(`"${data.particulars}" created successfully!`);
                if (typeof response === 'string') {
                    return response;
                } else if (response && typeof response === 'object' && 'id' in response) {
                    return (response as any).id as string;
                }
                return response as unknown as string;
            }
            return null;
        } catch (error) {
            toast.error("Failed to create");
            console.error("Create error:", error);
            return null;
        }
    };

    const handleEdit = async (id: string, data: TwentyPercentDFFormData) => {
        try {
            const toastId = toast.loading("Updating...");

            const response = await updateItem({
                id: id as Id<"twentyPercentDF">,
                particulars: data.particulars,
                categoryId: data.categoryId || undefined,
                departmentId: (data.departmentId as any) || undefined,
                implementingOffice: data.implementingOffice,
                totalBudgetAllocated: data.totalBudgetAllocated,
                obligatedBudget: data.obligatedBudget || undefined,
                totalBudgetUtilized: data.totalBudgetUtilized || 0,
                remarks: data.remarks || undefined,
                year: data.year || undefined,
                targetDateCompletion: data.targetDateCompletion || undefined,
                projectManagerId: data.projectManagerId || undefined,
                autoCalculateBudgetUtilized: data.autoCalculateBudgetUtilized,
                reason: "Updated via dashboard UI",
            });

            toast.dismiss(toastId);

            if (isMutationResponse(response)) {
                if (response.success) {
                    toast.success(`"${data.particulars}" updated successfully!`);
                    return true;
                } else {
                    toast.error(response.error.message || "Failed to update");
                    return false;
                }
            } else {
                toast.success(`"${data.particulars}" updated successfully!`);
                return true;
            }
        } catch (error) {
            toast.error("Failed to update");
            console.error("Update error:", error);
            return false;
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const toastId = toast.loading("Moving to trash...");

            const response = await deleteItem({
                id: id as Id<"twentyPercentDF">,
                reason: "Moved to trash via dashboard",
            });

            toast.dismiss(toastId);

            if (isMutationResponse(response)) {
                if (response.success) {
                    toast.success("Moved to trash successfully!");
                    return true;
                } else {
                    toast.error(response.error.message || "Failed to delete");
                    return false;
                }
            } else {
                toast.success("Moved to trash successfully!");
                return true;
            }
        } catch (error) {
            toast.error("Failed to delete");
            console.error("Delete error:", error);
            return false;
        }
    };

    return {
        handleAdd,
        handleEdit,
        handleDelete,
    };
}
