"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ResizableModal,
  ResizableModalBody,
  ResizableModalContent,
  ResizableModalDescription,
  ResizableModalFooter,
  ResizableModalHeader,
  ResizableModalTitle,
} from "@/components/ui/resizable-modal";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
  AlertTriangle,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

type BulkDeleteMode = "reassign_to_blank" | "delete_all";
type BulkDeleteStep = 1 | 2 | 3;

interface BulkDeleteAgenciesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agencyIds: Id<"implementingAgencies">[];
  onSuccess?: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function BudgetImpactWarning() {
  return (
    <Alert variant="destructive" className="border-red-200/70 dark:border-red-900/50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Budget impact warning</AlertTitle>
      <AlertDescription>
        Budget allocated, utilized, and obligated budgets will be affected if linked records are permanently deleted.
      </AlertDescription>
    </Alert>
  );
}

export function BulkDeleteAgenciesModal({
  open,
  onOpenChange,
  agencyIds,
  onSuccess,
}: BulkDeleteAgenciesModalProps) {
  const [step, setStep] = useState<BulkDeleteStep>(1);
  const [mode, setMode] = useState<BulkDeleteMode>("reassign_to_blank");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pinInputRef = useRef<any>(null);
  const hasAutoFocusedSinglePinRef = useRef(false);

  const preview = useQuery(
    (api as any).implementingAgencies.getBulkDeletePreview,
    open && agencyIds.length > 0 ? { ids: agencyIds } : ("skip" as any)
  ) as any;

  const bulkDeleteWithMode = useMutation(
    (api as any).implementingAgencies.bulkDeleteWithMode
  ) as any;

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setMode("reassign_to_blank");
    setPin("");
    setShowPin(false);
    setError(null);
    setIsSubmitting(false);
    hasAutoFocusedSinglePinRef.current = false;
  }, [open, agencyIds]);

  const totals = preview?.totals ?? {
    totalCount: 0,
    activeCount: 0,
    trashedCount: 0,
    budgetAllocated: 0,
    budgetUtilized: 0,
    budgetObligated: 0,
  };

  const summary = preview?.selectionSummary ?? {
    selectedCount: agencyIds.length,
    deletableCount: 0,
    blockedCount: 0,
  };
  const singleDeletableAgency =
    summary.deletableCount === 1 && preview?.byAgency?.length === 1
      ? preview.byAgency[0]?.agency
      : null;

  const isLoading = open && agencyIds.length > 0 && preview === undefined;
  const hasTrueImpact = Boolean(preview?.hasTrueImpact ?? false);
  const showThreeStepWizard = !isLoading && hasTrueImpact;
  const canSubmit = pin.length === 6 && summary.deletableCount > 0 && !isSubmitting;
  const canProceedToPreview = !isLoading;
  const canProceedToPin = !isLoading && summary.deletableCount > 0;
  const impactTotals = preview?.trueImpactTotals ?? {
    activeCount: totals.activeCount,
    budgetAllocated: totals.budgetAllocated,
    budgetUtilized: totals.budgetUtilized,
    budgetObligated: totals.budgetObligated,
  };
  const displayByTable = (preview?.trueImpactByTable ?? preview?.byTable ?? []) as any[];
  const displayByAgency = (preview?.trueImpactByAgency ?? preview?.byAgency ?? []) as any[];

  const flattenedPreviewItems = useMemo(() => {
    if (!preview?.byAgency) return [];
    return preview.byAgency
      .flatMap((agencyGroup: any) =>
        (agencyGroup.previewItems || []).slice(0, 12).map((item: any) => ({
          ...item,
          agencyName: agencyGroup.agency?.name,
        }))
      )
      .slice(0, 120);
  }, [preview]);

  const steps: Array<{ id: BulkDeleteStep; title: string }> = [
    { id: 1, title: "Handle linked records" },
    { id: 2, title: "Review affected items" },
    { id: 3, title: "Confirm with PIN" },
  ];
  const deletableAgencyLabel = summary.deletableCount === 1 ? "agency" : "agencies";
  const deleteVerbLabel = summary.deletableCount === 1 ? "Delete Agency" : "Delete Agencies";
  const agenciesToDeleteLabel = summary.deletableCount === 1 ? "Agency to Delete" : "Agencies to Delete";

  useEffect(() => {
    if (!open || isLoading) return;
    if (!hasTrueImpact) {
      setStep(3);
    }
  }, [open, isLoading, hasTrueImpact]);

  useEffect(() => {
    if (
      !open ||
      isLoading ||
      !singleDeletableAgency ||
      showThreeStepWizard ||
      step !== 3 ||
      hasAutoFocusedSinglePinRef.current
    ) {
      return;
    }

    const timer = setTimeout(() => {
      pinInputRef.current?.focus?.();
      hasAutoFocusedSinglePinRef.current = true;
    }, 0);

    return () => clearTimeout(timer);
  }, [open, isLoading, singleDeletableAgency, showThreeStepWizard, step]);

  const handleConfirm = async () => {
    if (pin.length !== 6) {
      setError("Please enter your 6-digit PIN.");
      return;
    }

    if (summary.deletableCount === 0) {
      setError("No deletable agencies in the current selection.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await bulkDeleteWithMode({
        ids: agencyIds,
        pin,
        mode,
      });

      const deletedCount = Number(result?.deletedAgencyCount ?? 0);
      const activeAffectedCount = Number(result?.affectedTotals?.activeCount ?? 0);

      if (activeAffectedCount === 0) {
        toast.success(
          `${deletedCount} agenc${deletedCount === 1 ? "y" : "ies"} deleted successfully`
        );
      } else {
        const budgetNote =
          mode === "delete_all"
            ? " Linked budgets were permanently removed."
            : ` Linked records were reassigned to ${result?.fallbackAgency?.name || "Unassigned Agency"}.`;

        toast.success(
          `${deletedCount} agenc${deletedCount === 1 ? "y" : "ies"} deleted.${budgetNote}`
        );
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to complete bulk permanent delete";
      setError(message);
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <ResizableModal open={open} onOpenChange={onOpenChange}>
      <ResizableModalContent
        width={980}
        maxWidth="96vw"
        maxHeight="92vh"
        className="bg-background border-border"
      >
        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">
              Loading affected records preview...
            </p>
          </div>
        )}

        <ResizableModalHeader>
          <div className="flex items-start gap-3 pr-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <ResizableModalTitle className="text-red-600 dark:text-red-400">
                {singleDeletableAgency
                  ? `Delete Agency: ${singleDeletableAgency.name}`
                  : "Bulk Permanent Delete (Table Selection)"}
              </ResizableModalTitle>
              <ResizableModalDescription>
                {singleDeletableAgency ? (
                  <>
                    Permanently deletes <b>{singleDeletableAgency.name}</b> from this table.
                  </>
                ) : (
                  <>
                    Permanently deletes selected agencies from this table.
                  </>
                )}
              </ResizableModalDescription>
            </div>
          </div>

          {showThreeStepWizard && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {steps.map((item) => {
              const isCurrent = step === item.id;
              const isComplete = step > item.id;
              return (
                <div
                  key={item.id}
                  className={`rounded-md border px-3 py-2 ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : isComplete
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-border bg-muted/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isComplete
                            ? "bg-emerald-600 text-white"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.id}
                    </span>
                    <p className="text-xs font-medium text-foreground">{item.title}</p>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </ResizableModalHeader>

        <ResizableModalBody className="px-6 py-5 space-y-5">
          {showThreeStepWizard && step === 1 && (
            <>
              <BudgetImpactWarning />

              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {preview?.question || "How do you want to handle linked records for the selected agencies?"}
                    </p>
                  </div>
                  {preview?.fallbackAgency && (
                    <Badge variant="secondary" className="shrink-0">
                      {preview.fallbackAgency.exists ? "UNASSIGNED exists" : "UNASSIGNED will auto-create"}
                    </Badge>
                  )}
                </div>

                <RadioGroup
                  value={mode}
                  onValueChange={(value) => setMode(value as BulkDeleteMode)}
                  className="gap-3"
                >
                  <label
                    htmlFor="bulk-delete-mode-reassign"
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                      mode === "reassign_to_blank"
                        ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-900/20"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem
                      id="bulk-delete-mode-reassign"
                      value="reassign_to_blank"
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          Reassign linked records to Unassigned Agency (Recommended)
                        </span>
                        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">Safe</Badge>
                      </div>
                    </div>
                  </label>

                  <label
                    htmlFor="bulk-delete-mode-delete"
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                      mode === "delete_all"
                        ? "border-red-500 bg-red-50/70 dark:bg-red-900/20"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem
                      id="bulk-delete-mode-delete"
                      value="delete_all"
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          Permanently delete linked records
                        </span>
                        <Badge variant="destructive">Destructive</Badge>
                      </div>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </>
          )}

          {showThreeStepWizard && step === 2 && (
            <>
              <BudgetImpactWarning />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Agencies</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {summary.deletableCount} deletable / {summary.selectedCount} selected
                  </p>
                  {summary.blockedCount > 0 && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      {summary.blockedCount} blocked (not deletable)
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Affected Records</p>
                  <p className="mt-1 text-xl font-semibold text-foreground">{impactTotals.activeCount}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {totals.trashedCount > 0
                      ? `${totals.trashedCount} already in trash (also affected)`
                      : "Active records previewed"}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">Budget Impact (Active Records)</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    Allocated: {formatCurrency(impactTotals.budgetAllocated)}
                  </p>
                  <p className="text-sm text-foreground">
                    Utilized: {formatCurrency(impactTotals.budgetUtilized)}
                  </p>
                  <p className="text-sm text-foreground">
                    Obligated: {formatCurrency(impactTotals.budgetObligated)}
                  </p>
                </div>
              </div>

              {summary.blockedCount > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
                  <div className="mb-2 flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <Building2 className="h-4 w-4" />
                    <p className="text-sm font-medium">Blocked agencies (will be skipped)</p>
                  </div>
                  <div className="max-h-32 space-y-1 overflow-auto">
                    {(preview?.blockedAgencies || []).map((item: any) => (
                      <div
                        key={`${item.id}-${item.reason}`}
                        className="flex flex-wrap items-center gap-2 text-xs text-amber-900 dark:text-amber-200"
                      >
                        <Badge variant="outline" className="border-amber-300 dark:border-amber-700">
                          {item.code || "Unknown"}
                        </Badge>
                        <span>{item.name || item.id}</span>
                        <span className="text-amber-700/90 dark:text-amber-300/90">- {item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Accordion type="multiple" className="w-full space-y-2">
                <AccordionItem value="by-table" className="rounded-lg border px-3">
                  <AccordionTrigger className="py-3 text-sm hover:no-underline">
                    Affected Summary by Table
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="space-y-2">
                      {displayByTable.map((table: any) => (
                        <div key={table.key} className="rounded-md border border-border bg-muted/30 px-3 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-foreground">{table.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {table.activeCount} active / {table.totalCount} total
                              </p>
                            </div>
                            <div className="text-right text-xs">
                              <p>Allocated: {formatCurrency(table.budgetAllocated)}</p>
                              <p>Utilized: {formatCurrency(table.budgetUtilized)}</p>
                              <p>Obligated: {formatCurrency(table.budgetObligated)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {displayByTable.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No linked records found for the selected deletable agencies.
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="by-agency" className="rounded-lg border px-3">
                  <AccordionTrigger className="py-3 text-sm hover:no-underline">
                    Affected Summary by Agency
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pb-3">
                    {displayByAgency.map((agencyGroup: any) => (
                      <div key={agencyGroup.agency.id} className="rounded-md border border-border bg-card p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {agencyGroup.agency.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {agencyGroup.agency.code}
                            </p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <p>
                              {agencyGroup.totals.activeCount} active / {agencyGroup.totals.totalCount} total
                            </p>
                            <p>Allocated: {formatCurrency(agencyGroup.totals.budgetAllocated)}</p>
                          </div>
                        </div>

                        <div className="max-h-40 space-y-1 overflow-auto pr-1">
                          {(agencyGroup.previewItems || []).slice(0, 40).map((item: any) => (
                            <div
                              key={`${agencyGroup.agency.id}-${item.id}`}
                              className="flex items-center justify-between gap-3 rounded border border-border px-2 py-1.5 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-foreground">{item.name}</p>
                                <p className="truncate text-muted-foreground">{item.tableLabel}</p>
                              </div>
                              <div className="shrink-0 text-right text-muted-foreground">
                                <p>{formatCurrency(item.budgetAllocated)}</p>
                              </div>
                            </div>
                          ))}
                          {(agencyGroup.previewItems || []).length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              No active linked records to preview.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {displayByAgency.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No deletable agencies in the current selection.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="quick-list" className="rounded-lg border px-3">
                  <AccordionTrigger className="py-3 text-sm hover:no-underline">
                    Quick Preview List (sample)
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <div className="max-h-48 space-y-1 overflow-auto pr-1">
                      {flattenedPreviewItems.map((item: any, idx: number) => (
                        <div
                          key={`${item.id}-${idx}`}
                          className="flex items-center justify-between gap-2 rounded border border-border px-2 py-1.5 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-foreground">{item.name}</p>
                            <p className="truncate text-muted-foreground">
                              {item.agencyCode || item.agencyName} - {item.tableLabel}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {item.status || "n/a"}
                          </Badge>
                        </div>
                      ))}
                      {flattenedPreviewItems.length === 0 && (
                        <p className="text-xs text-muted-foreground">No preview items available.</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </>
          )}

          {step === 3 && (
            <>
              {showThreeStepWizard ? (
                <>
                  <Alert variant="destructive" className="border-red-200/70 dark:border-red-900/50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Final deletion confirmation</AlertTitle>
                    <AlertDescription>
                      {mode === "reassign_to_blank"
                        ? 'Agencies will be permanently deleted and linked records will be reassigned to "Unassigned Agency".'
                        : "Agencies and linked records will be permanently deleted. Allocated, utilized, and obligated budgets will be affected."}
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">Mode</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {mode === "reassign_to_blank" ? "Reassign to Unassigned Agency" : "Delete linked records"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">Agencies to Delete</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{summary.deletableCount}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">Affected Active Records</p>
                      <p className="mt-1 text-xl font-semibold text-foreground">{impactTotals.activeCount}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">{deleteVerbLabel}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    No active linked records were found for the selected deletable {deletableAgencyLabel}. Proceed with PIN confirmation.
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">{agenciesToDeleteLabel}</p>
                      <p className="text-xl font-semibold text-foreground">{summary.deletableCount}</p>
                    </div>
                    {!singleDeletableAgency && (
                      <div>
                        <p className="text-xs text-muted-foreground">Blocked (Skipped)</p>
                        <p className="text-xl font-semibold text-foreground">{summary.blockedCount}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Trash2 className="h-4 w-4 text-red-500" />
                  Confirm with 6-digit PIN
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your PIN to proceed with this permanent delete action.
                </p>
                <div className="flex justify-center">
                  <div className="flex items-center gap-2">
                    <InputOTP
                      ref={pinInputRef}
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS}
                      value={pin}
                      onChange={(value) => {
                        setPin(value);
                        setError(null);
                      }}
                      disabled={isSubmitting}
                      autoFocus={Boolean(singleDeletableAgency && !showThreeStepWizard && step === 3)}
                      containerClassName="justify-center"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} masked={!showPin} className="bg-background border-zinc-300 dark:border-zinc-700 text-foreground shadow-sm" />
                        <InputOTPSlot index={1} masked={!showPin} className="bg-background border-zinc-300 dark:border-zinc-700 text-foreground shadow-sm" />
                        <InputOTPSlot index={2} masked={!showPin} className="bg-background border-zinc-300 dark:border-zinc-700 text-foreground shadow-sm" />
                        <InputOTPSlot index={3} masked={!showPin} className="bg-background border-zinc-300 dark:border-zinc-700 text-foreground shadow-sm" />
                        <InputOTPSlot index={4} masked={!showPin} className="bg-background border-zinc-300 dark:border-zinc-700 text-foreground shadow-sm" />
                        <InputOTPSlot index={5} masked={!showPin} className="bg-background border-zinc-300 dark:border-zinc-700 text-foreground shadow-sm" />
                      </InputOTPGroup>
                    </InputOTP>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowPin((prev) => !prev)}
                      aria-label={showPin ? "Hide PIN" : "Show PIN"}
                      title={showPin ? "Hide PIN" : "Show PIN"}
                      className="h-10 w-10 shrink-0"
                    >
                      {showPin ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </div>
                {error && (
                  <p className="text-center text-xs font-medium text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
              </div>
            </>
          )}
        </ResizableModalBody>

        <ResizableModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          {showThreeStepWizard && step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((prev) => (Math.max(1, prev - 1) as BulkDeleteStep))}
              disabled={isSubmitting}
            >
              Back
            </Button>
          )}

          {showThreeStepWizard && step === 1 && (
            <Button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canProceedToPreview}
              className="min-w-[180px]"
            >
              Review Affected Items
            </Button>
          )}

          {showThreeStepWizard && step === 2 && (
            <Button
              type="button"
              onClick={() => setStep(3)}
              disabled={!canProceedToPin}
              className="min-w-[160px]"
            >
              Continue to PIN
            </Button>
          )}

          {step === 3 && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={!canSubmit}
              className="min-w-[220px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : !hasTrueImpact ? (
                deleteVerbLabel
              ) : mode === "delete_all" ? (
                `${deleteVerbLabel} + Linked Records`
              ) : (
                `${deleteVerbLabel} (Reassign to Unassigned Agency)`
              )}
            </Button>
          )}
        </ResizableModalFooter>
      </ResizableModalContent>
    </ResizableModal>
  );
}
