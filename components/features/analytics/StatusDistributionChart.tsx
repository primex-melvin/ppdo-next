"use client";

import { motion } from "framer-motion";
import { DashboardChartCard } from "@/components/features/ppdo/dashboard/charts/DashboardChartCard";

interface StatusDistributionChartProps {
    data: Record<string, number>;
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
    // 1. Transform data: rename 'draft' to 'No Status' and keep others
    // 2. Sort order: Completed, Delayed, Ongoing, No Status

    // Normalize keys to lowercase for safe checking
    const normalizedData = Object.keys(data).reduce((acc, key) => {
        acc[key.toLowerCase()] = data[key];
        return acc;
    }, {} as Record<string, number>);

    const statusConfig = [
        {
            key: "completed",
            label: "Completed",
            color: "#10B981", // Green
            value: normalizedData["completed"] || 0
        },
        {
            key: "delayed",
            label: "Delayed",
            color: "#EF4444", // Red
            value: normalizedData["delayed"] || 0
        },
        {
            key: "ongoing",
            label: "Ongoing",
            color: "#3B82F6", // Blue
            value: normalizedData["ongoing"] || 0
        },
        {
            key: "draft",
            label: "No Status",
            color: "#71717a", // Zinc/Gray
            value: normalizedData["draft"] || 0
        },
    ];

    const total = statusConfig.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <DashboardChartCard
            title="Project Status Distribution"
            subtitle="Overview of project progression"
        >
            <div className="flex flex-col gap-4 mt-2">
                {statusConfig.map((item) => {
                    const percentage = total > 0 ? (item.value / total) * 100 : 0;

                    return (
                        <div key={item.key} className="flex flex-col group">
                            <div className="flex justify-between items-baseline mb-1.5">
                                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                    {item.label}
                                </span>
                                <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                                    {item.value}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="h-2 flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                        className="h-full rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
                                        style={{ backgroundColor: item.color }}
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-zinc-400 w-8 text-right tabular-nums">
                                    {percentage.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </DashboardChartCard>
    );
}