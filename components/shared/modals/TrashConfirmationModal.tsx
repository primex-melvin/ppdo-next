// components/modals/TrashConfirmationModal.tsx

"use client";

import { useState } from "react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Trash2,
  Building2,
  Folder,
  FileText,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface TrashPreviewData {
  targetItem: {
    id: string;
    name: string;
    type: "budgetItem" | "project" | "breakdown";
  };
  cascadeCounts: {
    projects: number;
    breakdowns: number;
    inspections: number;
    totalFinancialImpact: {
      allocated: number;
      utilized: number;
      obligated: number;
    };
  };
  affectedItems: {
    projects: Array<{
      id: string;
      name: string;
      type: "project";
      financials: { allocated: number; utilized: number; obligated?: number };
    }>;
    breakdowns: Array<{
      id: string;
      name: string;
      type: "breakdown";
      parentId: string;
      financials: { allocated?: number; utilized?: number };
    }>;
  };
  warnings: string[];
  canDelete: boolean;
}

interface TrashConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  previewData: TrashPreviewData | null | undefined;
  isLoading: boolean;
}

const formatCurrency = (amount: number) => {
  return `₱${amount.toLocaleString("en-PH")}`;
};

const formatShortId = (id: string) => {
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
};

const getItemTypeIcon = (type: string) => {
  switch (type) {
    case "budgetItem":
      return <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    case "project":
      return <Folder className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
    case "breakdown":
      return <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
    default:
      return <FileText className="h-5 w-5 text-stone-600 dark:text-stone-400" />;
  }
};

const getItemTypeLabel = (type: string) => {
  switch (type) {
    case "budgetItem":
      return "Budget Item";
    case "project":
      return "Project";
    case "breakdown":
      return "Breakdown";
    default:
      return "Item";
  }
};

export function TrashConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  previewData,
  isLoading,
}: TrashConfirmationModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
    setReason("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      onCancel();
      setReason("");
    }
  };

  const handleCancel = () => {
    onCancel();
    setReason("");
  };

  return (
    <ResizableModal open={open} onOpenChange={handleOpenChange}>
      <ResizableModalContent
        width={600}
        maxWidth="95vw"
        maxHeight="90vh"
        className="bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800"
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-stone-500 dark:text-stone-400" />
            <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
              Calculating affected items...
            </p>
          </div>
        )}

        <ResizableModalHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <ResizableModalTitle className="text-stone-900 dark:text-stone-100">
                Move to Trash
              </ResizableModalTitle>
              <ResizableModalDescription>
                Review affected items before confirming
              </ResizableModalDescription>
            </div>
          </div>
        </ResizableModalHeader>

        <ResizableModalBody className="px-6 py-4 space-y-5">
          {/* Error State */}
          {!previewData && !isLoading && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-700 dark:text-red-300">
                Unable to load trash preview data. Please try again.
              </AlertDescription>
            </Alert>
          )}

          {previewData && (
            <>
              {/* Target Item Card */}
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-800/50">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white shadow-sm dark:bg-stone-800">
                    {getItemTypeIcon(previewData.targetItem.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-stone-900 dark:text-stone-100">
                      {previewData.targetItem.name}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                      ID: {formatShortId(previewData.targetItem.id)}
                    </p>
                    <span className="mt-1 inline-block rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-700 dark:text-stone-300">
                      {getItemTypeLabel(previewData.targetItem.type)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cascade Impact Summary */}
              <div className="rounded-lg border border-stone-200 dark:border-stone-700 overflow-hidden">
                <div className="bg-stone-100 px-4 py-2 dark:bg-stone-800">
                  <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                    📊 Affected Items
                  </h4>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                        {previewData.cascadeCounts.projects}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Projects
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                        {previewData.cascadeCounts.breakdowns}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Breakdowns
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {previewData.cascadeCounts.inspections}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Inspections
                      </p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400">
                        (not deleted)
                      </p>
                    </div>
                  </div>

                  <div className="my-4 border-t border-stone-200 dark:border-stone-700" />

                  <h5 className="mb-3 text-sm font-semibold text-stone-800 dark:text-stone-200">
                    💰 Financial Impact
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-stone-600 dark:text-stone-400">
                        Allocated:
                      </span>
                      <span className="font-mono text-sm font-medium text-stone-900 dark:text-stone-100">
                        {formatCurrency(
                          previewData.cascadeCounts.totalFinancialImpact.allocated
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-stone-600 dark:text-stone-400">
                        Utilized:
                      </span>
                      <span className="font-mono text-sm font-medium text-stone-900 dark:text-stone-100">
                        {formatCurrency(
                          previewData.cascadeCounts.totalFinancialImpact.utilized
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-stone-600 dark:text-stone-400">
                        Obligated:
                      </span>
                      <span className="font-mono text-sm font-medium text-stone-900 dark:text-stone-100">
                        {formatCurrency(
                          previewData.cascadeCounts.totalFinancialImpact.obligated
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Affected Items Accordion */}
              {(previewData.affectedItems.projects.length > 0 ||
                previewData.affectedItems.breakdowns.length > 0) && (
                <Accordion type="multiple" className="w-full">
                  {previewData.affectedItems.projects.length > 0 && (
                    <AccordionItem
                      value="projects"
                      className="border-stone-200 dark:border-stone-700"
                    >
                      <AccordionTrigger className="text-sm font-medium text-stone-800 hover:text-stone-900 dark:text-stone-200 dark:hover:text-stone-100">
                        View Affected Projects (
                        {previewData.affectedItems.projects.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {previewData.affectedItems.projects.map((project) => (
                            <div
                              key={project.id}
                              className="rounded-md border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-800/50"
                            >
                              <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="flex-1 truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                                  {project.name}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 font-mono">
                                ID: {formatShortId(project.id)}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <span className="font-mono text-stone-600 dark:text-stone-400">
                                  Alloc: {formatCurrency(project.financials.allocated)}
                                </span>
                                <span className="text-stone-300 dark:text-stone-600">
                                  |
                                </span>
                                <span className="font-mono text-stone-600 dark:text-stone-400">
                                  Util: {formatCurrency(project.financials.utilized)}
                                </span>
                              </div>
                              {/* Nested Breakdowns for this project */}
                              {previewData.affectedItems.breakdowns.filter(
                                (b) => b.parentId === project.id
                              ).length > 0 && (
                                <div className="mt-2 space-y-1 border-t border-stone-200 pt-2 dark:border-stone-700">
                                  {previewData.affectedItems.breakdowns
                                    .filter((b) => b.parentId === project.id)
                                    .map((breakdown) => (
                                      <div
                                        key={breakdown.id}
                                        className="flex items-center gap-2 pl-4 text-xs"
                                      >
                                        <FileText className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                        <span className="truncate text-stone-700 dark:text-stone-300">
                                          {breakdown.name}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {previewData.affectedItems.breakdowns.length > 0 && (
                    <AccordionItem
                      value="breakdowns"
                      className="border-stone-200 dark:border-stone-700"
                    >
                      <AccordionTrigger className="text-sm font-medium text-stone-800 hover:text-stone-900 dark:text-stone-200 dark:hover:text-stone-100">
                        View All Breakdowns (
                        {previewData.affectedItems.breakdowns.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-1">
                          {previewData.affectedItems.breakdowns.map((breakdown) => (
                            <div
                              key={breakdown.id}
                              className="flex items-center justify-between rounded-md border border-stone-200 p-2 dark:border-stone-700"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                <span className="truncate text-sm text-stone-800 dark:text-stone-200">
                                  {breakdown.name}
                                </span>
                              </div>
                              {breakdown.financials.allocated !== undefined && (
                                <span className="shrink-0 text-xs font-mono text-stone-600 dark:text-stone-400">
                                  {formatCurrency(breakdown.financials.allocated)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              )}

              {/* Warnings Section */}
              {previewData.warnings.length > 0 && (
                <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {previewData.warnings.map((warning, index) => (
                        <li key={index} className="text-sm">
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Reason Input */}
              <div className="space-y-2">
                <label
                  htmlFor="trash-reason"
                  className="text-sm font-medium text-stone-700 dark:text-stone-300"
                >
                  Reason for deletion (optional)
                </label>
                <Textarea
                  id="trash-reason"
                  placeholder="Enter reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="resize-none border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                />
              </div>
            </>
          )}
        </ResizableModalBody>

        <ResizableModalFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="border-stone-300 bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 dark:hover:text-stone-100"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !previewData?.canDelete}
            className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Move to Trash
              </>
            )}
          </Button>
        </ResizableModalFooter>
      </ResizableModalContent>
    </ResizableModal>
  );
}
