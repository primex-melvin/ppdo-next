"use client";

import { useMigration } from "@/hooks/useMigration";
import { MigrationButton } from "./MigrationButton";
import { MigrationInputModal } from "./MigrationInputModal";
import { MigrationSummaryModal } from "./MigrationSummaryModal";
import { MigrationResultModal } from "./MigrationResultModal";

export function MigrationContainer() {
  const migration = useMigration();

  return (
    <>
      <MigrationButton onClick={() => migration.setIsOpen(true)} />

      <MigrationInputModal
        open={migration.isOpen && migration.step === "input"}
        onOpenChange={(open) => !open && migration.handleClose()}
        onSubmit={migration.handleInputSubmit}
        fiscalYears={migration.fiscalYears.map((fy: any) => ({
          year: fy.year ?? fy.fiscalYear ?? 0,
          label: fy.label ?? fy.name ?? `Year ${fy.year ?? fy.fiscalYear}`,
        }))}
        isLoading={migration.fiscalYears === undefined}
      />

      <MigrationSummaryModal
        open={migration.step === "summary"}
        onOpenChange={() => migration.setStep("input")}
        onConfirm={migration.handleConfirm}
        onCancel={() => migration.setStep("input")}
        previewData={migration.previewData}
        isLoading={migration.previewData === undefined && migration.step === "summary"}
      />

      <MigrationResultModal
        open={migration.step === "result"}
        onOpenChange={() => migration.handleClose()}
        onRetry={migration.handleRetry}
        result={migration.resultData}
        isLoading={migration.isLoading}
      />
    </>
  );
}
