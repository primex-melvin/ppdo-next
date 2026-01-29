
import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TwentyPercentDF } from "../types";

interface TwentyPercentDFStatisticsProps {
    totalAllocated: number;
    totalUtilized: number;
    totalObligated: number;
    averageUtilizationRate: number;
    totalProjects: number;
    items?: TwentyPercentDF[];
}

export function TwentyPercentDFStatistics({
    totalAllocated,
    totalUtilized,
    totalObligated,
    averageUtilizationRate,
    totalProjects,
    items = [],
}: TwentyPercentDFStatisticsProps) {
    const currency = useMemo(
        () =>
            new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
                maximumFractionDigits: 0,
            }),
        []
    );

    // Calculate subtotals by status
    const statusCounts = useMemo(() => {
        const counts = {
            completed: 0,
            ongoing: 0,
            delayed: 0,
            not_available: 0,
        };

        items.forEach((item) => {
            if (item.status === "completed") {
                counts.completed++;
            } else if (item.status === "ongoing") {
                counts.ongoing++;
            } else if (item.status === "delayed") {
                counts.delayed++;
            } else {
                counts.not_available++;
            }
        });

        return counts;
    }, [items]);

    const statusConfig = [
        {
            key: 'completed' as const,
            label: 'Completed',
            dotColor: 'bg-zinc-700'
        },
        {
            key: 'ongoing' as const,
            label: 'Ongoing',
            dotColor: 'bg-zinc-600'
        },
        {
            key: 'delayed' as const,
            label: 'Delayed',
            dotColor: 'bg-zinc-500'
        },
    ];

    const projectBreakdown = (
        <div className="mt-3 flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            {statusConfig.map((status) => {
                const count = statusCounts[status.key];
                return (
                    <div key={status.key} className="flex justify-between items-center">
                        <span className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                            {status.label}
                        </span>
                        <span className="font-mono tabular-nums">{count}</span>
                    </div>
                );
            })}
            <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-1" />
            <div className="flex justify-between items-center font-medium text-zinc-700 dark:text-zinc-300">
                <span>Total</span>
                <span className="font-mono tabular-nums">{totalProjects}</span>
            </div>
        </div>
    );

    return (
        <section
            aria-label="20% DF statistics"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 no-print"
        >
            <div className="flex flex-col gap-4">
                <StatCard
                    label="Total Budget Allocated"
                    value={currency.format(totalAllocated)}
                />
                <StatCard
                    label="Average Utilization Rate"
                    value={`${averageUtilizationRate.toFixed(1)}%`}
                />
            </div>

            <div className="flex flex-col gap-4">
                <StatCard
                    label="Total Budget Utilized"
                    value={currency.format(totalUtilized)}
                />
                <StatCard
                    label="Total Obligated Budget"
                    value={currency.format(totalObligated)}
                />
            </div>

            <div className="md:col-span-2 lg:col-span-1">
                <StatCard
                    label="Total Particulars"
                    value={totalProjects.toLocaleString()}
                    subContent={projectBreakdown}
                />
            </div>
        </section>
    );
}

const StatCard = React.memo(function StatCard({
    label,
    value,
    subContent,
}: {
    label: string;
    value: string;
    subContent?: React.ReactNode;
}) {
    return (
        <Card role="group" aria-label={label} className="h-full">
            <CardContent className="py-6 px-6 no-click">
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {label}
                </p>
                <p
                    className="text-2xl font-bold text-zinc-900 dark:text-zinc-100"
                    aria-live="polite"
                >
                    {value}
                </p>
                {subContent}
            </CardContent>
        </Card>
    );
});
