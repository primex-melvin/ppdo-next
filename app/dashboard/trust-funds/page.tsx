// app/dashboard/trust-funds/page.tsx

"use client";

import { useState } from "react";
import { TrustFundsPageHeader } from "./TrustFundsPageHeader";
import TrustFundStatistics from "./components/TrustFundStatistics";
import { TrustFundsTable } from "./components/TrustFundsTable";
import { useTrustFundData } from "./components/hooks/useTrustFundData";
import { useTrustFundMutations } from "./components/hooks/useTrustFundMutations";
import { TrashBinModal } from "@/components/TrashBinModal";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrustFundsPage() {
  const { trustFunds, statistics, isLoading } = useTrustFundData();
  const { handleAdd, handleEdit, handleDelete } = useTrustFundMutations();
  
  const [showTrashModal, setShowTrashModal] = useState(false);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <TrustFundsPageHeader />

      <TrustFundStatistics
        totalReceived={statistics.totalReceived}
        totalUtilized={statistics.totalUtilized}
        totalBalance={statistics.totalBalance}
        totalProjects={statistics.totalProjects}
      />

      <TrustFundsTable
        data={trustFunds}
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