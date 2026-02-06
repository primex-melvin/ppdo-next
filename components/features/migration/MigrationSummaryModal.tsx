"use client";

import React, { useMemo } from "react";
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
  AlertTriangle,
  FolderOpen,
  List,
  Building2,
  Calendar,
  TrendingUp,
  FilePlus,
} from "lucide-react";
import { formatNumberForDisplay } from "@/lib/shared/utils/formatting";

export interface BreakdownByProject {
  projectId: string;
  projectName: string;
  breakdownsCount: number;
  totalAllocatedBudget: number;
}

export interface MigrationSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  previewData: {
    sourceBudgetItem: { particulars: string; _id: string };
    targetYear: number;
    projectsCount: number;
    totalBreakdownsCount: number;
    breakdownsByProject: BreakdownByProject[];
  } | null;
  isLoading?: boolean;
}

export function MigrationSummaryModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  previewData,
  isLoading = false,
}: MigrationSummaryModalProps) {
  const totalBudget = useMemo(() => {
    if (!previewData?.breakdownsByProject) return 0;
    return previewData.breakdownsByProject.reduce(
      (sum, item) => sum + item.totalAllocatedBudget,
      0
    );
  }, [previewData]);

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
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <ResizableModalTitle>Migration Preview</ResizableModalTitle>
              <ResizableModalDescription>
                Review the data to be migrated before confirming
              </ResizableModalDescription>
            </div>
          </div>
        </ResizableModalHeader>

        <ResizableModalBody className="px-6 py-5 space-y-5">
          {previewData ? (
            <>
              {/* Source & Target Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Source Card */}
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      Source
                    </span>
                  </div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                    {previewData.sourceBudgetItem.particulars}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
                    {previewData.sourceBudgetItem._id}
                  </p>
                </div>

                {/* Target Card */}
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      Target Information
                    </span>
                  </div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Fiscal Year: {previewData.targetYear}
                  </p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
                    Items to Create: {previewData.projectsCount}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    New 20% DF items will be created for each project
                  </p>
                </div>
              </div>

              {/* Statistics Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <FolderOpen className="h-4 w-4 text-[#15803D]" />
                    <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {previewData.projectsCount}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Projects</p>
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <List className="h-4 w-4 text-[#15803D]" />
                    <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {previewData.totalBreakdownsCount}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Breakdowns</p>
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <TrendingUp className="h-4 w-4 text-[#15803D]" />
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      ₱{formatNumberForDisplay(totalBudget)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Total Budget</p>
                </div>
              </div>

              {/* Projects Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Projects to Migrate
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <FilePlus className="h-3.5 w-3.5" />
                    <span>Each project will become a 20% DF item</span>
                  </div>
                </div>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-50 dark:bg-zinc-900 sticky top-0">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                            Project Name
                          </th>
                          <th className="text-center px-4 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 w-24">
                            Breakdowns
                          </th>
                          <th className="text-right px-4 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 w-28">
                            Total Budget
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {previewData.breakdownsByProject.map((project) => (
                          <tr
                            key={project.projectId}
                            className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                          >
                            <td className="px-4 py-2.5 text-zinc-900 dark:text-zinc-100">
                              <div className="max-w-[200px] truncate" title={project.projectName}>
                                {project.projectName}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-center text-zinc-600 dark:text-zinc-400">
                              {project.breakdownsCount}
                            </td>
                            <td className="px-4 py-2.5 text-right text-zinc-600 dark:text-zinc-400 font-mono">
                              ₱{formatNumberForDisplay(project.totalAllocatedBudget)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Warning Message */}
              <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 px-4 py-3 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Warning: This action will modify data
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    This will create {previewData.projectsCount} new 20% Development Fund items for
                    fiscal year {previewData.targetYear} with {previewData.totalBreakdownsCount}{" "}
                    breakdowns. This action cannot be undone.
                  </p>
                </div>
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
            disabled={isLoading || !previewData}
            className="bg-[#15803D] text-white hover:bg-[#15803D]/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                Confirm & Migrate
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </ResizableModalFooter>
      </ResizableModalContent>
    </ResizableModal>
  );
}
