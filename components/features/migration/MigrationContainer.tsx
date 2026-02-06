"use client";

import { useMigration } from "@/hooks/useMigration";
import { MigrationButton } from "./MigrationButton";
import { MigrationInputModal } from "./MigrationInputModal";
import { MigrationVerificationModal } from "./MigrationVerificationModal";
import { MigrationSummaryModal } from "./MigrationSummaryModal";
import { MigrationResultModal } from "./MigrationResultModal";

export function MigrationContainer() {
  const migration = useMigration();

  return (
    <>
      <MigrationButton onClick={() => migration.setIsOpen(true)} />

      {/* Step 1: Input */}
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

      {/* Step 2: Verification (NEW) */}
      <MigrationVerificationModal
        open={migration.step === "verification"}
        onOpenChange={() => migration.setStep("input")}
        onConfirm={migration.handleVerificationConfirm}
        onCancel={() => migration.setStep("input")}
        verificationData={migration.verificationData}
        isLoading={migration.verificationData === undefined && migration.step === "verification"}
      />

      {/* Step 3: Summary */}
      <MigrationSummaryModal
        open={migration.step === "summary"}
        onOpenChange={() => migration.setStep("verification")}
        onConfirm={migration.handleConfirm}
        onCancel={() => migration.setStep("verification")}
        previewData={migration.previewData}
        isLoading={migration.previewData === undefined && migration.step === "summary"}
      />

      {/* Step 4: Result */}
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
