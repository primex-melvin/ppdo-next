"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type MigrationStep = "input" | "summary" | "result";

export type MigrationError = {
  projectId?: string;
  projectName?: string;
  error: string;
};

export type CreatedItem = {
  id: string;
  particulars: string;
  implementingOffice: string;
};

export type MigrationResult = {
  success: boolean;
  targetYear: number;
  migratedProjects: number;
  migratedBreakdowns: number;
  createdTwentyPercentDFItems: CreatedItem[];
  errors: MigrationError[];
};

export type BreakdownByProject = {
  projectId: string;
  projectName: string;
  breakdownsCount: number;
  totalAllocatedBudget: number;
};

export type PreviewData = {
  sourceBudgetItem: { particulars: string; _id: string };
  targetYear: number;
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
  const [targetYear, setTargetYear] = useState<number | null>(null);

  // Loading and result states
  const [isLoading, setIsLoading] = useState(false);
  const [resultData, setResultData] = useState<MigrationResult | null>(null);

  // Fetch fiscal years for dropdown
  const fiscalYears = useQuery(api.fiscalYears.list, {}) ?? [];

  // Convex query for preview data
  const rawPreviewData = useQuery(
    api.migrations.getMigrationPreview,
    step === "summary" && sourceId && targetYear
      ? {
          sourceBudgetItemId: sourceId as Id<"budgetItems">,
          targetYear: targetYear,
        }
      : "skip"
  );

  // Transform preview data
  const previewData: PreviewData | null = rawPreviewData
    ? {
        sourceBudgetItem: {
          _id: rawPreviewData.sourceBudgetItem?._id ?? "",
          particulars: rawPreviewData.sourceBudgetItem?.particulars ?? "",
        },
        targetYear: rawPreviewData.targetYear ?? targetYear ?? 0,
        projectsCount: rawPreviewData.projectsCount ?? 0,
        totalBreakdownsCount: rawPreviewData.totalBreakdownsCount ?? 0,
        breakdownsByProject:
          rawPreviewData.projectsWithBreakdowns?.map((pwb: any) => ({
            projectId: pwb.projectId,
            projectName: pwb.projectName,
            breakdownsCount: pwb.breakdownCount,
            totalAllocatedBudget: pwb.breakdowns.reduce(
              (sum: number, b: any) => sum + (b.allocatedBudget ?? 0),
              0
            ),
          })) ?? [],
      }
    : null;

  // Convex mutation for migration
  const migrateMutation = useMutation(api.migrations.migrateBudgetToTwentyPercentDF);

  // Handler: Submit from input step
  const handleInputSubmit = (newSourceId: string, newTargetYear: number) => {
    setSourceId(newSourceId);
    setTargetYear(newTargetYear);
    setStep("summary");
  };

  // Handler: Confirm migration
  const handleConfirm = async () => {
    if (!targetYear) return;
    
    setStep("result");
    setIsLoading(true);

    try {
      const result = await migrateMutation({
        sourceBudgetItemId: sourceId as Id<"budgetItems">,
        targetYear: targetYear,
      });

      // Transform result
      const transformedResult: MigrationResult = {
        success: result.success,
        targetYear: result.targetYear,
        migratedProjects: result.migratedProjects,
        migratedBreakdowns: result.migratedBreakdowns,
        createdTwentyPercentDFItems: result.createdTwentyPercentDFItems?.map((item: any) => ({
          id: item.id,
          particulars: item.particulars,
          implementingOffice: item.implementingOffice,
        })) ?? [],
        errors:
          result.errors?.map((e: any) => ({
            projectId: e.projectId,
            projectName: e.projectName,
            error: e.error,
          })) ?? [],
      };

      setResultData(transformedResult);

      if (result.success && result.errors.length === 0) {
        toast.success(`Migration completed! ${result.createdTwentyPercentDFItems.length} items created with ${result.migratedBreakdowns} breakdowns.`);
      } else if (result.success) {
        toast.warning(`Migration completed with ${result.errors.length} errors.`);
      } else {
        toast.error(`Migration failed.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Migration failed: ${errorMessage}`);
      setResultData({
        success: false,
        targetYear: targetYear ?? 0,
        migratedProjects: 0,
        migratedBreakdowns: 0,
        createdTwentyPercentDFItems: [],
        errors: [{ error: String(error) }],
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
    setTargetYear(null);
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
    targetYear,
    fiscalYears,
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
