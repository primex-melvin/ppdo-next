/**
 * InspectionPageContainer
 *
 * Modular container component for inspection pages across all fund types.
 * Provides a unified interface for managing inspections with entity-type awareness.
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

// Components
import { InspectionPageHeader } from "@/components/features/ppdo/inspection/_components/InspectionPageHeader";
import { InspectionStatistics } from "@/components/features/ppdo/inspection/_components/InspectionStatistics";
import { InspectionTable } from "@/components/features/ppdo/inspection/_components/InspectionTable";
import { NewInspectionForm } from "@/components/features/ppdo/inspection/components/modals/NewInspectionForm";
import { InspectionDetailsModal } from "@/components/features/ppdo/inspection/components/modals/InspectionDetailsModal";

// Hooks
import { useInspectionStats } from "@/components/features/ppdo/inspection/_hooks/useInspectionStats";

// Types
import { Inspection } from "@/components/features/ppdo/inspection/types";

export type EntityType =
  | "project"
  | "specialeducationfund"
  | "specialhealthfund"
  | "trustfund"
  | "twentyPercentDF";

export interface InspectionAdapter {
  // Data fetching
  useGetBreakdown: (id: string) => any;
  useGetParent: (breakdown: any) => any;
  useListInspections: (parentId: string) => any;

  // Mutations
  useCreateInspection: () => any;
  useUpdateInspection: () => any;
  useDeleteInspection: () => any;
  useIncrementViewCount: () => any;

  // Data transformers
  getParentId: (breakdown: any) => string;
  getParentName: (parent: any) => string;
  getBreakdownName: (breakdown: any) => string;
  getImplementingOffice: (parent: any) => string | undefined;

  // Create inspection payload builder
  buildCreatePayload: (parent: any, formData: any) => any;
}

export interface InspectionPageContainerProps {
  // Entity identification
  entityType: EntityType;
  breakdownId: string;

  // Navigation
  backUrl: string;
  backLabel: string;

  // Entity display info
  year: string;

  // Adapter for entity-specific operations
  adapter: InspectionAdapter;

  // Optional: Activity log type
  activityLogType?: string;

  // Optional: Initial show details state
  initialShowDetails?: boolean;
}

export function InspectionPageContainer({
  entityType,
  breakdownId,
  backUrl,
  backLabel,
  year,
  adapter,
  activityLogType,
  initialShowDetails = true,
}: InspectionPageContainerProps) {
  // UI State
  const [showDetails, setShowDetails] = useState(initialShowDetails);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Fetch data using adapter
  const breakdown = adapter.useGetBreakdown(breakdownId);
  const parent = adapter.useGetParent(breakdown);
  const parentId = breakdown ? adapter.getParentId(breakdown) : null;
  const inspections = adapter.useListInspections(parentId || "");

  // Calculate statistics
  const stats = useInspectionStats(inspections as Inspection[] | undefined);

  // Mutations using adapter
  const createInspection = adapter.useCreateInspection();
  const updateInspection = adapter.useUpdateInspection();
  const deleteInspection = adapter.useDeleteInspection();
  const incrementViewCount = adapter.useIncrementViewCount();

  // Handlers
  const handleAdd = async (formData: any) => {
    try {
      if (!parent) {
        toast.error("Parent entity not found");
        return;
      }

      const payload = adapter.buildCreatePayload(parent, formData);
      await createInspection(payload);

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

  // Loading state - Dynamic based on showDetails
  if (!breakdown || !parent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            {/* Header skeleton */}
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div>
            <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>

            {/* Statistics skeleton - only show when details are enabled */}
            {showDetails && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              </div>
            )}

            {/* Table skeleton - always show */}
            <div className="h-96 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const breakdownName = adapter.getBreakdownName(breakdown);
  const parentName = adapter.getParentName(parent);
  const implementingOffice = adapter.getImplementingOffice(parent);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <InspectionPageHeader
          backUrl={backUrl}
          backLabel={backLabel}
          breakdownName={breakdownName}
          projectName={parentName}
          implementingOffice={implementingOffice}
          year={year}
          showDetails={showDetails}
          setShowDetails={setShowDetails}
          showActivityLog={!!activityLogType}
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
