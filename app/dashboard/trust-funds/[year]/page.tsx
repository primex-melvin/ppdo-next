// app/dashboard/trust-funds/[year]/page.tsx

"use client";

import { use, useState, useMemo } from "react";
import { useTrustFundData } from "./components/hooks/useTrustFundData";
import { useTrustFundMutations } from "./components/hooks/useTrustFundMutations";
import { YearTrustFundsPageHeader } from "./components/YearTrustFundsPageHeader";
import TrustFundStatistics from "./components/TrustFundStatistics";
import { TrustFundsTable } from "./components/TrustFundsTable";
import { TrashBinModal } from "@/components/TrashBinModal";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  params: Promise<{ year: string }>;
}

export default function YearTrustFundsPage({ params }: PageProps) {
  const { year: yearParam } = use(params);
  const year = parseInt(yearParam);

  const { trustFunds, statistics, isLoading } = useTrustFundData();
  const { handleAdd, handleEdit, handleDelete } = useTrustFundMutations();
  
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showDetails, setShowDetails] = useState(true);

  // Filter trust funds by year
  const yearFilteredFunds = useMemo(() => {
    if (isNaN(year)) return trustFunds;
    return trustFunds.filter((fund) => fund.year === year);
  }, [trustFunds, year]);

  // Calculate statistics for filtered items
  const yearStatistics = useMemo(() => {
    if (yearFilteredFunds.length === 0) {
      return {
        totalReceived: 0,
        totalUtilized: 0,
        totalBalance: 0,
        totalProjects: 0,
      };
    }

    const totalReceived = yearFilteredFunds.reduce(
      (sum, fund) => sum + fund.received,
      0
    );
    const totalUtilized = yearFilteredFunds.reduce(
      (sum, fund) => sum + fund.utilized,
      0
    );
    const totalBalance = yearFilteredFunds.reduce(
      (sum, fund) => sum + fund.balance,
      0
    );

    return {
      totalReceived,
      totalUtilized,
      totalBalance,
      totalProjects: yearFilteredFunds.length,
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
      <YearTrustFundsPageHeader 
        year={year}
        showDetails={showDetails}
        onToggleDetails={() => setShowDetails(!showDetails)}
      />

      {showDetails && (
        <TrustFundStatistics
          totalReceived={yearStatistics.totalReceived}
          totalUtilized={yearStatistics.totalUtilized}
          totalBalance={yearStatistics.totalBalance}
          totalProjects={yearStatistics.totalProjects}
        />
      )}

      <TrustFundsTable
        data={yearFilteredFunds}
        year={year} // ✅ ADDED: Pass year from URL
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOpenTrash={() => setShowTrashModal(true)}
      />

      <TrashBinModal
        isOpen={showTrashModal}
        onClose={() => setShowTrashModal(false)}
        type="trustFund"
      />
    </div>
  );
}