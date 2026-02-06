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
import { DashboardChartCard } from "@/components/features/ppdo/dashboard/charts/DashboardChartCard";
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
    Utilized: "#10B981",    // Green
    Obligated: "#F59E0B",   // Amber
    Balance: "#4f46e5",     // Indigo
    Allocated: "#3B82F6",   // Blue
};

export function EnhancedBudgetChart({ data }: EnhancedBudgetChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState("pie");

    // Calculate effective obligation to handle data inconsistencies (e.g. if disbursed > obligated)
    const effectiveObligated = Math.max(data.obligated, data.disbursed);

    // Segments
    const utilizedVal = data.disbursed;
    const pendingObligationVal = Math.max(0, effectiveObligated - data.disbursed);
    const balanceVal = Math.max(0, data.allocated - effectiveObligated);

    const pieChartData = [
        { name: "Utilized", value: utilizedVal, color: "url(#colorUtilized)" },
        { name: "Obligated", value: pendingObligationVal, color: "url(#colorObligated)" },
        { name: "Balance", value: balanceVal, color: "url(#colorBalance)" },
    ].filter(item => item.value > 0);

    const barChartData = [
        {
            name: "Budget",
            Utilized: utilizedVal,
            Obligated: pendingObligationVal,
            Balance: balanceVal,
        },
    ];

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            notation: "compact",
            maximumFractionDigits: 2
        }).format(value);

    // Custom label for permanent percentages
    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = outerRadius + 25;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null;

        return (
            <text
                x={x}
                y={y}
                fill="#71717a"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="text-[10px] font-black"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <DashboardChartCard
            title="Budget Overview"
            subtitle="Allocation, obligation, and utilization status"
            className="relative"
            height={440}
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    {/* Placeholder for spacing if needed */}
                </div>
                <div className="flex items-center space-x-2">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[140px]">
                        <TabsList className="grid w-full grid-cols-2 h-9 rounded-xl bg-zinc-100/80 dark:bg-zinc-800/80 p-1">
                            <TabsTrigger value="pie" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Pie</TabsTrigger>
                            <TabsTrigger value="bar" className="text-xs font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Bar</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            <motion.div
                ref={chartRef}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="h-[320px]"
            >
                {activeTab === "pie" ? (
                    <div className="flex flex-col sm:flex-row items-center h-full gap-8">
                        {/* Donut Chart */}
                        <div className="relative flex-shrink-0" style={{ width: 220, height: 220 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <defs>
                                        <linearGradient id="colorUtilized" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#34D399" />
                                            <stop offset="100%" stopColor="#059669" />
                                        </linearGradient>
                                        <linearGradient id="colorObligated" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#FBBF24" />
                                            <stop offset="100%" stopColor="#D97706" />
                                        </linearGradient>
                                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#818cf8" />
                                            <stop offset="100%" stopColor="#4f46e5" />
                                        </linearGradient>
                                    </defs>
                                    {/* Outer Ring for Allocation Reference */}
                                    <Pie
                                        data={[{ value: 1 }]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={98}
                                        outerRadius={102}
                                        dataKey="value"
                                        stroke="none"
                                        fill="#EFF6FF"
                                        animationDuration={0}
                                        isAnimationActive={false}
                                    />
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={95}
                                        paddingAngle={4}
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderCustomLabel}
                                        stroke="none"
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                className="focus:outline-none hover:opacity-90 transition-opacity cursor-pointer filter drop-shadow-sm"
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
                                        itemStyle={{ color: "#18181b", fontWeight: 700 }}
                                        formatter={(value: any) => formatCurrency(Number(value))}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-black">Allocated</span>
                                <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                                    {formatCurrency(data.allocated)}
                                </span>
                            </div>
                        </div>

                        {/* Enhanced High-End Legend */}
                        <div className="flex-1 w-full grid grid-cols-1 gap-3">
                            {[
                                { name: "Allocated", value: data.allocated, color: COLORS.Allocated, isTotal: true },
                                { name: "Utilized", value: utilizedVal, color: COLORS.Utilized },
                                { name: "Obligated", value: data.obligated, color: COLORS.Obligated, subNote: `(${formatCurrency(pendingObligationVal)} unutilized)` },
                                { name: "Balance", value: balanceVal, color: COLORS.Balance },
                            ].map((item, idx) => {
                                const percentage = data.allocated > 0 ? (item.value / data.allocated) * 100 : 0;
                                return (
                                    <div key={idx} className="flex items-center group">
                                        <div
                                            className="w-1.5 h-10 rounded-full mr-4 flex-shrink-0 transition-all group-hover:w-2.5"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider truncate">
                                                    {item.name}
                                                </span>
                                                <span className="text-xs font-black text-zinc-900 dark:text-zinc-100">
                                                    {formatCurrency(item.value)}
                                                </span>
                                            </div>
                                            {!item.isTotal && (
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1 flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-1000"
                                                            style={{
                                                                width: `${percentage}%`,
                                                                backgroundColor: item.color,
                                                                opacity: 0.7
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black text-zinc-400 w-8 text-right">
                                                        {percentage.toFixed(0)}%
                                                    </span>
                                                </div>
                                            )}
                                            {item.isTotal && (
                                                <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div className="h-full w-full bg-blue-500 opacity-20" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#71717a', fontSize: 12, fontWeight: 700 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#71717a', fontSize: 10, fontWeight: 700 }}
                                tickFormatter={(value) => `â‚±${(value / 1_000_000).toFixed(0)}M`}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                contentStyle={{
                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                    borderRadius: "12px",
                                    border: "1px solid #e4e4e7",
                                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                    fontSize: "12px",
                                    backdropFilter: "blur(4px)"
                                }}
                                itemStyle={{ fontWeight: 700 }}
                                formatter={(value: any) => formatCurrency(Number(value))}
                            />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                            />
                            <Bar dataKey="Utilized" stackId="a" fill={COLORS.Utilized} radius={[0, 0, 0, 0]} barSize={40} />
                            <Bar dataKey="Obligated" stackId="a" fill={COLORS.Obligated} radius={[0, 0, 0, 0]} />
                            <Bar dataKey="Balance" stackId="a" fill={COLORS.Balance} radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </motion.div>
        </DashboardChartCard>
    );
}