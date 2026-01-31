// NEW - With advanced filters
"use client";

import { Suspense } from "react";
import { DashboardFilters } from "@/components/analytics/DashboardFilters";
import { DashboardContent } from "@/components/analytics/DashboardContent";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { DashboardSkeleton } from "@/components/analytics/DashboardSkeleton";
import { PrintableDashboard } from "@/components/print/PrintableDashboard";

import { use } from "react";

export default function AnalyticsPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = use(params);
  const { filters, updateFilter, resetFilters } = useDashboardFilters();

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Sticky Filter Bar */}
      <DashboardFilters
        filters={filters}
        onChange={updateFilter}
        onReset={resetFilters}
        activeYear={year ? parseInt(year) : undefined}
      />

      {/* Main Content with Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent filters={filters} year={year} />
      </Suspense>

      {/* Print Component */}
      <PrintableDashboard filters={filters} />
    </div>
  );
}