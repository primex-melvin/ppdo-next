"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Expand } from "lucide-react";
import AccessDeniedPage from "@/components/AccessDeniedPage";
import { BudgetTrackingTable } from "../../components/BudgetTrackingTable";
import { BudgetStatistics } from "../../components/BudgetStatistics";
import { BudgetPageHeader } from "../../components/BudgetPageHeader";
import { ExpandModal } from "../../components/ExpandModal";
import { LoadingState } from "../../components/LoadingState";
import { useBudgetAccess, useBudgetData } from "../../components/useBudgetData";
import { useBudgetMutations } from "../../components/useBudgetMutations";
import { TrashBinModal } from "@/app/dashboard/components/TrashBinModal";
import { useBreadcrumb } from "@/app/dashboard/contexts/BreadcrumbContext";


export default function BudgetYearPage() {
  const router = useRouter();
  const params = useParams<{ year: string }>();
  const yearParam = Array.isArray(params?.year) ? params?.year[0] : params?.year;
  const year = Number(yearParam);
  const { setCustomBreadcrumbs } = useBreadcrumb();

  const { accessCheck, isLoading: isLoadingAccess, canAccess } = useBudgetAccess();
  const { budgetItems, isLoading: isLoadingData } = useBudgetData();
  const { handleAdd, handleEdit, handleDelete } = useBudgetMutations();

  const [isExpandModalOpen, setIsExpandModalOpen] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);

  const filteredItems = useMemo(
    () => budgetItems.filter((item) => item.year === year),
    [budgetItems, year]
  );

  const yearStats = useMemo(() => {
    const totalAllocated = filteredItems.reduce(
      (acc, item) => acc + item.totalBudgetAllocated,
      0
    );
    const totalUtilized = filteredItems.reduce(
      (acc, item) => acc + item.totalBudgetUtilized,
      0
    );
    const totalProjects = filteredItems.length;
    const averageUtilizationRate =
      totalAllocated > 0 ? (totalUtilized / totalAllocated) * 100 : 0;

    return {
      totalAllocated,
      totalUtilized,
      averageUtilizationRate,
      totalProjects,
    };
  }, [filteredItems]);

  useEffect(() => {
    if (!Number.isNaN(year)) {
      setCustomBreadcrumbs([
        { label: "Home", href: "/dashboard" },
        { label: "Budget", href: "/dashboard/budget" },
        { label: String(year) },
      ]);
    }
    return () => setCustomBreadcrumbs(null);
  }, [setCustomBreadcrumbs, year]);

  if (isLoadingAccess) {
    return <LoadingState message="Checking access permissions..." />;
  }

  if (!canAccess) {
    return (
      <AccessDeniedPage
        userName={accessCheck?.user?.name || ""}
        userEmail={accessCheck?.user?.email || ""}
        departmentName={accessCheck?.department?.name || "Not Assigned"}
        pageRequested="Budget Tracking"
      />
    );
  }

  if (Number.isNaN(year)) {
    return <LoadingState message="Invalid year" />;
  }

  if (isLoadingData) {
    return <LoadingState />;
  }

  return (
    <>
      <BudgetPageHeader />

      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          onClick={() => router.push("/dashboard/budget")}
          className="cursor-pointer inline-flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all years
        </button>
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Year {year}
        </div>
      </div>

      <BudgetStatistics
        totalAllocated={yearStats.totalAllocated}
        totalUtilized={yearStats.totalUtilized}
        averageUtilizationRate={yearStats.averageUtilizationRate}
        totalProjects={yearStats.totalProjects}
      />

      <div className="mb-6">
        <BudgetTrackingTable
          budgetItems={filteredItems}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenTrash={() => setShowTrashModal(true)}
          initialYear={year}
          expandButton={
            <button
              onClick={() => setIsExpandModalOpen(true)}
              className="cursor-pointer items-center justify-center px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <Expand className="w-4 h-4" />
            </button>
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
