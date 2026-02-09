"use client";

import { useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
    FiscalYearHeader,
    FiscalYearEmptyState,
    FiscalYearCard,
    FiscalYearModal,
    FiscalYearDeleteDialog,
} from "@/components/features/ppdo/fiscal-years";

/**
 * Fiscal year with stats - generic interface for fund dashboard
 */
export interface FiscalYearWithStats<TStats = Record<string, number>> {
    _id: Id<"fiscalYears">;
    _creationTime?: number;
    year: number;
    label?: string;
    description?: string;
    isCurrent?: boolean;
    isActive?: boolean;
    stats: TStats;
}

/**
 * Access check result for pages with access control
 */
export interface AccessCheckResult {
    user?: {
        name?: string;
        email?: string;
    };
    department?: {
        name?: string;
    };
    canAccess?: boolean;
}

/**
 * Props for the FundDashboard component
 */
export interface FundDashboardProps<TStats = Record<string, number>> {
    /** Page title displayed in header */
    title: string;
    /** Page subtitle displayed in header */
    subtitle?: string;
    /** Route prefix for navigation (e.g., "/dashboard/trust-funds") */
    routePrefix: string;
    /** Label for item type in delete dialog (e.g., "trust funds") */
    itemTypeLabel: string;
    /** Accent color for buttons and highlights */
    accentColor: string;
    /** Array of fiscal years with stats to display */
    sortedYears: FiscalYearWithStats<TStats>[];
    /** Loading state */
    isLoading: boolean;
    /** Custom loading component or message */
    loadingContent?: ReactNode;
    /** Function to render stats summary in each card */
    statsContent: (fiscalYear: FiscalYearWithStats<TStats>) => ReactNode;
    /** Function to render expanded details in each card */
    expandedContent: (fiscalYear: FiscalYearWithStats<TStats>) => ReactNode;
    /** Label for the open button (default: "Open") */
    openButtonLabel?: string;
    /** Access check result for pages with access control */
    accessCheck?: AccessCheckResult | null;
    /** Whether user can access the page (for pages with access control) */
    canAccess?: boolean;
    /** Custom component to render when access is denied */
    renderAccessDenied?: (accessCheck: AccessCheckResult | null) => ReactNode;
    /** Callback when a year is deleted */
    onYearDeleted?: (year: number) => void;
    /** Callback when a year is created */
    onYearCreated?: (year: number) => void;
    /** Callback when a card is expanded/collapsed (for lazy loading) */
    onToggleExpand?: (fiscalYearId: string, isExpanded: boolean) => void;
}

/**
 * Reusable dashboard component for fund-type fiscal year pages.
 * 
 * Encapsulates the shared JSX structure found across:
 * - 20_percent_df/page.tsx
 * - project/page.tsx
 * - special-education-funds/page.tsx
 * - special-health-funds/page.tsx
 * - trust-funds/page.tsx
 * 
 * @example
 * ```tsx
 * <FundDashboard
 *   title="Trust Funds"
 *   subtitle="Select a year to manage trust funds"
 *   routePrefix="/dashboard/trust-funds"
 *   itemTypeLabel="trust funds"
 *   accentColor="#15803D"
 *   sortedYears={sortedYears}
 *   isLoading={isLoading}
 *   statsContent={(fy) => <div>{fy.stats.fundCount} Funds</div>}
 *   expandedContent={(fy) => <div>Details...</div>}
 * />
 * ```
 */
export function FundDashboard<TStats = Record<string, number>>({
    title,
    subtitle,
    routePrefix,
    itemTypeLabel,
    accentColor,
    sortedYears,
    isLoading,
    loadingContent,
    statsContent,
    expandedContent,
    openButtonLabel = "Open",
    accessCheck,
    canAccess = true,
    renderAccessDenied,
    onYearDeleted,
    onYearCreated,
    onToggleExpand,
}: FundDashboardProps<TStats>) {
    const router = useRouter();
    const [showFiscalYearModal, setShowFiscalYearModal] = useState(false);
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [yearToDelete, setYearToDelete] = useState<{ id: Id<"fiscalYears">; year: number } | null>(null);

    // Delete mutation
    const deleteFiscalYear = useMutation(api.fiscalYears.remove);

    const handleOpenYear = (year: number) => {
        router.push(`${routePrefix}/${year}`);
    };

    const handleYearCreated = (year: number) => {
        onYearCreated?.(year);
    };

    const toggleCard = (cardId: string) => {
        setExpandedCards((prev) => {
            const newSet = new Set(prev);
            const isExpanding = !newSet.has(cardId);
            if (newSet.has(cardId)) {
                newSet.delete(cardId);
            } else {
                newSet.add(cardId);
            }
            return newSet;
        });
        // Call the callback after state update using setTimeout to avoid render-phase update
        const isCurrentlyExpanded = expandedCards.has(cardId);
        setTimeout(() => {
            onToggleExpand?.(cardId, !isCurrentlyExpanded);
        }, 0);
    };

    const handleDeleteClick = (e: React.MouseEvent, id: Id<"fiscalYears">, year: number) => {
        e.stopPropagation();
        setYearToDelete({ id, year });
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!yearToDelete) return;

        try {
            await deleteFiscalYear({ id: yearToDelete.id });
            toast.success(`Year ${yearToDelete.year} deleted successfully`);
            setDeleteDialogOpen(false);
            onYearDeleted?.(yearToDelete.year);
            setYearToDelete(null);
        } catch (error) {
            toast.error("Failed to delete year");
            console.error(error);
        }
    };

    // Handle loading state
    if (isLoading) {
        if (loadingContent) {
            return <>{loadingContent}</>;
        }
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent mb-4"></div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading years...</p>
                </div>
            </div>
        );
    }

    // Handle access denied
    if (!canAccess && renderAccessDenied) {
        return <>{renderAccessDenied(accessCheck || null)}</>;
    }

    return (
        <>
            <div className="space-y-6">
                <FiscalYearHeader
                    title={title}
                    subtitle={subtitle}
                    onAddYear={() => setShowFiscalYearModal(true)}
                    onOpenLatest={() => sortedYears.length > 0 && handleOpenYear(sortedYears[0].year)}
                    hasYears={sortedYears.length > 0}
                    accentColor={accentColor}
                />

                {sortedYears.length === 0 ? (
                    <FiscalYearEmptyState
                        onCreateFirst={() => setShowFiscalYearModal(true)}
                        accentColor={accentColor}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {sortedYears.map((fiscalYear, index) => {
                            const isExpanded = expandedCards.has(fiscalYear._id);

                            return (
                                <FiscalYearCard
                                    key={fiscalYear._id}
                                    index={index}
                                    fiscalYear={fiscalYear}
                                    isExpanded={isExpanded}
                                    onToggleExpand={() => toggleCard(fiscalYear._id)}
                                    onOpen={() => handleOpenYear(fiscalYear.year)}
                                    onDelete={(e) => handleDeleteClick(e, fiscalYear._id, fiscalYear.year)}
                                    accentColor={accentColor}
                                    openButtonLabel={openButtonLabel}
                                    statsContent={statsContent(fiscalYear)}
                                    expandedContent={expandedContent(fiscalYear)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <FiscalYearModal
                isOpen={showFiscalYearModal}
                onClose={() => setShowFiscalYearModal(false)}
                onSuccess={() => {
                    // The modal handles its own success callback with redirect logic
                }}
            />

            <FiscalYearDeleteDialog
                isOpen={deleteDialogOpen}
                setIsOpen={setDeleteDialogOpen}
                yearToDelete={yearToDelete}
                onConfirm={handleConfirmDelete}
                itemTypeLabel={itemTypeLabel}
            />

            <style jsx global>{`
                @keyframes fadeInSlide {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </>
    );
}

export default FundDashboard;
