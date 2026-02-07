"use client";

import { useMemo, useState, useCallback } from "react";
import { TrendingUp, Package, FolderTree, Wallet, ListTree } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { FundDashboard } from "@/components/features/ppdo/fund-dashboard/FundDashboard";
import { useFiscalYearDashboard } from "@/hooks/useFiscalYearDashboard";
import { Id } from "@/convex/_generated/dataModel";

// Stats interface for Trust Funds
interface TrustFundsStats {
    trustFundCount: number;
    totalItems: number;
    totalReceived: number;
    totalUtilized: number;
    totalBalance: number;
    avgUtilizationRate: number;
}

// Component for lazy-loaded expanded content
function ExpandedCardContent({
    fiscalYearId,
    year,
    accentColor
}: {
    fiscalYearId: Id<"fiscalYears">;
    year: number;
    accentColor: string;
}) {
    // Lazy load data only when this component mounts (dropdown is opened)
    const allTrustFunds = useQuery(api.trustFunds.list);
    const allBreakdowns = useQuery(api.trustFundBreakdowns.getBreakdowns, {});

    const stats = useMemo(() => {
        if (!allTrustFunds || !allBreakdowns) return null;

        const yearTrustFunds = allTrustFunds.filter(tf => tf.year === year);
        const yearFundIds = new Set(yearTrustFunds.map(f => f._id));
        const yearBreakdowns = allBreakdowns.filter(b => yearFundIds.has(b.trustFundId));

        const totalReceived = yearTrustFunds.reduce((sum, tf) => sum + tf.received, 0);
        const totalUtilized = yearTrustFunds.reduce((sum, tf) => sum + tf.utilized, 0);
        const totalBalance = yearTrustFunds.reduce((sum, tf) => sum + tf.balance, 0);
        const avgUtilizationRate = yearTrustFunds.length > 0
            ? yearTrustFunds.reduce((sum, tf) => sum + (tf.utilizationRate || 0), 0) / yearTrustFunds.length
            : 0;

        // Calculate total items (breakdowns count)
        const totalItems = yearBreakdowns.length;

        return {
            trustFundCount: yearTrustFunds.length,
            totalItems,
            totalReceived,
            totalUtilized,
            totalBalance,
            avgUtilizationRate,
        };
    }, [allTrustFunds, allBreakdowns, year]);

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (!stats) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent" />
            </div>
        );
    }

    return (
        <>
            {/* Count Cards - Same style as financial cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                        <Wallet className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            Trust Funds
                        </span>
                    </div>
                    <div className="text-xl font-bold text-zinc-900 dark:text-white">
                        {stats.trustFundCount}
                    </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                        <ListTree className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            Breakdowns
                        </span>
                    </div>
                    <div className="text-xl font-bold text-zinc-900 dark:text-white">
                        {stats.totalItems}
                    </div>
                </div>
            </div>

            {/* Financial Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            Total Received
                        </span>
                    </div>
                    <div className="text-xl font-bold text-zinc-900 dark:text-white">
                        {formatCurrency(stats.totalReceived)}
                    </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                        <Package className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            Total Utilized
                        </span>
                    </div>
                    <div className="text-xl font-bold text-zinc-900 dark:text-white">
                        {formatCurrency(stats.totalUtilized)}
                    </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                        <FolderTree className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            Avg Utilization
                        </span>
                    </div>
                    <div className="text-xl font-bold text-zinc-900 dark:text-white">
                        {stats.avgUtilizationRate.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Balance Overview */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                    Balance Overview
                </h4>
                <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: accentColor }}>
                        {formatCurrency(stats.totalBalance)}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Available Balance
                    </div>
                </div>
            </div>
        </>
    );
}

export default function TrustFundsLanding() {
    const { accentColorValue } = useAccentColor();

    // Track which cards are expanded for lazy loading
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

    // Use the shared dashboard hook - only fetch fiscal years (lightweight)
    const {
        sortedYears: baseSortedYears,
        isLoadingYears,
    } = useFiscalYearDashboard({
        routePrefix: "/dashboard/trust-funds",
    });

    const handleToggleExpand = useCallback((cardId: string, isExpanded: boolean) => {
        setExpandedCards(prev => {
            const newSet = new Set(prev);
            if (isExpanded) {
                newSet.add(cardId);
            } else {
                newSet.delete(cardId);
            }
            return newSet;
        });
    }, []);

    // Sort years descending
    const sortedYears = useMemo(() => {
        if (!baseSortedYears) return [];
        return [...baseSortedYears].sort((a, b) => b.year - a.year);
    }, [baseSortedYears]);

    return (
        <FundDashboard
            title="Trust Funds"
            subtitle="Select a year to manage trust funds"
            routePrefix="/dashboard/trust-funds"
            itemTypeLabel="trust funds"
            accentColor={accentColorValue}
            sortedYears={sortedYears}
            isLoading={isLoadingYears}
            openButtonLabel="Open Funds"
            // Empty stats content - counts moved to dropdown
            statsContent={() => null}
            onToggleExpand={handleToggleExpand}
            expandedContent={(fiscalYear) => {
                // Only render expanded content if this card has been expanded
                // This triggers the lazy loading of data
                if (!expandedCards.has(fiscalYear._id)) {
                    return (
                        <div className="flex items-center justify-center py-8">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-3 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent" />
                        </div>
                    );
                }
                return (
                    <ExpandedCardContent
                        fiscalYearId={fiscalYear._id}
                        year={fiscalYear.year}
                        accentColor={accentColorValue}
                    />
                );
            }}
        />
    );
}
