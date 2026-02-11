"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { DashboardChartCard } from "@/components/features/ppdo/dashboard/charts/DashboardChartCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RichTooltip } from "./RichTooltip";
import { PeriodDetailDrawer } from "./PeriodDetailDrawer";
import { DashboardFilters } from "@/hooks/useDashboardFilters";
import { ChevronDown, Wallet, Folder, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface TimeSeriesMetrics {
  budget: {
    allocated: number;
    obligated: number;
    utilized: number;
  };
  projects: {
    total: number;
    ongoing: number;
    completed: number;
    delayed: number;
    draft: number;
  };
  breakdowns: {
    total: number;
    withInspections: number;
    pending: number;
    totalBudget: number;
  };
}

interface TimeSeriesDetails {
  budgetItems: Array<{
    _id: string;
    particulars: string;
    allocated: number;
    obligated: number;
    utilized: number;
  }>;
  projects: Array<{
    _id: string;
    particulars: string;
    status?: string;
    implementingOffice?: string;
    totalBudgetAllocated: number;
  }>;
  breakdowns: Array<{
    _id: string;
    projectId: string;
    description: string;
    hasInspection: boolean;
  }>;
}

export interface TimeSeriesPoint {
  month?: number;
  quarter?: number;
  label: string;
  metrics: TimeSeriesMetrics;
  details: TimeSeriesDetails;
}

interface EnhancedTimeSeriesData {
  monthly: TimeSeriesPoint[];
  quarterly: TimeSeriesPoint[];
}

interface EnhancedTimeSeriesChartProps {
  data?: EnhancedTimeSeriesData;
  year: number;
  filters: DashboardFilters;
}

type ViewTab = 'monthly' | 'quarterly';
type BudgetView = 'obligated' | 'utilized';

// Available metrics configuration
const METRICS_CONFIG = {
  budget: {
    label: 'Budget',
    icon: Wallet,
    color: '#3b82f6',
    lines: [] as Array<{ key: string; name: string; color: string }>,
  },
  projects: {
    label: 'Projects',
    icon: Folder,
    color: '#f59e0b',
    lines: [
      { key: 'projects.total', name: 'Total Projects', color: '#f59e0b' },
      { key: 'projects.ongoing', name: 'Ongoing', color: '#3b82f6' },
      { key: 'projects.completed', name: 'Completed', color: '#10b981' },
      { key: 'projects.delayed', name: 'Delayed', color: '#ef4444' },
    ],
  },
  breakdowns: {
    label: 'Breakdowns',
    icon: Wrench,
    color: '#8b5cf6',
    lines: [
      { key: 'breakdowns.total', name: 'Total Breakdowns', color: '#8b5cf6' },
      { key: 'breakdowns.withInspections', name: 'With Inspections', color: '#10b981' },
      { key: 'breakdowns.pending', name: 'Pending', color: '#f59e0b' },
    ],
  },
};

const formatCurrency = (value: number) => {
  if (value >= 1000000000) {
    return `₱${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `₱${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `₱${(value / 1000).toFixed(0)}k`;
  }
  return `₱${value}`;
};

export function EnhancedTimeSeriesChart({
  data,
  year,
  filters,
}: EnhancedTimeSeriesChartProps) {
  // State for selected metrics (multi-select) - default to budget only
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['budget']);
  const [activeView, setActiveView] = useState<ViewTab>('monthly');
  const [budgetView, setBudgetView] = useState<BudgetView>('utilized');
  const [selectedPeriod, setSelectedPeriod] = useState<TimeSeriesPoint | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Tooltip lock state
  const [lockedTooltip, setLockedTooltip] = useState<{ point: TimeSeriesPoint; visible: boolean } | null>(null);
  const pendingTooltipPoint = useRef<TimeSeriesPoint | null>(null);

  // Fallback data if not provided
  const safeData = data || {
    monthly: Array(12).fill(0).map((_, i) => ({
      month: i + 1,
      label: new Date(2024, i).toLocaleString("default", { month: "short" }),
      metrics: {
        budget: { allocated: 0, obligated: 0, utilized: 0 },
        projects: { total: 0, ongoing: 0, completed: 0, delayed: 0, draft: 0 },
        breakdowns: { total: 0, withInspections: 0, pending: 0, totalBudget: 0 },
      },
      details: { budgetItems: [], projects: [], breakdowns: [] },
    })),
    quarterly: Array(4).fill(0).map((_, i) => ({
      quarter: i + 1,
      label: `Q${i + 1}`,
      metrics: {
        budget: { allocated: 0, obligated: 0, utilized: 0 },
        projects: { total: 0, ongoing: 0, completed: 0, delayed: 0, draft: 0 },
        breakdowns: { total: 0, withInspections: 0, pending: 0, totalBudget: 0 },
      },
      details: { budgetItems: [], projects: [], breakdowns: [] },
    })),
  };

  // Calculate total allocated budget across all periods
  const totalAllocatedBudget = useMemo(() => {
    return safeData[activeView].reduce((sum, point) => 
      sum + point.metrics.budget.allocated, 0
    );
  }, [safeData, activeView]);

  // Toggle metric selection
  const toggleMetric = (metricKey: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricKey)
        ? prev.filter(m => m !== metricKey)
        : [...prev, metricKey]
    );
    setLockedTooltip(null);
  };

  // Handle tooltip close
  const handleTooltipClose = () => {
    setLockedTooltip(null);
  };

  // Chart configuration
  const chartConfig = useMemo(() => {
    const lines: Array<{ key: string; name: string; color: string; yAxisId?: string }> = [];
    let hasBudget = false;
    let hasCount = false;

    selectedMetrics.forEach(metricKey => {
      const config = METRICS_CONFIG[metricKey as keyof typeof METRICS_CONFIG];
      if (config) {
        if (metricKey === 'budget') {
          hasBudget = true;
          // Only show the selected budget view (obligated or utilized)
          const budgetLine = budgetView === 'obligated' 
            ? { key: 'budget.obligated', name: 'Obligated', color: '#8b5cf6' }
            : { key: 'budget.utilized', name: 'Utilized', color: '#10b981' };
          lines.push({ ...budgetLine, yAxisId: 'left' });
        } else {
          hasCount = true;
          if (selectedMetrics.length === 1) {
            config.lines?.forEach(line => {
              lines.push({ ...line, yAxisId: 'right' });
            });
          } else {
            const summaryLine = config.lines?.[0];
            if (summaryLine) lines.push({ ...summaryLine, yAxisId: 'right' });
          }
        }
      }
    });

    return {
      lines,
      hasBudget,
      hasCount,
    };
  }, [selectedMetrics, budgetView]);

  // Transform data for recharts
  const chartData = useMemo(() => {
    return safeData[activeView].map(point => ({
      label: point.label,
      'budget.allocated': point.metrics.budget.allocated,
      'budget.obligated': point.metrics.budget.obligated,
      'budget.utilized': point.metrics.budget.utilized,
      'projects.total': point.metrics.projects.total,
      'projects.ongoing': point.metrics.projects.ongoing,
      'projects.completed': point.metrics.projects.completed,
      'projects.delayed': point.metrics.projects.delayed,
      'projects.draft': point.metrics.projects.draft,
      'breakdowns.total': point.metrics.breakdowns.total,
      'breakdowns.withInspections': point.metrics.breakdowns.withInspections,
      'breakdowns.pending': point.metrics.breakdowns.pending,
      _raw: point,
    }));
  }, [safeData, activeView]);

  // Handle tooltip locking via useEffect to avoid setState during render
  useEffect(() => {
    if (pendingTooltipPoint.current && !lockedTooltip) {
      setLockedTooltip({ point: pendingTooltipPoint.current, visible: true });
      pendingTooltipPoint.current = null;
    }
  }, [lockedTooltip]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    // Show locked tooltip if exists
    if (lockedTooltip?.visible) {
      return (
        <div className="relative" style={{ zIndex: 9999, position: 'relative', pointerEvents: 'auto' }}>
          <RichTooltip
            data={lockedTooltip.point}
            activeMetric={selectedMetrics.length > 1 ? 'unified' : selectedMetrics[0] as any}
            year={year}
            onClose={handleTooltipClose}
          />
        </div>
      );
    }
    
    // Queue tooltip to be locked (don't setState during render)
    if (active && payload && payload.length > 0) {
      const point = payload[0].payload._raw as TimeSeriesPoint;
      if (!lockedTooltip && !pendingTooltipPoint.current) {
        pendingTooltipPoint.current = point;
      }
      
      // Return tooltip without locking (will lock via useEffect)
      return (
        <div className="relative" style={{ zIndex: 9999, position: 'relative', pointerEvents: 'auto' }}>
          <RichTooltip
            data={point}
            activeMetric={selectedMetrics.length > 1 ? 'unified' : selectedMetrics[0] as any}
            year={year}
            onClose={handleTooltipClose}
          />
        </div>
      );
    }
    return null;
  };

  // Get display text for selected metrics
  const getSelectedMetricsText = () => {
    if (selectedMetrics.length === 0) return 'Select metrics';
    if (selectedMetrics.length === 1) {
      return METRICS_CONFIG[selectedMetrics[0] as keyof typeof METRICS_CONFIG]?.label || 'Select metrics';
    }
    if (selectedMetrics.length === Object.keys(METRICS_CONFIG).length) {
      return 'All Metrics';
    }
    return `${selectedMetrics.length} Selected`;
  };

  return (
    <>
      <DashboardChartCard
        title="Performance Over Time"
        subtitle="Track budget, projects, and breakdowns"
        className="flex flex-col"
      >
        {/* Total Allocated Budget Label */}
        {selectedMetrics.includes('budget') && totalAllocatedBudget > 0 && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Total Allocated Budget
              </span>
              <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(totalAllocatedBudget)}
              </span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4 justify-between">
          {/* Metric Selector Dropdown */}
          <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto justify-between min-w-[180px]"
              >
                <span className="flex items-center gap-2">
                  {selectedMetrics.length > 0 ? (
                    <span className="flex -space-x-1">
                      {selectedMetrics.slice(0, 3).map((metric, i) => {
                        const Icon = METRICS_CONFIG[metric as keyof typeof METRICS_CONFIG]?.icon;
                        return Icon ? (
                          <span 
                            key={metric} 
                            className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs border-2 border-background"
                            style={{ zIndex: 10 - i }}
                          >
                            <Icon className="w-3 h-3" />
                          </span>
                        ) : null;
                      })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Select metrics</span>
                  )}
                  <span className="font-medium">{getSelectedMetricsText()}</span>
                </span>
                <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-3" align="start">
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground pb-2 border-b">
                  Show on chart
                </div>
                {Object.entries(METRICS_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = selectedMetrics.includes(key);
                  return (
                    <div key={key} className="flex items-center space-x-3">
                      <Checkbox
                        id={`metric-${key}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleMetric(key)}
                      />
                      <Label
                        htmlFor={`metric-${key}`}
                        className={cn(
                          "flex items-center gap-2 flex-1 cursor-pointer text-sm",
                          isSelected ? "font-medium" : "text-muted-foreground"
                        )}
                      >
                        <span 
                          className="w-6 h-6 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: `${config.color}20`, color: config.color }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        {config.label}
                      </Label>
                    </div>
                  );
                })}
                
                {selectedMetrics.length > 0 && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground"
                      onClick={() => setSelectedMetrics([])}
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* View Tabs */}
          <Tabs value={activeView} onValueChange={(v: any) => {
            setActiveView(v);
            handleTooltipClose();
          }}>
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Chart */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedMetrics.join('-')}-${activeView}-${budgetView}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-[300px] w-full relative"
            style={{ zIndex: 10 }}
          >
            <div className="absolute inset-0" style={{ overflow: 'visible', zIndex: 10 }}>
              <ResponsiveContainer width="100%" height="100%" className="[&_.recharts-wrapper]:!overflow-visible">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  {/* Budget Y-axis - scaled to total allocated */}
                  {chartConfig.hasBudget && (
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      tickFormatter={(v) => formatCurrency(v)}
                      width={70}
                      domain={[0, totalAllocatedBudget > 0 ? totalAllocatedBudget : 'auto']}
                    />
                  )}
                  {/* Count Y-axis */}
                  {chartConfig.hasCount && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      width={40}
                    />
                  )}
                  {/* Reference line for total allocated budget */}
                  {selectedMetrics.includes('budget') && totalAllocatedBudget > 0 && (
                    <ReferenceLine
                      y={totalAllocatedBudget}
                      yAxisId="left"
                      stroke="#3b82f6"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{
                        value: `Total: ${formatCurrency(totalAllocatedBudget)}`,
                        position: 'top',
                        fill: '#3b82f6',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                  <RechartsTooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
                    wrapperStyle={{ zIndex: 9999, outline: 'none' }}
                  />
                  <Legend />
                  {chartConfig.lines.map((line) => (
                    <Line
                      key={line.key}
                      type="monotone"
                      dataKey={line.key}
                      name={line.name}
                      stroke={line.color}
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                      activeDot={{ r: 6, onClick: () => {
                        const point = chartData.find((d: any) => d[line.key] !== undefined)?._raw;
                        if (point) {
                          setSelectedPeriod(point);
                          handleTooltipClose();
                        }
                      }}}
                      yAxisId={line.yAxisId || 'left'}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Budget View Radio Buttons - Only show when budget is selected */}
        {selectedMetrics.includes('budget') && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-center gap-6">
              <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
              <RadioGroup 
                value={budgetView} 
                onValueChange={(v: BudgetView) => {
                  setBudgetView(v);
                  handleTooltipClose();
                }}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="utilized" id="utilized" />
                  <Label 
                    htmlFor="utilized" 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-3 h-3 rounded-full bg-[#10b981]" />
                    <span className="text-sm">Utilized Budget</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="obligated" id="obligated" />
                  <Label 
                    htmlFor="obligated" 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
                    <span className="text-sm">Obligated Budget</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}
      </DashboardChartCard>

      {/* Detail Drawer */}
      <PeriodDetailDrawer
        open={!!selectedPeriod}
        onClose={() => {
          setSelectedPeriod(null);
          handleTooltipClose();
        }}
        data={selectedPeriod}
        year={year}
      />
    </>
  );
}