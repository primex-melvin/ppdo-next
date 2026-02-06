"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { DashboardChartCard } from "./DashboardChartCard";
import { DashboardPieChartData } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface TabbedPieChartProps {
    data: DashboardPieChartData;
    isLoading?: boolean;
}

// Helper to format values based on tab type
function formatValue(value: number, tabType: string): string {
    if (tabType === 'finance' || tabType === 'budget') {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            notation: "compact",
            maximumFractionDigits: 1,
        }).format(value);
    }
    return value.toLocaleString();
}

export function TabbedPieChart({ data, isLoading }: TabbedPieChartProps) {
    const [activeTab, setActiveTab] = useState<keyof DashboardPieChartData>("budget");

    const tabs: { key: keyof DashboardPieChartData; label: string }[] = [
        { key: "budget", label: "Budget" },
        { key: "sector", label: "Sector" },
        { key: "finance", label: "Finance" },
        { key: "status", label: "Status" },
        { key: "department", label: "Department" },
    ];

    if (isLoading) {
        return (
            <DashboardChartCard title="Budget & Distribution" height={380}>
                <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
                </div>
            </DashboardChartCard>
        );
    }

    const activeData = data?.[activeTab] || [];
    const hasData = activeData.length > 0 && activeData.some(d => d.value > 0);

    // Calculate total for percentages and subtitle
    const totalValue = activeData.reduce((sum, item) => sum + item.value, 0);

    const getSubtitle = () => {
        if (!hasData) return "Breakdown by category";
        if (activeTab === 'sector') return `${totalValue} total projects`;
        if (activeTab === 'finance' || activeTab === 'budget') return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            notation: "compact"
        }).format(totalValue) + " total budget";
        if (activeTab === 'status') return `${totalValue} total projects`;
        if (activeTab === 'department') return `Top ${activeData.length} departments`;
        return "Breakdown by category";
    };

    // Custom label for always visible percentages
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = outerRadius + 25;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null; // Don't show for very small slices

        return (
            <text
                x={x}
                y={y}
                fill="#71717a"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="text-[10px] font-bold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <DashboardChartCard
            title="Budget Overview"
            subtitle={getSubtitle()}
            height={380}
        >
            <div className="flex flex-col h-full">
                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-6 w-fit mx-auto sm:mx-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200",
                                activeTab === tab.key
                                    ? "bg-white dark:bg-zinc-700 text-green-700 dark:text-green-400 shadow-sm ring-1 ring-black/5"
                                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Chart Segment */}
                <div className="flex-1 min-h-0">
                    {!hasData ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-400 px-4">
                            <div className="w-16 h-16 mb-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <span className="text-sm font-semibold mb-1">No {activeTab} data</span>
                            <span className="text-xs text-center text-zinc-400">Data will appear here as records are added</span>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center h-full gap-8">
                            {/* Pie/Donut Chart */}
                            <div className="relative flex-shrink-0" style={{ width: 200, height: 200 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={activeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            dataKey="value"
                                            labelLine={false}
                                            label={renderCustomizedLabel}
                                            animationBegin={0}
                                            animationDuration={1500}
                                        >
                                            {activeData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color || "#15803D"}
                                                    strokeWidth={0}
                                                    className="focus:outline-none hover:opacity-80 transition-opacity cursor-pointer"
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "rgba(255, 255, 255, 0.95)",
                                                borderRadius: "12px",
                                                border: "1px solid #e4e4e7",
                                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                                fontSize: "12px",
                                                backdropFilter: "blur(4px)"
                                            }}
                                            itemStyle={{ color: "#18181b", fontWeight: 600 }}
                                            formatter={(value: number | undefined) => [
                                                formatValue(value || 0, activeTab),
                                                "Amount"
                                            ]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Content for Donut */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Total</span>
                                    <span className="text-sm font-black text-zinc-800 dark:text-zinc-100">
                                        {formatValue(totalValue, activeTab)}
                                    </span>
                                </div>
                            </div>

                            {/* Enhanced Legend */}
                            <div className="flex-1 grid grid-cols-1 gap-3 w-full">
                                {activeData.map((entry, index) => {
                                    const percentage = totalValue > 0 ? (entry.value / totalValue) * 100 : 0;
                                    return (
                                        <div key={index} className="flex items-center group">
                                            <div
                                                className="w-1.5 h-10 rounded-full mr-4 flex-shrink-0 transition-all group-hover:w-2"
                                                style={{ backgroundColor: entry.color }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tight truncate mr-2">
                                                        {entry.name}
                                                    </span>
                                                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                                                        {formatValue(entry.value, activeTab)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1 flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${percentage}%`,
                                                                backgroundColor: entry.color,
                                                                opacity: 0.6
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-zinc-400 w-8 text-right">
                                                        {percentage.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardChartCard>
    );
}

