"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Folder, Calendar } from "lucide-react";
import AccessDeniedPage from "@/components/AccessDeniedPage";
import { LoadingState, useBudgetAccess, useBudgetData } from "./budget/components";

export default function ProjectDashboardLanding() {
  const router = useRouter();
  const { accessCheck, isLoading: isLoadingAccess, canAccess } = useBudgetAccess();
  const { budgetItems, isLoading: isLoadingData } = useBudgetData();

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const item of budgetItems) {
      if (typeof item.year === "number") set.add(item.year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [budgetItems]);

  if (isLoadingAccess || isLoadingData) {
    return <LoadingState message="Loading available years..." />;
  }

  if (!canAccess) {
    return (
      <AccessDeniedPage
        userName={accessCheck?.user?.name || ""}
        userEmail={accessCheck?.user?.email || ""}
        departmentName={accessCheck?.department?.name || "Not Assigned"}
        pageRequested="Project Budget"
      />
    );
  }

  const handleOpenYear = (year: number) => {
    try {
      localStorage.setItem("budget_selected_year", String(year));
    } catch (_) {
      // Ignore storage failures; user can still filter manually
    }
    router.push("/dashboard/project/budget/");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Budget Years</h1>
      </div>

      {years.length === 0 ? (
        <div className="min-h-[300px] flex items-center justify-center text-zinc-600 dark:text-zinc-400">
          No budget data available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {years.map((year) => (
            <button
              key={year}
              onClick={() => handleOpenYear(year)}
              className="cursor-pointer group relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 text-left shadow-sm hover:shadow-md transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Year
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {year}
                  </div>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-300/40 to-amber-500/40 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
