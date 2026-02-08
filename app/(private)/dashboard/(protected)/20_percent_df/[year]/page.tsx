"use client";

import { use, useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { TrashBinModal } from "@/components/shared/modals";

// 20% DF Components
import { TwentyPercentDFTable } from "@/components/features/ppdo/odpp/table-pages/twenty-percent-df/components/TwentyPercentDFTable";
import { TwentyPercentDFStatistics } from "@/components/features/ppdo/odpp/table-pages/twenty-percent-df/components/TwentyPercentDFStatistics";
import { TwentyPercentDFYearHeader } from "./components/TwentyPercentDFYearHeader";

// Types
import { TwentyPercentDF } from "@/components/features/ppdo/odpp/table-pages/twenty-percent-df/types";

interface PageProps {
    params: Promise<{ year: string }>;
}

export default function YearTwentyPercentDFPage({ params }: PageProps) {
    const { year: yearParam } = use(params);
    const year = parseInt(yearParam);

    // Fetch data
    const projectsRaw = useQuery(api.twentyPercentDF.list, { year });
    const projects = useMemo(() => {
        if (!projectsRaw) return [];
        return projectsRaw.map((item) => ({
            ...item,
            id: item._id,
        }));
    }, [projectsRaw]);
    const isLoading = projectsRaw === undefined;

    // Mutations (only for top-level page actions if needed, table handles most)
    const createProject = useMutation(api.twentyPercentDF.create);
    const updateProject = useMutation(api.twentyPercentDF.update);
    const moveToTrash = useMutation(api.twentyPercentDF.moveToTrash);

    const [showTrashModal, setShowTrashModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    // Calculate statistics
    const yearStatistics = useMemo(() => {
        if (projects.length === 0) {
            return {
                totalAllocated: 0,
                totalUtilized: 0,
                totalObligated: 0,
                averageUtilizationRate: 0,
                totalProjects: 0,
            };
        }

        const totalAllocated = projects.reduce((sum, p) => sum + p.totalBudgetAllocated, 0);
        const totalUtilized = projects.reduce((sum, p) => sum + p.totalBudgetUtilized, 0);
        const totalObligated = projects.reduce((sum, p) => sum + (p.obligatedBudget || 0), 0);
        const averageUtilizationRate = projects.reduce((sum, p) => sum + p.utilizationRate, 0) / projects.length;

        return {
            totalAllocated,
            totalUtilized,
            totalObligated,
            averageUtilizationRate,
            totalProjects: projects.length,
        };
    }, [projects]);

    const handleAdd = async (data: Omit<TwentyPercentDF, "id" | "utilizationRate" | "projectCompleted" | "projectDelayed" | "projectsOngoing" | "status"> & { autoCalculateBudgetUtilized?: boolean }) => {
        try {
            await createProject({
                ...data,
                year,
            });
            toast.success("Successfully added 20% DF item");
        } catch (error) {
            toast.error("Failed to add item");
            console.error(error);
        }
    };

    const handleEdit = async (id: string, data: Partial<TwentyPercentDF>) => {
        try {
            // Remove id and _id from data to avoid conflict and type mismatch
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: _, _creationTime, ...updateData } = data as any;

            await updateProject({
                id: id as Id<"twentyPercentDF">,
                ...updateData,
            });
            toast.success("Successfully updated 20% DF item");
        } catch (error) {
            toast.error("Failed to update item");
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await moveToTrash({ id: id as Id<"twentyPercentDF"> });
            toast.success("Moved to trash");
        } catch (error) {
            toast.error("Failed to delete item");
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    if (isNaN(year)) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
                        Invalid Year
                    </p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        The year parameter &quot;{yearParam}&quot; is not valid.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <TwentyPercentDFYearHeader
                year={year}
                pageTitle="20% Development Fund"
                pageDescription="Monitor 20% development fund allocations and utilization"
                showDetails={showDetails}
                onToggleDetails={() => setShowDetails(!showDetails)}

                activityLogType="twentyPercentDF"
            />

            {showDetails && (
                <TwentyPercentDFStatistics
                    totalAllocated={yearStatistics.totalAllocated}
                    totalUtilized={yearStatistics.totalUtilized}
                    totalObligated={yearStatistics.totalObligated}
                    averageUtilizationRate={yearStatistics.averageUtilizationRate}
                    totalProjects={yearStatistics.totalProjects}
                    items={projects as any}
                />
            )}

            <TwentyPercentDFTable
                items={projects as any}
                budgetItemYear={year}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onOpenTrash={() => setShowTrashModal(true)}
            />

            <TrashBinModal
                isOpen={showTrashModal}
                onClose={() => setShowTrashModal(false)}
                type="twentyPercentDF"
            />
        </div>
    );
}