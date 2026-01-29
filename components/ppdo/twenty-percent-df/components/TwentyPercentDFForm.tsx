"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Form } from "@/components/ui/form";
import { TwentyPercentDF, TwentyPercentDFFormData } from "../types";
import { BudgetViolationModal } from "./BudgetViolationModal";

// Subcomponents
import {
    ParticularField,
    CategoryField,
    ImplementingOfficeField,
    YearField,
    AllocatedBudgetField,
    AutoCalculateSwitch,
    ManualInputSection,
    RemarksField,
    UtilizationDisplay,
    FormActions,
} from "./form";

// Utils
import {
    twentyPercentDFSchema,
    TwentyPercentDFFormValues,
    formatNumberForDisplay,
    calculateBudgetAvailability,
} from "./form";
import { useFormDraft } from "@/lib/shared/hooks/useFormDraft";

interface TwentyPercentDFFormProps {
    project?: TwentyPercentDF | null;
    budgetItemId?: string;
    budgetItemYear?: number;
    onSave: (data: TwentyPercentDFFormData) => void | Promise<void>;
    onCancel: () => void;
}

export function TwentyPercentDFForm({
    project,
    budgetItemId,
    budgetItemYear,
    onSave,
    onCancel
}: TwentyPercentDFFormProps) {
    const searchParams = useSearchParams();

    // Get year from URL query params
    const urlYear = (() => {
        const yearParam = searchParams.get("year");
        return yearParam ? parseInt(yearParam) : undefined;
    })();

    const shouldFetchParent = budgetItemId !== undefined && budgetItemId !== null && budgetItemId !== "";

    const parentBudgetItem = useQuery(
        api.budgetItems.get,
        shouldFetchParent ? { id: budgetItemId as Id<"budgetItems"> } : "skip"
    );

    const siblingProjectsRaw = useQuery(
        api.twentyPercentDF.list,
        shouldFetchParent ? { budgetItemId: budgetItemId as Id<"budgetItems"> } : "skip"
    );

    // Transform Convex query result to TwentyPercentDF[]
    // Note: projectsOngoing is now directly mapped from the backend
    const siblingProjects: TwentyPercentDF[] | undefined = siblingProjectsRaw?.map((p) => ({
        id: p._id,
        particulars: p.particulars,
        implementingOffice: p.implementingOffice,
        categoryId: p.categoryId,
        departmentId: p.departmentId,
        totalBudgetAllocated: p.totalBudgetAllocated,
        obligatedBudget: p.obligatedBudget,
        totalBudgetUtilized: p.totalBudgetUtilized,
        utilizationRate: p.utilizationRate || 0,
        projectCompleted: p.projectCompleted || 0,
        projectDelayed: p.projectDelayed || 0,
        projectsOngoing: (p as any).projectsOngoing || 0,
        remarks: p.remarks,
        year: p.year,
        status: p.status,
        targetDateCompletion: p.targetDateCompletion,
        isPinned: p.isPinned,
        pinnedAt: p.pinnedAt,
        pinnedBy: p.pinnedBy,
        projectManagerId: p.projectManagerId,
        _creationTime: p._creationTime,
        autoCalculateBudgetUtilized: p.autoCalculateBudgetUtilized,
    }));

    const [showViolationModal, setShowViolationModal] = useState(false);
    const [pendingValues, setPendingValues] = useState<TwentyPercentDFFormValues | null>(null);
    const [showManualInput, setShowManualInput] = useState(false);

    const [displayAllocated, setDisplayAllocated] = useState("");
    const [displayObligated, setDisplayObligated] = useState("");
    const [displayUtilized, setDisplayUtilized] = useState("");

    const { loadDraft, saveDraft, clearDraft } = useFormDraft("twenty_percent_df_form_draft");
    const savedDraft = project ? null : loadDraft();

    const form = useForm<TwentyPercentDFFormValues>({
        resolver: zodResolver(twentyPercentDFSchema),
        defaultValues: savedDraft || {
            particulars: project?.particulars || "",
            implementingOffice: project?.implementingOffice || "",
            categoryId: project?.categoryId as string | undefined,
            totalBudgetAllocated: project?.totalBudgetAllocated || 0,
            obligatedBudget: project?.obligatedBudget || undefined,
            totalBudgetUtilized: project?.totalBudgetUtilized || 0,
            remarks: project?.remarks || "",
            year: project?.year || urlYear || budgetItemYear || undefined,
            autoCalculateBudgetUtilized: project?.autoCalculateBudgetUtilized !== undefined
                ? project.autoCalculateBudgetUtilized
                : true,
        },
    });

    const formValues = form.watch();
    const autoCalculate = form.watch("autoCalculateBudgetUtilized") ?? true;

    // Initialize display values
    useEffect(() => {
        const allocated = form.getValues("totalBudgetAllocated");
        const obligated = form.getValues("obligatedBudget");
        const utilized = form.getValues("totalBudgetUtilized");

        if (allocated > 0) setDisplayAllocated(formatNumberForDisplay(allocated));
        if (obligated && obligated > 0) setDisplayObligated(formatNumberForDisplay(obligated));
        if (utilized && utilized > 0) setDisplayUtilized(formatNumberForDisplay(utilized));
    }, [form]);

    // Set year from URL
    useEffect(() => {
        if (urlYear && !project) {
            form.setValue("year", urlYear);
        }
    }, [urlYear, form, project]);

    // Auto-save draft
    useEffect(() => {
        if (!project) {
            const timer = setTimeout(() => {
                saveDraft(formValues);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [formValues, project, saveDraft]);

    const totalBudgetAllocated = form.watch("totalBudgetAllocated") ?? 0;
    const totalBudgetUtilized = form.watch("totalBudgetUtilized") ?? 0;
    const obligatedBudget = form.watch("obligatedBudget") ?? 0;

    const utilizationRate =
        totalBudgetAllocated > 0
            ? (totalBudgetUtilized / totalBudgetAllocated) * 100
            : 0;

    const isBudgetExceeded = totalBudgetUtilized > totalBudgetAllocated;
    const isObligatedExceeded = obligatedBudget > 0 && obligatedBudget > totalBudgetAllocated;

    // Calculate budget availability from parent
    const budgetAvailability = calculateBudgetAvailability(
        shouldFetchParent,
        parentBudgetItem,
        siblingProjects,
        project,
        totalBudgetAllocated
    );

    function onSubmit(values: TwentyPercentDFFormValues) {
        const isOverParent = budgetAvailability.isOverBudget;
        const isOverSelf = values.totalBudgetUtilized > values.totalBudgetAllocated;

        if (isOverParent || isOverSelf) {
            setPendingValues(values);
            setShowViolationModal(true);
            return;
        }

        proceedWithSave(values);
    }

    const proceedWithSave = (values: TwentyPercentDFFormValues) => {
        // Create TwentyPercentDFFormData with proper type casting for categoryId
        const projectData: TwentyPercentDFFormData = {
            particulars: values.particulars,
            implementingOffice: values.implementingOffice,
            categoryId: values.categoryId as Id<"projectCategories"> | undefined,
            totalBudgetAllocated: values.totalBudgetAllocated,
            obligatedBudget: values.obligatedBudget,
            totalBudgetUtilized: values.totalBudgetUtilized,
            remarks: values.remarks || "",
            year: values.year,
            autoCalculateBudgetUtilized: values.autoCalculateBudgetUtilized,
        };

        if (!project) {
            clearDraft();
        }
        onSave(projectData);
    };

    const handleCancel = () => {
        if (!project) {
            clearDraft();
        }
        onCancel();
    };

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <ParticularField
                        form={form}
                        isEditMode={!!project}
                    />

                    <CategoryField form={form} />

                    <ImplementingOfficeField form={form} />

                    <YearField
                        form={form}
                        urlYear={urlYear}
                    />

                    <AllocatedBudgetField
                        form={form}
                        displayValue={displayAllocated}
                        setDisplayValue={setDisplayAllocated}
                        budgetAvailability={budgetAvailability}
                        parentBudgetItem={parentBudgetItem}
                    />

                    <AutoCalculateSwitch form={form} />

                    <ManualInputSection
                        form={form}
                        showManualInput={showManualInput}
                        setShowManualInput={setShowManualInput}
                        autoCalculate={autoCalculate}
                        displayObligated={displayObligated}
                        setDisplayObligated={setDisplayObligated}
                        displayUtilized={displayUtilized}
                        setDisplayUtilized={setDisplayUtilized}
                        isObligatedExceeded={isObligatedExceeded}
                        isBudgetExceeded={isBudgetExceeded}
                    />

                    <RemarksField form={form} />

                    <UtilizationDisplay
                        totalBudgetAllocated={totalBudgetAllocated}
                        totalBudgetUtilized={totalBudgetUtilized}
                        utilizationRate={utilizationRate}
                    />

                    <FormActions
                        isEditMode={!!project}
                        onCancel={handleCancel}
                    />
                </form>
            </Form>

            <BudgetViolationModal
                isOpen={showViolationModal}
                onClose={() => {
                    setShowViolationModal(false);
                    setPendingValues(null);
                }}
                onConfirm={() => {
                    if (pendingValues) proceedWithSave(pendingValues);
                    setShowViolationModal(false);
                    setPendingValues(null);
                }}
                allocationViolation={{
                    hasViolation: budgetAvailability.isOverBudget,
                    message: "The budget you are allocating for this item exceeds the available budget from the parent budget item.",
                    details: [{
                        label: "Parent Available",
                        amount: pendingValues?.totalBudgetAllocated || 0,
                        limit: budgetAvailability.available,
                        diff: budgetAvailability.overBudgetAmount
                    }]
                }}
                utilizationViolation={{
                    hasViolation: (pendingValues?.totalBudgetUtilized || 0) > (pendingValues?.totalBudgetAllocated || 0),
                    message: "The utilized budget amount exceeds the allocated budget you have set for this item.",
                    details: [{
                        label: "Self Allocation",
                        amount: pendingValues?.totalBudgetUtilized || 0,
                        limit: pendingValues?.totalBudgetAllocated || 0,
                        diff: (pendingValues?.totalBudgetUtilized || 0) - (pendingValues?.totalBudgetAllocated || 0)
                    }]
                }}
            />
        </>
    );
}