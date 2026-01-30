"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { DashboardChartCard } from "@/components/ppdo/dashboard/charts/DashboardChartCard";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Tooltip as UITooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import domToImage from "dom-to-image-more";

interface BudgetData {
    allocated: number;
    obligated: number;
    disbursed: number;
    remaining: number;
}

interface EnhancedBudgetChartProps {
    data: BudgetData;
}

const COLORS = {
    Allocated: "#3b82f6",
    Obligated: "#f59e0b",
    Disbursed: "#10b981",
    Remaining: "#ef4444",
};

export function EnhancedBudgetChart({ data }: EnhancedBudgetChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState("pie");

    const barChartData = [
        {
            name: "Budget",
            Allocated: data.allocated,
            Obligated: data.obligated,
            Disbursed: data.disbursed,
            Remaining: data.remaining,
        },
    ];

    const pieChartData = [
        { name: "Allocated", value: data.allocated, color: COLORS.Allocated },
        { name: "Obligated", value: data.obligated, color: COLORS.Obligated },
        { name: "Disbursed", value: data.disbursed, color: COLORS.Disbursed },
        { name: "Remaining", value: data.remaining, color: COLORS.Remaining },
    ].filter(item => item.value > 0);

    const handleExport = async () => {
        if (!chartRef.current) return;

        // Use a slightly longer timeout to ensure tabs switch if needed
        setTimeout(async () => {
            try {
                const dataUrl = await domToImage.toPng(chartRef.current as HTMLElement, {
                    bgcolor: 'white',
                });
                const link = document.createElement("a");
                link.download = `budget-chart-${activeTab}-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
            } catch (error) {
                console.error("Failed to export chart:", error);
            }
        }, 100);
    };

    return (
        <DashboardChartCard
            title="Budget Overview"
            subtitle="Allocation, obligation, and disbursement status"
            className="relative"
        >
            <div className="flex justify-end items-center space-x-2 absolute top-4 right-4 z-10">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[160px]">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                        <TabsTrigger value="pie" className="text-xs">Pie</TabsTrigger>
                        <TabsTrigger value="bar" className="text-xs">Bar</TabsTrigger>
                    </TabsList>
                </Tabs>
                {/* <UITooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={handleExport}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Download {activeTab} chart image</p>
                    </TooltipContent>
                </UITooltip> */}
            </div>

            <motion.div
                ref={chartRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mt-8"
            >
                {activeTab === "pie" ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) =>
                                    new Intl.NumberFormat("en-PH", {
                                        style: "currency",
                                        currency: "PHP",
                                    }).format(Number(value))
                                }
                                contentStyle={{
                                    backgroundColor: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis
                                tickFormatter={(value) =>
                                    `₱${(value / 1_000_000).toFixed(1)}M`
                                }
                            />
                            <Tooltip
                                formatter={(value: any) =>
                                    new Intl.NumberFormat("en-PH", {
                                        style: "currency",
                                        currency: "PHP",
                                    }).format(Number(value))
                                }
                                contentStyle={{
                                    backgroundColor: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                            />
                            <Legend />
                            <Bar dataKey="Allocated" fill={COLORS.Allocated} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Obligated" fill={COLORS.Obligated} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Disbursed" fill={COLORS.Disbursed} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Remaining" fill={COLORS.Remaining} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </motion.div>
        </DashboardChartCard>
    );
}
