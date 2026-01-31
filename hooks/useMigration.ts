"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type MigrationStep = "input" | "summary" | "result";

export type MigrationError = {
  projectId: string;
  error: string;
};

export type MigrationResult = {
  success: boolean;
  migratedProjects: number;
  migratedBreakdowns: number;
  errors?: MigrationError[];
};

export type BreakdownByProject = {
  projectId: string;
  projectName: string;
  breakdownsCount: number;
  totalAllocatedBudget: number;
};

export type PreviewData = {
  sourceBudgetItem: { particulars: string; _id: string };
  targetTwentyPercentDF: { particulars: string; _id: string };
  projectsCount: number;
  totalBreakdownsCount: number;
  breakdownsByProject: BreakdownByProject[];
};

export function useMigration() {
  // Modal open state
  const [isOpen, setIsOpen] = useState(false);

  // Step management
  const [step, setStep] = useState<MigrationStep>("input");

  // ID states
  const [sourceId, setSourceId] = useState<string>("k57eavzkpm7yrjzsc3bp4302dx7z6ygj");
  const [targetId, setTargetId] = useState<string>("");

  // Loading and result states
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState<MigrationResult | null>(null);

  // Convex query for preview data
  const rawPreviewData = useQuery(
    api.migrations.getMigrationPreview,
    step === "summary" && sourceId && targetId
      ? {
          sourceBudgetItemId: sourceId as Id<"budgetItems">,
          targetTwentyPercentDFId: targetId as Id<"twentyPercentDF">,
        }
      : "skip"
  );

  // Transform preview data to match component types
  const previewData: PreviewData | null = rawPreviewData
    ? {
        sourceBudgetItem: {
          _id: rawPreviewData.sourceBudgetItem?._id ?? "",
          particulars: rawPreviewData.sourceBudgetItem?.particulars ?? "",
        },
        targetTwentyPercentDF: {
          _id: rawPreviewData.targetTwentyPercentDF?._id ?? "",
          particulars: rawPreviewData.targetTwentyPercentDF?.particulars ?? "",
        },
        projectsCount: rawPreviewData.projectsCount ?? 0,
        totalBreakdownsCount: rawPreviewData.totalBreakdownsCount ?? 0,
        breakdownsByProject:
          rawPreviewData.projectsWithBreakdowns?.map((pwb: { projectId: string; projectName: string; breakdownCount: number; breakdowns: Array<{ allocatedBudget?: number }> }) => ({
            projectId: pwb.projectId,
            projectName: pwb.projectName,
            breakdownsCount: pwb.breakdownCount,
            totalAllocatedBudget: pwb.breakdowns.reduce((sum: number, b: { allocatedBudget?: number }) => sum + (b.allocatedBudget ?? 0), 0),
          })) ?? [],
      }
    : null;

  // Convex mutation for migration
  const migrateMutation = useMutation(api.migrations.migrateBudgetToTwentyPercentDF);

  // Handler: Submit from input step
  const handleInputSubmit = (newSourceId: string, newTargetId: string) => {
    setSourceId(newSourceId);
    setTargetId(newTargetId);
    setStep("summary");
  };

  // Handler: Confirm migration
  const handleConfirm = async () => {
    setStep("result");
    setIsLoading(true);

    try {
      const result = await migrateMutation({
        sourceBudgetItemId: sourceId as Id<"budgetItems">,
        targetTwentyPercentDFId: targetId as Id<"twentyPercentDF">,
      });

      // Transform result to match component types
      const transformedResult: MigrationResult = {
        success: result.success,
        migratedProjects: result.migratedProjects,
        migratedBreakdowns: result.migratedBreakdowns,
        errors:
          result.errors?.map((e) => ({
            projectId: e.projectId ?? "",
            error: e.error,
          })) ?? [],
      };

      setResultData(transformedResult);

      if (result.success) {
        toast.success(`Migration completed! ${result.migratedBreakdowns} breakdowns migrated.`);
      } else {
        toast.warning(`Migration completed with ${result.errors?.length ?? 0} errors.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Migration failed: ${errorMessage}`);
      setResultData({
        success: false,
        migratedProjects: 0,
        migratedBreakdowns: 0,
        errors: [{ projectId: "", error: String(error) }],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Retry migration
  const handleRetry = () => {
    setStep("input");
    setResultData(null);
  };

  // Handler: Close and reset
  const handleClose = () => {
    setStep("input");
    setSourceId("k57eavzkpm7yrjzsc3bp4302dx7z6ygj");
    setTargetId("");
    setResultData(null);
    setIsOpen(false);
  };

  return {
    // State
    isOpen,
    setIsOpen,
    step,
    setStep,
    sourceId,
    targetId,
    previewData,
    resultData,
    isLoading,

    // Handlers
    handleInputSubmit,
    handleConfirm,
    handleRetry,
    handleClose,
  };
}
