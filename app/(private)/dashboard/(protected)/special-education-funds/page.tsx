"use client";

import { useMemo, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { TrendingUp, Package, FolderTree, FolderOpen, ListTree } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { FundDashboard } from "@/components/features/ppdo/fund-dashboard/FundDashboard";
import { useFiscalYearDashboard, FiscalYearWithStats } from "@/hooks/useFiscalYearDashboard";
import { Id } from "@/convex/_generated/dataModel";

// Stats interface for SEF
interface SEFStats {
    fundCount: number;
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
    const allSpecialEducationFunds = useQuery(api.specialEducationFunds.list);
    const allBreakdowns = useQuery(api.specialEducationFundBreakdowns.getBreakdowns, {});
    
    const stats = useMemo((): SEFStats | null => {
        if (!allSpecialEducationFunds || !allBreakdowns) return null;
        
        const yearFunds = allSpecialEducationFunds.filter(fund => fund.year === year);
        const yearFundIds = new Set(yearFunds.map(f => f._id));
        const yearBreakdowns = allBreakdowns.filter(b => yearFundIds.has(b.specialEducationFundId));
        
        const totalReceived = yearFunds.reduce((sum, fund) => sum + fund.received, 0);
        const totalUtilized = yearFunds.reduce((sum, fund) => sum + fund.utilized, 0);
        const totalBalance = yearFunds.reduce((sum, fund) => sum + fund.balance, 0);
        
        const avgUtilizationRate = yearFunds.length > 0
            ? yearFunds.reduce((sum, fund) => sum + (fund.utilizationRate || 0), 0) / yearFunds.length
            : 0;
        
        // Calculate total items (breakdown items)
        const totalItems = yearBreakdowns.length;
        
        return {
            fundCount: yearFunds.length,
            totalItems,
            totalReceived,
            totalUtilized,
            totalBalance,
            avgUtilizationRate,
        };
    }, [allSpecialEducationFunds, allBreakdowns, year]);
    
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
                        <FolderOpen className="w-3 h-3 text-zinc-600 dark:text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                            SEF Items
                        </span>
                    </div>
                    <div className="text-xl font-bold text-zinc-900 dark:text-white">
                        {stats.fundCount}
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

export default function SpecialEducationFundsLanding() {
    const { accentColorValue } = useAccentColor();

    // Track which cards are expanded for lazy loading
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

    // Use the shared dashboard hook - only fetch fiscal years (lightweight)
    const {
        sortedYears: baseSortedYears,
        isLoadingYears,
    } = useFiscalYearDashboard({
        routePrefix: "/dashboard/special-education-funds",
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
            title="Special Education Funds"
            subtitle="Select a year to manage special education funds"
            routePrefix="/dashboard/special-education-funds"
            itemTypeLabel="special education funds"
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
