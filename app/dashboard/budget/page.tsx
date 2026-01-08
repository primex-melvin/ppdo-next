"use client";

import { useMemo, useState } from "react";
import { FolderOpen, CalendarClock } from "lucide-react";
import { useRouter } from "next/navigation";
import AccessDeniedPage from "@/components/AccessDeniedPage";
import { BudgetPageHeader } from "./components/BudgetPageHeader";
import { LoadingState } from "./components/LoadingState";
import { useBudgetData, useBudgetAccess } from "./components/useBudgetData";

export default function BudgetTrackingPage() {
  const router = useRouter();
  const { accessCheck, isLoading: isLoadingAccess, canAccess } = useBudgetAccess();
  const { budgetItems, statistics, isLoading: isLoadingData } = useBudgetData();

  const yearsSummary = useMemo(() => {
    const map = new Map<number, { count: number; totalAllocated: number; totalUtilized: number }>();

    budgetItems.forEach((item) => {
      if (!item.year) return;
      const current = map.get(item.year) || { count: 0, totalAllocated: 0, totalUtilized: 0 };
      map.set(item.year, {
        count: current.count + 1,
        totalAllocated: current.totalAllocated + item.totalBudgetAllocated,
        totalUtilized: current.totalUtilized + item.totalBudgetUtilized,
      });
    });

    return Array.from(map.entries())
      .map(([year, summary]) => ({ year, ...summary }))
      .sort((a, b) => b.year - a.year);
  }, [budgetItems]);

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

  if (isLoadingData) {
    return <LoadingState />;
  }

  return (
    <>
      <BudgetPageHeader />

      {yearsSummary.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Budget by Year
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Click a year to view filtered budget items
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {yearsSummary.map(({ year, count, totalAllocated, totalUtilized }) => (
              <button
                key={year}
                onClick={() => router.push(`/dashboard/budget/year/${year}`)}
                className="cursor-pointer w-full text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{year}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                    {count} item{count !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span>Allocated</span>
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">₱{totalAllocated.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  <span>Utilized</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">₱{totalUtilized.toLocaleString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}