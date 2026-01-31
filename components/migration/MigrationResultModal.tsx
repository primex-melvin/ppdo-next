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
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  FolderOpen,
  List,
  AlertTriangle,
} from "lucide-react";

export interface MigrationError {
  projectId: string;
  error: string;
}

export interface MigrationResult {
  success: boolean;
  migratedProjects: number;
  migratedBreakdowns: number;
  errors?: MigrationError[];
}

export interface MigrationResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
  result: MigrationResult | null;
  isLoading?: boolean;
  progress?: { current: number; total: number };
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
        <ResizableModalContent width={400} preventOutsideClick>
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
                Please wait while we transfer your data
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
                  className="h-2 [&>div]:bg-[#15803D]"
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

  // Success State
  if (result?.success) {
    return (
      <ResizableModal open={open} onOpenChange={handleClose}>
        <ResizableModalContent width={420}>
          <ResizableModalBody className="px-6 py-8 flex flex-col items-center text-center space-y-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Migration Complete!
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Your data has been successfully migrated
              </p>
            </div>

            {/* Success Stats */}
            <div className="w-full grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FolderOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {result.migratedProjects}
                  </span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Projects Migrated
                </p>
              </div>
              <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <List className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {result.migratedBreakdowns}
                  </span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Breakdowns Migrated
                </p>
              </div>
            </div>
          </ResizableModalBody>

          <ResizableModalFooter className="justify-center">
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

  // Error State
  const hasErrors = result?.errors && result.errors.length > 0;

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

          {/* Partial Success Stats */}
          {result && (result.migratedProjects > 0 || result.migratedBreakdowns > 0) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3 text-center">
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {result.migratedProjects}
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Projects Migrated
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3 text-center">
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {result.migratedBreakdowns}
                </span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Breakdowns Migrated
                </p>
              </div>
            </div>
          )}

          {/* Error Details */}
          {hasErrors && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Error Details
              </h4>
              <div className="rounded-lg border border-red-200 dark:border-red-800/50 overflow-hidden">
                <div className="max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-red-200 dark:scrollbar-thumb-red-900">
                  <div className="divide-y divide-red-100 dark:divide-red-900/30">
                    {result.errors?.map((error, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 bg-red-50/50 dark:bg-red-900/10"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-xs font-mono text-red-600 dark:text-red-400 truncate">
                              {error.projectId}
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300">
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
