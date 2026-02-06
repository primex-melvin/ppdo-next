"use client";

import React from "react";
import {
  ResizableModal,
  ResizableModalContent,
  ResizableModalHeader,
  ResizableModalFooter,
  ResizableModalTitle,
  ResizableModalDescription,
  ResizableModalBody,
} from "@/components/ui/resizable-modal";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Building2,
  Calendar,
  Target,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  List,
  TrendingUp,
  Coins,
  Receipt,
} from "lucide-react";

export interface MigrationVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void; // Proceed to summary
  onCancel: () => void; // Go back to input
  verificationData: {
    sourceBudgetItem: { particulars: string; _id: string };
    targetYear: number;
    projectsCount: number;
    totalBreakdownsCount: number;
    sourceTotals: {
      totalAllocated: number;
      totalUtilized: number;
      totalObligated: number;
    };
    targetTotals: {
      // Will be same as source (exact copy)
      totalAllocated: number;
      totalUtilized: number;
      totalObligated: number;
    };
  } | null;
  isLoading?: boolean;
}

const formatCurrency = (amount: number) => {
  return `₱${amount.toLocaleString("en-PH")}`;
};

export function MigrationVerificationModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  verificationData,
  isLoading = false,
}: MigrationVerificationModalProps) {
  // Check if totals match between source and target
  const totalsMatch = React.useMemo(() => {
    if (!verificationData) return true;
    const { sourceTotals, targetTotals } = verificationData;
    return (
      sourceTotals.totalAllocated === targetTotals.totalAllocated &&
      sourceTotals.totalUtilized === targetTotals.totalUtilized &&
      sourceTotals.totalObligated === targetTotals.totalObligated
    );
  }, [verificationData]);

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <ResizableModal open={open} onOpenChange={handleClose}>
      <ResizableModalContent
        width={640}
        maxWidth="95vw"
        maxHeight="85vh"
        preventOutsideClick={isLoading}
      >
        <ResizableModalHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <ResizableModalTitle>Verify Migration Data</ResizableModalTitle>
              <ResizableModalDescription>
                Compare source totals with target totals before proceeding
              </ResizableModalDescription>
            </div>
          </div>
        </ResizableModalHeader>

        <ResizableModalBody className="px-6 py-5 space-y-5">
          {verificationData ? (
            <>
              {/* Comparison Cards - Side by Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Card */}
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        Source Data
                      </span>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        Budget Items
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                      {verificationData.sourceBudgetItem.particulars}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
                      {verificationData.sourceBudgetItem._id}
                    </p>
                  </div>

                  {/* Source Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800/50">
                      <div className="flex items-center gap-1.5">
                        <Coins className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          Total Allocated
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(verificationData.sourceTotals.totalAllocated)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800/50">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          Total Utilized
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(verificationData.sourceTotals.totalUtilized)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800/50">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          Total Obligated
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(verificationData.sourceTotals.totalObligated)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800/50">
                      <div className="flex items-center gap-1.5">
                        <FolderOpen className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          Projects
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {verificationData.projectsCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-1.5">
                        <List className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          Breakdowns
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {verificationData.totalBreakdownsCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Target Card */}
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/30">
                      <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                        Will be Created
                      </span>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">
                        20% Development Fund
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Fiscal Year: {verificationData.targetYear}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Exact copy of source data
                    </p>
                  </div>

                  {/* Target Stats */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800/50">
                      <div className="flex items-center gap-1.5">
                        <Coins className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          Total Allocated
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(verificationData.targetTotals.totalAllocated)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800/50">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          Total Utilized
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(verificationData.targetTotals.totalUtilized)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800/50">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          Total Obligated
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(verificationData.targetTotals.totalObligated)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800/50">
                      <div className="flex items-center gap-1.5">
                        <FolderOpen className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          Items to Create
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {verificationData.projectsCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-1.5">
                        <List className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          Total Breakdowns
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {verificationData.totalBreakdownsCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Indicator */}
              <div
                className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
                  totalsMatch
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50"
                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50"
                }`}
              >
                {totalsMatch ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Totals Match
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Source and target totals are identical. You can proceed with confidence.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Totals Discrepancy Detected
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Source and target totals do not match. Please review the data before proceeding.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Info Banner */}
              <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 px-4 py-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Next Step:</strong> Click &quot;Proceed to Summary&quot; to review the
                  detailed breakdown of projects and breakdowns before final confirmation.
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          )}
        </ResizableModalBody>

        <ResizableModalFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading || !verificationData}
            className="bg-[#15803D] text-white hover:bg-[#15803D]/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Proceed to Summary
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </ResizableModalFooter>
      </ResizableModalContent>
    </ResizableModal>
  );
}
