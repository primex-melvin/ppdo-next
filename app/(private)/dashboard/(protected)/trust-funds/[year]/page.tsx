// app/dashboard/trust-funds/[year]/page.tsx

"use client";

import { use, useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { useFundsData, useFundsMutations, FundsPageHeader, FundsStatistics, FundsTable, FundForm, FundsExpandModal, FundsShareModal } from "@/components/features/ppdo/odpp/table-pages/funds";
import { api } from "@/convex/_generated/api";
import { TrashBinModal } from "@/components/shared/modals";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Expand } from "lucide-react";

interface PageProps {
  params: Promise<{ year: string }>;
}

export default function YearTrustFundsPage({ params }: PageProps) {
  const { year: yearParam } = use(params);
  const year = parseInt(yearParam);

  // Use shared hooks with Trust Funds API
  const { funds: trustFunds, statistics, isLoading } = useFundsData({
    listQuery: api.trustFunds.list,
    statsQuery: api.trustFunds.getStatistics,
    converter: (fund) => ({ ...fund, id: fund._id }),
  });

  const { handleAdd, handleEdit, handleDelete } = useFundsMutations({
    createMutation: api.trustFunds.create,
    updateMutation: api.trustFunds.update,
    moveToTrashMutation: api.trustFunds.moveToTrash,
    entityName: "trust fund"
  });

  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showExpandModal, setShowExpandModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Get pending access requests count for share button badge
  const pendingRequestsCount = useQuery(api.accessRequests.getPendingCount);

  // Filter trust funds by year
  const yearFilteredFunds = useMemo(() => {
    if (isNaN(year)) return trustFunds;
    return trustFunds.filter((fund) => fund.year === year);
  }, [trustFunds, year]);

  // Calculate statistics and status summary for filtered items
  const { yearStatistics, statusCounts } = useMemo(() => {
    if (yearFilteredFunds.length === 0) {
      return {
        yearStatistics: {
          totalAllocated: 0,
          totalUtilized: 0,
          totalObligated: 0,
          averageUtilizationRate: 0,
          totalProjects: 0,
        },
        statusCounts: {
          active: 0,
          not_yet_started: 0,
          on_process: 0,
          ongoing: 0,
          completed: 0,
          not_available: 0
        }
      };
    }

    const stats = yearFilteredFunds.reduce(
      (acc, fund) => {
        acc.totalAllocated += fund.received;
        acc.totalUtilized += fund.utilized;
        acc.totalObligated += fund.obligatedPR || 0;

        // Handle all status types including 'active'
        const status = fund.status || 'not_available';

        // Explicitly check each status type
        switch (status) {
          case 'active':
            acc.counts.active = (acc.counts.active || 0) + 1;
            break;
          case 'not_yet_started':
            acc.counts.not_yet_started++;
            break;
          case 'on_process':
            acc.counts.on_process++;
            break;
          case 'ongoing':
            acc.counts.ongoing++;
            break;
          case 'completed':
            acc.counts.completed++;
            break;
          case 'not_available':
          default:
            acc.counts.not_available++;
            break;
        }

        return acc;
      },
      {
        totalAllocated: 0,
        totalUtilized: 0,
        totalObligated: 0,
        counts: {
          active: 0,
          not_yet_started: 0,
          on_process: 0,
          ongoing: 0,
          completed: 0,
          not_available: 0
        }
      }
    );

    const averageUtilizationRate = yearFilteredFunds.length > 0
      ? yearFilteredFunds.reduce((sum, f) => sum + (f.utilizationRate || 0), 0) / yearFilteredFunds.length
      : 0;

    return {
      yearStatistics: {
        totalAllocated: stats.totalAllocated,
        totalUtilized: stats.totalUtilized,
        totalObligated: stats.totalObligated,
        averageUtilizationRate,
        totalProjects: yearFilteredFunds.length,
      },
      statusCounts: stats.counts
    };
  }, [yearFilteredFunds]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>

        <Skeleton className="h-96" />
      </div>
    );
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
    <div className="p-6">
      <FundsPageHeader
        year={year}
        showDetails={showDetails}
        onToggleDetails={() => setShowDetails(!showDetails)}
        pageTitle="Trust Funds"
        pageDescription="Monitor fund allocation, utilization, and project status"
        activityLogType="trustFund"
      />

      {showDetails && (
        <FundsStatistics
          totalAllocated={yearStatistics.totalAllocated}
          totalUtilized={yearStatistics.totalUtilized}
          totalObligated={yearStatistics.totalObligated}
          averageUtilizationRate={yearStatistics.averageUtilizationRate}
          totalProjects={yearStatistics.totalProjects}
          statusCounts={statusCounts}
        />
      )}

      <FundsTable
        data={yearFilteredFunds}
        year={year}
        fundType="trust"
        title="Trust Funds"
        searchPlaceholder="Search trust funds..."
        emptyMessage="No trust funds found"
        activityLogType="trustFund"
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOpenTrash={() => setShowTrashModal(true)}
        FormComponent={FundForm}
        // Enhanced toolbar features
        expandButton={
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Expand table"
            onClick={() => setShowExpandModal(true)}
          >
            <Expand className="w-4 h-4" />
          </Button>
        }
        pendingRequestsCount={pendingRequestsCount}
        onOpenShare={() => setShowShareModal(true)}
      />

      <TrashBinModal
        isOpen={showTrashModal}
        onClose={() => setShowTrashModal(false)}
        type="trustFund"
      />

      <FundsExpandModal
        isOpen={showExpandModal}
        onClose={() => setShowExpandModal(false)}
        fundType="trust"
        year={year}
        title="Trust Funds"
      />

      <FundsShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        fundType="trust"
        title="Trust Funds"
      />
    </div>
  );
}
