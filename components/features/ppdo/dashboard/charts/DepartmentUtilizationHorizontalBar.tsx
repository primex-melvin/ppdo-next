"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    ReferenceLine,
} from "recharts";
import { DashboardChartCard } from "./DashboardChartCard";
import { useAccentColor } from "@/contexts/AccentColorContext";


interface UtilizationData {
    department: string;
    utilized: number;
    obligated: number; // unutilized part
    balance: number; // unobligated part
}

interface DepartmentUtilizationHorizontalBarProps {
    data: UtilizationData[];
    isLoading?: boolean;
}

// Helper function to truncate text with ellipsis
function truncateText(text: string, maxLength: number = 15): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
}

export function DepartmentUtilizationHorizontalBar({
    data,
    isLoading,
}: DepartmentUtilizationHorizontalBarProps) {
    const { accentColorValue } = useAccentColor();

    if (isLoading) {
        return (
            <DashboardChartCard title="Department Budget" height={380}>
                <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: accentColorValue }}></div>
                </div>
            </DashboardChartCard>
        );
    }

    // Format currency for tooltips
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            notation: "compact",
        }).format(value);

    return (
        <DashboardChartCard
            title="Department Budget Composition"
            subtitle="Budget distribution by implementing office"
            height={380}
        >
            <div className="flex flex-col h-full">
                {/* Legend Header */}
                <div className="flex items-center gap-4 mb-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Utilized</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>Obligated</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
                        <span>Balance</span>
                    </div>
                </div>

                {/* Chart */}
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data}
                            margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                            stackOffset="expand"
                        >
                            <XAxis
                                type="number"
                                hide
                            />
                            <YAxis
                                dataKey="department"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#71717a", fontSize: 10, fontWeight: 700 }}
                                width={120}
                                tickFormatter={(value) => truncateText(value, 20)}
                            />
                            <Tooltip
                                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-800 backdrop-blur-md">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">{label}</p>
                                                <div className="space-y-1.5">
                                                    {payload.map((entry: any, index: number) => (
                                                        <div key={index} className="flex justify-between items-center gap-8">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{entry.name}</span>
                                                            </div>
                                                            <span className="text-xs font-black text-zinc-800 dark:text-zinc-100">{formatCurrency(entry.value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="utilized" name="Utilized" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} barSize={20} />
                            <Bar dataKey="obligated" name="Obligated" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="balance" name="Balance" stackId="a" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </DashboardChartCard>
    );
}

