// app/dashboard/trust-funds/[year]/[trustfundbreakdownId]/page.tsx

/**
 * Trust Fund Breakdown Page (Container Component)
 *
 * Implements the "Container/Presenter" architecture where:
 * - This container handles data fetching and mutations
 * - Shared UI components handle presentation
 * - No recalculate status button (Trust Fund status is managed manually on parent page)
 */

"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";

// API & Models
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Contexts & Hooks
import { useDashboardBreadcrumbs } from "@/lib/hooks/useDashboardBreadcrumbs";

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
import { Wallet } from "lucide-react";

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

export default function TrustFundBreakdownPage() {
  const params = useParams();

  // Extract Params
  const year = params.year as string;
  const slugWithId = params.slug as string;
  const trustFundId = extractIdFromSlug(slugWithId);

  // Local State
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<Breakdown | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showTrashConfirmModal, setShowTrashConfirmModal] = useState(false);

  // Queries
  const trustFund = useQuery(
    api.trustFunds.get,
    trustFundId ? { id: trustFundId as Id<"trustFunds"> } : "skip"
  );

  const breakdownHistory = useQuery(
    api.trustFundBreakdowns.getBreakdowns,
    trustFund ? { trustFundId: trustFundId as Id<"trustFunds"> } : "skip"
  );

  const departments = useQuery(api.departments.list, { includeInactive: false });

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

  // Breadcrumbs with shared logic
  const yearLabel = formatYearLabel(year);

  useDashboardBreadcrumbs({
    isDataLoaded: !!trustFund,
    loadingBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "Trust Funds", href: "/dashboard/trust-funds" },
      { label: yearLabel, href: `/dashboard/trust-funds/${year}` },
      { label: "Loading...", loading: true },
    ],
    loadedBreadcrumbs: [
      { label: "Home", href: "/dashboard" },
      { label: "Trust Funds", href: "/dashboard/trust-funds" },
      { label: yearLabel, href: `/dashboard/trust-funds/${year}` },
      { label: trustFund?.projectTitle || "Loading..." },
    ],
    dependencies: [trustFund, year],
  });

  // Mutations
  const createBreakdown = useMutation(api.trustFundBreakdowns.createBreakdown);
  const updateBreakdown = useMutation(api.trustFundBreakdowns.updateBreakdown);
  const deleteBreakdown = useMutation(api.trustFundBreakdowns.moveToTrash);
  const toggleAutoCalculate = useMutation(api.trustFunds.toggleAutoCalculateFinancials);

  // Handlers
  const handlePrint = () => window.print();

  const handleAdd = async (breakdownData: Omit<Breakdown, "_id">) => {
    try {
      if (!trustFund) {
        toast.error("Trust Fund not found");
        return;
      }
      // Filter out fields not accepted by createBreakdown mutation
      const {
        batchId,
        utilizationRate,
        balance,
        projectId,
        specialEducationFundId,
        specialHealthFundId,
        ...validData
      } = breakdownData as any;

      await createBreakdown({
        ...validData,
        trustFundId: trustFundId as Id<"trustFunds">,
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
        specialEducationFundId,
        specialHealthFundId,
        trustFundId,
        ...validData
      } = breakdownData as any;

      await updateBreakdown({
        id: selectedBreakdown._id as Id<"trustFundBreakdowns">,
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
        id: selectedBreakdown._id as Id<"trustFundBreakdowns">,
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
        id: id as Id<"trustFundBreakdowns">,
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
      {/* Shared Header Component - NO recalculate button for Trust Funds */}
      <BreakdownHeader
        backUrl={`/dashboard/trust-funds/${year}`}
        backLabel="Back to Trust Funds"
        icon={Wallet}
        iconBgClass="bg-emerald-100 dark:bg-emerald-900/30"
        iconTextClass="text-emerald-700 dark:text-emerald-300"
        entityName={trustFund?.projectTitle}
        entityType="trustfund"
        implementingOffice={trustFund?.officeInCharge}
        year={year}
        subtitle={`Historical breakdown and progress tracking for ${year}`}
        showHeader={showDetails}
        setShowHeader={setShowDetails}
        showRecalculateButton={false} // Key difference from Projects
        showActivityLog={true}
        isAutoCalculate={trustFund?.autoCalculateFinancials}
        onToggleAutoCalculate={async () => {
          if (!trustFund) return;
          await toggleAutoCalculate({ id: trustFundId as Id<"trustFunds"> });
          toast.success("Auto-calculation settings updated");
        }}
      />

      <BreakdownStatistics
        showDetails={showDetails}
        totalAllocated={trustFund?.received || 0}
        totalUtilized={stats?.totalUtilizedBudget || 0}
        totalObligated={trustFund?.obligatedPR || 0}
        averageUtilizationRate={stats?.averageUtilizationRate || 0}
        totalBreakdowns={breakdownHistory?.length || 0}
        statusCounts={stats?.statusCounts || { completed: 0, ongoing: 0, delayed: 0 }}
      />

      {/* Breakdown Table - Reused from Project */}
      <div className="mb-6">
        {breakdownHistory === undefined ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent"></div>
            <p className="mt-4 text-sm text-sm text-zinc-600 dark:text-zinc-400">
              Loading breakdown history...
            </p>
          </div>
        ) : (
          <BreakdownHistoryTable
            breakdowns={breakdownHistory as Breakdown[]}
            onPrint={handlePrint}
            onAdd={() => setShowAddModal(true)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onOpenTrash={() => setShowTrashModal(true)}
            entityType="trustfund"
            entityName={trustFund?.projectTitle}
            enableInspectionNavigation={true}
            navigationParams={{ year, slug: slugWithId }}
          />
        )}
      </div>

      {/* Modals */}
      {showAddModal && trustFund && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Breakdown Record"
          size="xl"
        >
          <BreakdownForm
            defaultProjectName={trustFund.projectTitle}
            defaultImplementingOffice={trustFund.officeInCharge}
            projectId={trustFundId}
            onSave={handleAdd}
            onCancel={() => setShowAddModal(false)}
            entityType="trustfund"
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
            projectId={trustFundId}
            onSave={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedBreakdown(null);
            }}
            entityType="trustfund"
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
