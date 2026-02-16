// app/dashboard/20_percent_df/[year]/[slug]/page.tsx

"use client";

import { useState, use, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";

// API & Models
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Contexts & Hooks
import { useDashboardBreadcrumbs } from "@/lib/hooks/useDashboardBreadcrumbs";
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
import { Modal } from "@/components/features/ppdo/odpp/table-pages/11_project_plan";
import { TrashConfirmationModal } from "@/components/shared/modals/TrashConfirmationModal";

// Shared Hooks
import { useEntityStats, useEntityMetadata } from "@/lib/hooks/useEntityStats";

// Utils
import { extractIdFromSlug, formatYearLabel } from "@/lib/utils/breadcrumb-utils";
import { PieChart } from "lucide-react";

// Utility function to get status color
function getStatusColor(status?: string): string {
    if (!status) return "";
    switch (status.toLowerCase()) {
        case "completed":
            return "text-green-700 dark:text-green-300";
        case "delayed":
            return "text-red-700 dark:text-red-300";
        case "ongoing":
            return "text-blue-700 dark:text-blue-300";
        default:
            return "";
    }
}

interface PageProps {
    params: Promise<{ year: string; slug: string }>;
}

export default function TwentyPercentDFBreakdownPage({ params }: PageProps) {
    const { year, slug } = use(params);

    // Extract ID
    const fundId = extractIdFromSlug(slug);

    // Local State
    const [showTrashModal, setShowTrashModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showTrashConfirmModal, setShowTrashConfirmModal] = useState(false);
    const [selectedBreakdown, setSelectedBreakdown] = useState<Breakdown | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // Queries
    const fund = useQuery(
        api.twentyPercentDF.get,
        fundId ? { id: fundId as Id<"twentyPercentDF"> } : "skip"
    );

    const breakdownHistory = useQuery(
        api.twentyPercentDFBreakdowns.list,
        fund ? { twentyPercentDFId: fundId as Id<"twentyPercentDF"> } : "skip"
    );

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

    // Hooks - Using shared hooks for statistics
    const stats = useEntityStats(breakdownHistory as Breakdown[] | undefined);
    const metadata = useEntityMetadata(breakdownHistory as Breakdown[] | undefined);

    // Sort breakdown history with URL persistence
    const { sortedItems: sortedBreakdowns, sortOption, setSortOption } = useSort({
        items: (breakdownHistory as Breakdown[]) || [],
        initialSort: "lastModified",
        sortFieldMap: {
            nameField: "projectName",
            allocatedField: "allocatedBudget",
            obligatedField: "obligatedBudget",
            utilizedField: "budgetUtilized",
            modifiedField: "_creationTime",
        },
        enableUrlPersistence: true,
    });

    // Breadcrumbs with shared logic
    const yearLabel = formatYearLabel(year);

    useDashboardBreadcrumbs({
        isDataLoaded: !!fund,
        loadingBreadcrumbs: [
            { label: "Home", href: "/dashboard" },
            { label: "20% Development Fund", href: "/dashboard/20_percent_df" },
            { label: yearLabel, href: `/dashboard/20_percent_df/${year}` },
            { label: "Loading...", loading: true },
        ],
        loadedBreadcrumbs: [
            { label: "Home", href: "/dashboard" },
            { label: "20% Development Fund", href: "/dashboard/20_percent_df" },
            { label: yearLabel, href: `/dashboard/20_percent_df/${year}` },
            { label: fund?.particulars || "Loading..." },
        ],
        dependencies: [fund, year],
    });

    // Mutations
    const createBreakdown = useMutation(api.twentyPercentDFBreakdowns.createBreakdown);
    const updateBreakdown = useMutation(api.twentyPercentDFBreakdowns.updateBreakdown);
    const deleteBreakdown = useMutation(api.twentyPercentDFBreakdowns.moveToTrash);
    const toggleAutoCalculate = useMutation(api.twentyPercentDF.toggleAutoCalculateFinancials);

    // Handlers
    const handlePrint = () => window.print();

    const handleAdd = async (breakdownData: Omit<Breakdown, "_id">) => {
        try {
            if (!fund) {
                toast.error("Fund not found");
                return;
            }
            // Filter out fields not accepted by createBreakdown mutation
            const {
                batchId,
                utilizationRate,
                balance,
                projectId,
                trustFundId,
                specialHealthFundId,
                specialEducationFundId,
                ...validData
            } = breakdownData as any;

            await createBreakdown({
                ...validData,
                twentyPercentDFId: fundId as Id<"twentyPercentDF">,
                reportDate: validData.reportDate || Date.now(),
            });

            toast.success("Breakdown record created successfully!");
            setShowAddModal(false);
        } catch (error: any) {
            toast.error("Failed to create breakdown record", {
                description: error.message,
            });
        }
    };

    const handleUpdate = async (breakdownData: Omit<Breakdown, "_id">) => {
        try {
            if (!selectedBreakdown) {
                toast.error("No breakdown selected");
                return;
            }
            // Filter out fields not accepted by updateBreakdown mutation
            const {
                batchId,
                utilizationRate,
                balance,
                projectId,
                trustFundId,
                specialHealthFundId,
                specialEducationFundId,
                twentyPercentDFId,
                ...validData
            } = breakdownData as any;

            await updateBreakdown({
                breakdownId: selectedBreakdown._id as Id<"twentyPercentDFBreakdowns">,
                ...validData,
            });

            toast.success("Breakdown record updated successfully!");
            setShowEditModal(false);
            setSelectedBreakdown(null);
        } catch (error: any) {
            toast.error("Failed to update breakdown record", {
                description: error.message,
            });
        }
    };

    const handleConfirmDelete = async (reason?: string) => {
        try {
            if (!selectedBreakdown) return;
            await deleteBreakdown({
                breakdownId: selectedBreakdown._id as Id<"twentyPercentDFBreakdowns">,
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
            setSelectedBreakdown(breakdown as Breakdown);
            setShowTrashConfirmModal(true);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await updateBreakdown({
                breakdownId: id as Id<"twentyPercentDFBreakdowns">,
                status: newStatus as "ongoing" | "completed" | "delayed",
            });
            toast.success("Status updated successfully");
        } catch (error: any) {
            toast.error("Failed to update status", {
                description: error.message,
            });
        }
    };

    return (
        <>
            <BreakdownHeader
                backUrl={`/dashboard/20_percent_df/${year}`}
                backLabel="Back to 20% Development Fund"
                icon={PieChart}
                iconBgClass="bg-amber-100 dark:bg-amber-900/30"
                iconTextClass="text-amber-700 dark:text-amber-300"
                entityName={fund?.particulars}
                entityType="twentyPercentDF"
                implementingOffice={fund?.implementingOffice}
                year={year}
                subtitle={`Historical breakdown and progress tracking for ${year}`}
                showHeader={showDetails}
                setShowHeader={setShowDetails}
                showRecalculateButton={false}
                showActivityLog={true}
                isAutoCalculate={fund?.autoCalculateBudgetUtilized}
                onToggleAutoCalculate={async () => {
                    if (!fund) return;
                    await toggleAutoCalculate({
                        id: fundId as Id<"twentyPercentDF">,
                        autoCalculate: !fund.autoCalculateBudgetUtilized,
                        reason: `Toggled to ${!fund.autoCalculateBudgetUtilized ? 'auto' : 'manual'} mode from header`
                    });
                    toast.success("Auto-calculation settings updated");
                }}
            />

            <BreakdownStatistics
                showDetails={showDetails}
                totalAllocated={fund?.totalBudgetAllocated || 0}
                totalUtilized={stats?.totalUtilizedBudget || 0}
                totalObligated={fund?.obligatedBudget || 0}
                averageUtilizationRate={stats?.averageUtilizationRate || 0}
                totalBreakdowns={breakdownHistory?.length || 0}
                statusCounts={stats?.statusCounts || { completed: 0, ongoing: 0, delayed: 0 }}
            />

            <div className="mb-6">
                {breakdownHistory === undefined ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent"></div>
                        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                            Loading breakdown history...
                        </p>
                    </div>
                ) : (
                    <BreakdownHistoryTable
                        breakdowns={sortedBreakdowns}
                        onPrint={handlePrint}
                        onAdd={() => setShowAddModal(true)}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        onOpenTrash={() => setShowTrashModal(true)}
                        entityType="twentyPercentDF"
                        entityName={fund?.particulars}
                        enableInspectionNavigation={true}
                        navigationParams={{ year, slug }}
                        sortOption={sortOption}
                        onSortChange={setSortOption}
                    />
                )}
            </div>

            {showAddModal && fund && (
                <Modal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    title="Add Breakdown Record"
                    size="xl"
                >
                    <BreakdownForm
                        defaultProjectName={fund.particulars}
                        defaultImplementingOffice={fund.implementingOffice}
                        projectId={fundId}
                        onSave={handleAdd}
                        onCancel={() => setShowAddModal(false)}
                        entityType="twentyPercentDF"
                    />
                </Modal>
            )}

            {showEditModal && selectedBreakdown && (
                <Modal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedBreakdown(null);
                    }}
                    title="Edit Breakdown Record"
                    size="xl"
                >
                    <BreakdownForm
                        breakdown={selectedBreakdown}
                        projectId={fundId}
                        onSave={handleUpdate}
                        onCancel={() => {
                            setShowEditModal(false);
                            setSelectedBreakdown(null);
                        }}
                        entityType="twentyPercentDF"
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

            <TrashBinModal
                isOpen={showTrashModal}
                onClose={() => setShowTrashModal(false)}
                type="breakdown"
            />
        </>
    );
}
