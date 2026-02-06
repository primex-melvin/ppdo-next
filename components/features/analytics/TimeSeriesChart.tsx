"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { DashboardChartCard } from "@/components/features/ppdo/dashboard/charts/DashboardChartCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TimeSeriesChartProps {
    data: {
        monthly: any[];
        quarterly: any[];
    };
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
    const [view, setView] = useState<"monthly" | "quarterly">("monthly");
    const [metric, setMetric] = useState<"budget" | "projects">("budget");

    const chartData = data[view].map((item) => ({
        ...item,
        label: view === "monthly"
            ? new Date(2024, item.month - 1).toLocaleString("default", { month: "short" })
            : `Q${item.quarter}`,
    }));

    const getMetricLabel = (m: string) => {
        return m.charAt(0).toUpperCase() + m.slice(1);
    };

    const getMetricColor = (m: string) => {
        switch (m) {
            case "budget": return "#3b82f6";
            case "projects": return "#8b5cf6";
            case "obligations": return "#f59e0b";
            case "disbursements": return "#10b981";
            default: return "#313336";
        }
    };

    return (
        <DashboardChartCard
            title="Performance Over Time"
            subtitle="Track budget and project trends"
            className="flex flex-col"
        >
            <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
                <Tabs value={metric} onValueChange={(v: any) => setMetric(v)}>
                    <TabsList>
                        <TabsTrigger value="budget">Budget</TabsTrigger>
                        <TabsTrigger value="projects">Projects</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Tabs value={view} onValueChange={(v: any) => setView(v)}>
                    <TabsList>
                        <TabsTrigger value="monthly">Monthly</TabsTrigger>
                        <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <motion.div
                key={`${view}-${metric}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="h-[300px] w-full"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) =>
                                metric === "projects" ? value : `â‚±${(value / 1000).toFixed(0)}k`
                            }
                        />
                        <Tooltip
                            formatter={(value: any) =>
                                metric === "projects"
                                    ? value
                                    : new Intl.NumberFormat("en-PH", {
                                        style: "currency",
                                        currency: "PHP",
                                    }).format(Number(value))
                            }
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey={metric}
                            name={getMetricLabel(metric)}
                            stroke={getMetricColor(metric)}
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: "white" }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </motion.div>
        </DashboardChartCard>
    );
}