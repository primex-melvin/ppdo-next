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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  List,
  AlertTriangle,
  Calendar,
  Package,
  FileText,
  Building2,
  Hash,
} from "lucide-react";

export interface CreatedItem {
  id: string;
  particulars: string;
  implementingOffice: string;
}

export interface MigrationError {
  projectId?: string;
  projectName?: string;
  error: string;
}

export interface MigrationResult {
  success: boolean;
  targetYear: number;
  migratedProjects: number;
  migratedBreakdowns: number;
  createdTwentyPercentDFItems: CreatedItem[];
  errors: MigrationError[];
}

export interface MigrationResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  result: MigrationResult | null;
  isLoading?: boolean;
  progress?: { current: number; total: number };
}

// Helper function to truncate ID
function truncateId(id: string, length: number = 8): string {
  if (id.length <= length * 2 + 3) return id;
  return `${id.slice(0, length)}...${id.slice(-length)}`;
}

export function MigrationResultModal({
  open,
  onOpenChange,
  onRetry,
  result,
  isLoading = false,
  progress,
}: MigrationResultModalProps) {
  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  // Loading State
  if (isLoading) {
    const progressPercent = progress
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

    return (
      <ResizableModal open={open} onOpenChange={() => {}}>
        <ResizableModalContent width={450} preventOutsideClick>
          <ResizableModalBody className="px-6 py-10 flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 dark:bg-blue-900/30 opacity-75" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Migrating Data...
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Creating 20% DF items and migrating breakdowns...
              </p>
            </div>

            {progress && (
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Progress</span>
                  <span>
                    {progress.current} of {progress.total}
                  </span>
                </div>
                <Progress
                  value={progressPercent}
                  className="h-2 [&>div]:bg-blue-600"
                />
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {progressPercent}% complete
                </p>
              </div>
            )}
          </ResizableModalBody>
        </ResizableModalContent>
      </ResizableModal>
    );
  }

  const hasErrors = result?.errors && result.errors.length > 0;
  const hasCreatedItems =
    result?.createdTwentyPercentDFItems &&
    result.createdTwentyPercentDFItems.length > 0;
  const isPartialSuccess = result?.success && hasErrors;

  // Success State (including partial success)
  if (result?.success) {
    return (
      <ResizableModal open={open} onOpenChange={handleClose}>
        <ResizableModalContent width={520} maxHeight="85vh">
          <ResizableModalBody className="px-6 py-8 flex flex-col items-center text-center space-y-5">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full ${
                isPartialSuccess
                  ? "bg-amber-100 dark:bg-amber-900/30"
                  : "bg-green-100 dark:bg-green-900/30"
              }`}
            >
              {isPartialSuccess ? (
                <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              )}
            </div>

            <div className="space-y-1">
              <h3
                className={`text-xl font-semibold ${
                  isPartialSuccess
                    ? "text-amber-900 dark:text-amber-100"
                    : "text-zinc-900 dark:text-zinc-100"
                }`}
              >
                {isPartialSuccess
                  ? "Migration Completed with Errors"
                  : "Migration Complete!"}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {isPartialSuccess
                  ? "Some items were migrated successfully, but errors occurred"
                  : "Your data has been successfully migrated"}
              </p>
            </div>

            {/* Summary Stats */}
            <div className="w-full space-y-3">
              {/* Fiscal Year Badge */}
              <div className="flex justify-center">
                <Badge
                  variant="outline"
                  className="text-sm px-3 py-1 border-zinc-300 dark:border-zinc-700"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  Fiscal Year: {result.targetYear}
                </Badge>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`rounded-lg border p-4 text-center ${
                    isPartialSuccess
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50"
                      : "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Package
                      className={`h-4 w-4 ${
                        isPartialSuccess
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    />
                    <span
                      className={`text-2xl font-bold ${
                        isPartialSuccess
                          ? "text-amber-700 dark:text-amber-300"
                          : "text-green-700 dark:text-green-300"
                      }`}
                    >
                      {result.createdTwentyPercentDFItems.length}
                    </span>
                  </div>
                  <p
                    className={`text-xs ${
                      isPartialSuccess
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    Created Items
                  </p>
                </div>
                <div
                  className={`rounded-lg border p-4 text-center ${
                    isPartialSuccess
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50"
                      : "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <List
                      className={`h-4 w-4 ${
                        isPartialSuccess
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    />
                    <span
                      className={`text-2xl font-bold ${
                        isPartialSuccess
                          ? "text-amber-700 dark:text-amber-300"
                          : "text-green-700 dark:text-green-300"
                      }`}
                    >
                      {result.migratedBreakdowns}
                    </span>
                  </div>
                  <p
                    className={`text-xs ${
                      isPartialSuccess
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    Migrated Breakdowns
                  </p>
                </div>
              </div>
            </div>

            {/* Created Items Accordion */}
            {hasCreatedItems && (
              <div className="w-full">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem
                    value="items"
                    className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-zinc-500" />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Created Items ({result.createdTwentyPercentDFItems.length})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {result.createdTwentyPercentDFItems.map((item) => (
                            <div
                              key={item.id}
                              className="px-4 py-3 text-left bg-zinc-50/50 dark:bg-zinc-900/30"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-start gap-2">
                                  <FileText className="h-3.5 w-3.5 text-zinc-400 mt-0.5 shrink-0" />
                                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                    {item.particulars}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                                  <Building2 className="h-3 w-3" />
                                  <span>{item.implementingOffice}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                                  <Hash className="h-3 w-3" />
                                  <span className="font-mono">
                                    {truncateId(item.id)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            {/* Errors Section for Partial Success */}
            {isPartialSuccess && hasErrors && (
              <div className="w-full space-y-2">
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">
                      {result.errors.length} error
                      {result.errors.length > 1 ? "s" : ""} occurred
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-red-200 dark:border-red-800/50 overflow-hidden">
                  <div className="max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-red-200 dark:scrollbar-thumb-red-900">
                    <div className="divide-y divide-red-100 dark:divide-red-900/30">
                      {result.errors.map((error, index) => (
                        <div
                          key={index}
                          className="px-4 py-3 bg-red-50/50 dark:bg-red-900/10 text-left"
                        >
                          <div className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5 min-w-0">
                              {error.projectName && (
                                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                  {error.projectName}
                                </p>
                              )}
                              {error.projectId && !error.projectName && (
                                <p className="text-xs font-mono text-red-600 dark:text-red-400 truncate">
                                  {error.projectId}
                                </p>
                              )}
                              <p className="text-sm text-red-600 dark:text-red-400">
                                {error.error}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ResizableModalBody>

          <ResizableModalFooter className="justify-center gap-2">
            {isPartialSuccess && (
              <Button
                onClick={onRetry}
                variant="outline"
                className="border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Migration
              </Button>
            )}
            <Button
              onClick={handleClose}
              className="bg-[#15803D] text-white hover:bg-[#15803D]/90 min-w-[120px]"
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </ResizableModalFooter>
        </ResizableModalContent>
      </ResizableModal>
    );
  }

  // Error State (complete failure)
  return (
    <ResizableModal open={open} onOpenChange={handleClose}>
      <ResizableModalContent width={520} maxHeight="85vh">
        <ResizableModalHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <ResizableModalTitle>Migration Failed</ResizableModalTitle>
              <ResizableModalDescription>
                Some errors occurred during the migration process
              </ResizableModalDescription>
            </div>
          </div>
        </ResizableModalHeader>

        <ResizableModalBody className="px-6 py-5 space-y-4">
          {/* Error Summary */}
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Migration encountered errors
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {hasErrors
                    ? `${result?.errors?.length} project(s) failed to migrate.`
                    : "An unexpected error occurred during migration."}
                </p>
              </div>
            </div>
          </div>

          {/* Target Year */}
          {result?.targetYear && (
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <Calendar className="h-4 w-4" />
              <span>Target Fiscal Year: {result.targetYear}</span>
            </div>
          )}

          {/* Error Details */}
          {hasErrors && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Error Details ({result?.errors?.length})
              </h4>
              <div className="rounded-lg border border-red-200 dark:border-red-800/50 overflow-hidden">
                <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-red-200 dark:scrollbar-thumb-red-900">
                  <div className="divide-y divide-red-100 dark:divide-red-900/30">
                    {result?.errors?.map((error, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 bg-red-50/50 dark:bg-red-900/10"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5 min-w-0">
                            {error.projectName && (
                              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                {error.projectName}
                              </p>
                            )}
                            {error.projectId && !error.projectName && (
                              <p className="text-xs font-mono text-red-600 dark:text-red-400 truncate">
                                {error.projectId}
                              </p>
                            )}
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {error.error}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </ResizableModalBody>

        <ResizableModalFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
            Close
          </Button>
          <Button
            onClick={onRetry}
            variant="outline"
            className="border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <RefreshCw className="h-4 w-4" />
            Retry Migration
          </Button>
        </ResizableModalFooter>
      </ResizableModalContent>
    </ResizableModal>
  );
}
