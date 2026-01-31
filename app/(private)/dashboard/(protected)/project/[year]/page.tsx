// app/dashboard/project/[year]/page.tsx

"use client";

import { use, useEffect } from "react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Expand } from "lucide-react";
import AccessDeniedPage from "@/components/AccessDeniedPage";
import { TrashBinModal } from "@/components/TrashBinModal";
import {
  BudgetStatistics,
  BudgetTrackingTable,
  ExpandModal,
  useBudgetAccess,
  useBudgetData,
  useBudgetMutations,
  YearBudgetPageHeader,
} from "@/components/ppdo/11_project_plan";
import { LoadingState } from "@/components/ppdo/LoadingState";
import { Button } from "@/components/ui/button";
import { BudgetItem } from "@/components/ppdo/11_project_plan/types";

interface PageProps {
  params: Promise<{ year: string }>;
}

export default function YearBudgetPage({ params }: PageProps) {
  const { year: yearParam } = use(params);
  const router = useRouter();

  // Handle "budget" as a special case - redirect to project landing
  useEffect(() => {
    if (yearParam.toLowerCase() === 'budget') {
      router.replace('/dashboard/project');
    }
  }, [yearParam, router]);

  const year = parseInt(yearParam);

  const { accessCheck, isLoading: isLoadingAccess, canAccess } = useBudgetAccess();
  const { budgetItems, statistics, isLoading: isLoadingData } = useBudgetData();
  const { handleAdd, handleEdit, handleDelete } = useBudgetMutations();

  const [isExpandModalOpen, setIsExpandModalOpen] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);

  // Filter budget items by year
  const yearFilteredItems = useMemo(() => {
    if (isNaN(year)) return budgetItems;
    return budgetItems.filter((item: BudgetItem) => item.year === year);
  }, [budgetItems, year]);

  // Calculate statistics for filtered items
  const yearStatistics = useMemo(() => {
    if (yearFilteredItems.length === 0) {
      return {
        totalAllocated: 0,
        totalUtilized: 0,
        totalObligated: 0, // 🆕 NEW
        averageUtilizationRate: 0,
        totalProjects: 0,
      };
    }

    const totalAllocated = yearFilteredItems.reduce(
      (sum, item) => sum + item.totalBudgetAllocated,
      0
    );
    const totalUtilized = yearFilteredItems.reduce(
      (sum, item) => sum + item.totalBudgetUtilized,
      0
    );
    // 🆕 NEW: Calculate total obligated budget
    const totalObligated = yearFilteredItems.reduce(
      (sum, item) => sum + (item.obligatedBudget || 0),
      0
    );
    const averageUtilizationRate = yearFilteredItems.reduce(
      (sum, item) => sum + item.utilizationRate,
      0
    ) / yearFilteredItems.length;

    return {
      totalAllocated,
      totalUtilized,
      totalObligated, // 🆕 NEW
      averageUtilizationRate,
      totalProjects: yearFilteredItems.length,
    };
  }, [yearFilteredItems]);

  if (isLoadingAccess) {
    return <LoadingState message="Checking access permissions..." />;
  }

  if (!canAccess) {
    return (
      <AccessDeniedPage
        userName={accessCheck?.user?.name || ""}
        userEmail={accessCheck?.user?.email || ""}
        departmentName={accessCheck?.department?.name || "Not Assigned"}
        pageRequested={`Budget Tracking ${year}`}
      />
    );
  }

  if (isLoadingData) {
    return <LoadingState message={`Loading budget data for ${year}...`} />;
  }

  // Validate year
  if (isNaN(year)) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
            Invalid Year
          </p>
          <p className="text-zinc-600 dark:text-zinc-400">
            The year parameter "{yearParam}" is not valid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <YearBudgetPageHeader year={year} />

      <BudgetStatistics
        totalAllocated={yearStatistics.totalAllocated}
        totalUtilized={yearStatistics.totalUtilized}
        totalObligated={yearStatistics.totalObligated}
        averageUtilizationRate={yearStatistics.averageUtilizationRate}
        totalProjects={yearStatistics.totalProjects}
        items={yearFilteredItems}
      />

      <div className="mb-6">
        <BudgetTrackingTable
          budgetItems={yearFilteredItems}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenTrash={() => setShowTrashModal(true)}
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
        type="budget"
      />

      <ExpandModal
        isOpen={isExpandModalOpen}
        onClose={() => setIsExpandModalOpen(false)}
      />
    </>
  );
}