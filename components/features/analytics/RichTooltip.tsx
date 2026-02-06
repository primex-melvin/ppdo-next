"use client";

import { motion } from "framer-motion";
import { 
  Wallet, 
  Folder, 
  Wrench, 
  CheckCircle, 
  Clock, 
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimeSeriesPoint } from "./EnhancedTimeSeriesChart";
import { cn } from "@/lib/utils";

interface RichTooltipProps {
  data: TimeSeriesPoint;
  activeMetric: string;
  year: number;
  onClose?: () => void;
}

// Utility functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number, total: number) => {
  if (total === 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
};

// Section wrapper component
function TooltipSection({ 
  title, 
  icon: Icon, 
  children, 
  highlight = false,
  delay = 0 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode; 
  highlight?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      className={cn(
        "rounded-lg border p-3 mb-3",
        highlight 
          ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20" 
          : "border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          "p-1.5 rounded-md",
          highlight ? "bg-blue-100 dark:bg-blue-800" : "bg-gray-100 dark:bg-gray-800"
        )}>
          <Icon className={cn("w-4 h-4", highlight ? "text-blue-600 dark:text-blue-300" : "text-gray-600 dark:text-gray-400")} />
        </div>
        <h4 className={cn("font-semibold text-sm", highlight ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100")}>
          {title}
        </h4>
      </div>
      {children}
    </motion.div>
  );
}

// Metric row component
function MetricRow({ 
  label, 
  value, 
  subValue, 
  progress,
  progressColor = "blue"
}: { 
  label: string; 
  value: string; 
  subValue?: string;
  progress?: number;
  progressColor?: "blue" | "green" | "purple" | "amber";
}) {
  const progressColors = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    purple: "bg-violet-500",
    amber: "bg-amber-500",
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <div className="text-right">
          <span className="font-medium text-gray-900 dark:text-gray-100">{value}</span>
          {subValue && (
            <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">({subValue})</span>
          )}
        </div>
      </div>
      {progress !== undefined && (
        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress * 100, 100)}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={cn("h-full rounded-full", progressColors[progressColor])}
          />
        </div>
      )}
    </div>
  );
}

// Status bar component
function StatusBar({ 
  label, 
  count, 
  total, 
  color 
}: { 
  label: string; 
  count: number; 
  total: number; 
  color: "blue" | "green" | "red" | "gray" | "amber";
}) {
  const colors = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    red: "bg-red-500",
    gray: "bg-gray-500",
    amber: "bg-amber-500",
  };

  const dotColors = {
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    red: "bg-red-500",
    gray: "bg-gray-500",
    amber: "bg-amber-500",
  };

  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", dotColors[color])} />
          <span className="text-gray-600 dark:text-gray-400">{label}</span>
        </div>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {count} <span className="text-xs text-gray-500">({percentage.toFixed(0)}%)</span>
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className={cn("h-full rounded-full", colors[color])}
        />
      </div>
    </div>
  );
}

// Stat card component
function StatCard({ 
  label, 
  value, 
  icon: Icon,
  color
}: { 
  label: string; 
  value: number; 
  icon: React.ElementType;
  color: "green" | "amber" | "blue";
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  };

  return (
    <div className={cn("p-3 rounded-lg", colors[color])}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

// Project list item
function ProjectListItem({ project }: { project: TimeSeriesPoint["details"]["projects"][0] }) {
  const statusColors: Record<string, string> = {
    ongoing: "text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/20",
    completed: "text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-900/20",
    delayed: "text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-900/20",
    draft: "text-gray-600 bg-gray-50 dark:text-gray-300 dark:bg-gray-800",
  };

  const status = project.status?.toLowerCase() || 'draft';

  return (
    <div className="flex items-start justify-between py-1.5 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {project.particulars}
        </p>
        {project.implementingOffice && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {project.implementingOffice}
          </p>
        )}
      </div>
      <span className={cn(
        "text-xs px-2 py-0.5 rounded-full capitalize ml-2 flex-shrink-0",
        statusColors[status] || statusColors.draft
      )}>
        {status}
      </span>
    </div>
  );
}

export function RichTooltip({ data, activeMetric, year, onClose }: RichTooltipProps) {
  const { metrics, label, details } = data;

  // Calculate obligation and utilization rates
  const obligationRate = metrics.budget.allocated > 0 
    ? metrics.budget.obligated / metrics.budget.allocated 
    : 0;
  const utilizationRate = metrics.budget.allocated > 0 
    ? metrics.budget.utilized / metrics.budget.allocated 
    : 0;

  return (
    <div 
      className="w-[380px] max-h-[600px] overflow-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-4 z-[9999]"
      onMouseLeave={() => onClose?.()}
    >
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-gray-100 dark:border-gray-800 pb-3 mb-3 flex justify-between items-start"
      >
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {label} {year}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Move mouse out to close
          </p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -mr-2 -mt-2"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </motion.div>

      {/* Financial Summary */}
      <TooltipSection 
        title="Financial Summary" 
        icon={Wallet}
        highlight={activeMetric === 'budget'}
        delay={0.05}
      >
        <div className="space-y-3">
          <MetricRow 
            label="Total Allocated" 
            value={formatCurrency(metrics.budget.allocated)}
          />
          <MetricRow 
            label="Obligated" 
            value={formatCurrency(metrics.budget.obligated)}
            subValue={formatPercent(metrics.budget.obligated, metrics.budget.allocated)}
            progress={obligationRate}
            progressColor="purple"
          />
          <MetricRow 
            label="Utilized" 
            value={formatCurrency(metrics.budget.utilized)}
            subValue={formatPercent(metrics.budget.utilized, metrics.budget.allocated)}
            progress={utilizationRate}
            progressColor="green"
          />
        </div>

        {details.budgetItems.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Top Budget Items ({details.budgetItems.length} total)
            </p>
            <div className="space-y-1">
              {details.budgetItems.slice(0, 3).map((item) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 truncate flex-1">{item.particulars}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 ml-2">
                    {formatCurrency(item.allocated)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </TooltipSection>

      {/* Projects Summary */}
      <TooltipSection 
        title={`Projects (${metrics.projects.total} Total)`}
        icon={Folder}
        highlight={activeMetric === 'projects'}
        delay={0.1}
      >
        {metrics.projects.total > 0 ? (
          <div className="space-y-2">
            <StatusBar 
              label="Ongoing" 
              count={metrics.projects.ongoing}
              total={metrics.projects.total}
              color="blue"
            />
            <StatusBar 
              label="Completed" 
              count={metrics.projects.completed}
              total={metrics.projects.total}
              color="green"
            />
            <StatusBar 
              label="Delayed" 
              count={metrics.projects.delayed}
              total={metrics.projects.total}
              color="red"
            />
            {metrics.projects.draft > 0 && (
              <StatusBar 
                label="Draft" 
                count={metrics.projects.draft}
                total={metrics.projects.total}
                color="gray"
              />
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No projects in this period</p>
        )}

        {details.projects.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Recent Projects
            </p>
            <div className="space-y-1 max-h-[120px] overflow-y-auto">
              {details.projects.slice(0, 5).map((project) => (
                <ProjectListItem key={project._id} project={project} />
              ))}
            </div>
          </div>
        )}
      </TooltipSection>

      {/* Breakdowns Summary */}
      <TooltipSection 
        title={`Breakdowns (${metrics.breakdowns.total} Total)`}
        icon={Wrench}
        highlight={activeMetric === 'breakdowns'}
        delay={0.15}
      >
        {metrics.breakdowns.total > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                label="With Inspections"
                value={metrics.breakdowns.withInspections}
                icon={CheckCircle}
                color="green"
              />
              <StatCard
                label="Pending"
                value={metrics.breakdowns.pending}
                icon={Clock}
                color="amber"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">Total Breakdown Budget</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(metrics.breakdowns.totalBudget)}
              </span>
            </div>

            {metrics.breakdowns.total > 0 && (
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(metrics.breakdowns.withInspections / metrics.breakdowns.total) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="h-full bg-emerald-500"
                />
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(metrics.breakdowns.pending / metrics.breakdowns.total) * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="h-full bg-amber-500"
                />
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No breakdowns in this period</p>
        )}
      </TooltipSection>

      {/* Actions - only close button */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="pt-2 border-t border-gray-100 dark:border-gray-800"
      >
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Click outside or the X button to close
        </p>
      </motion.div>
    </div>
  );
}
