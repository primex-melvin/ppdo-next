"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Folder, 
  Wrench, 
  LayoutDashboard,
  Search,
  ExternalLink,
  ArrowUpRight,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText
} from "lucide-react";
import { TimeSeriesPoint } from "./EnhancedTimeSeriesChart";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PeriodDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  data: TimeSeriesPoint | null;
  year: number;
}

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

// Overview Tab Component
function OverviewTab({ data, year }: { data: TimeSeriesPoint; year: number }) {
  const { metrics, label } = data;
  
  return (
    <div className="space-y-6 py-4">
      {/* Period Summary Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">
          {label} {year} Summary
        </h3>
        <p className="text-sm text-blue-600 dark:text-blue-300">
          Complete overview of all activities
        </p>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {formatCurrency(metrics.budget.allocated)}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Total Budget</div>
          </div>
          <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
              {metrics.projects.total}
            </div>
            <div className="text-xs text-indigo-600 dark:text-indigo-400">Projects</div>
          </div>
          <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
              {metrics.breakdowns.total}
            </div>
            <div className="text-xs text-violet-600 dark:text-violet-400">Breakdowns</div>
          </div>
        </div>
      </div>

      {/* Financial Progress */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Financial Progress
        </h4>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Obligation Rate</span>
            <span className="font-medium">
              {formatPercent(metrics.budget.obligated, metrics.budget.allocated)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((metrics.budget.obligated / metrics.budget.allocated) * 100, 100)}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-violet-500 rounded-full"
            />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Utilization Rate</span>
            <span className="font-medium">
              {formatPercent(metrics.budget.utilized, metrics.budget.allocated)}
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((metrics.budget.utilized / metrics.budget.allocated) * 100, 100)}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Project Status Distribution */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Folder className="w-4 h-4" />
          Project Status Distribution
        </h4>
        
        {metrics.projects.total > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            <StatusCard label="Ongoing" count={metrics.projects.ongoing} total={metrics.projects.total} color="blue" />
            <StatusCard label="Completed" count={metrics.projects.completed} total={metrics.projects.total} color="green" />
            <StatusCard label="Delayed" count={metrics.projects.delayed} total={metrics.projects.total} color="red" />
            <StatusCard label="Draft" count={metrics.projects.draft} total={metrics.projects.total} color="gray" />
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No projects in this period</p>
        )}
      </div>

      {/* Breakdown Status */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Breakdown Status
        </h4>
        
        {metrics.breakdowns.total > 0 ? (
          <div className="flex gap-4">
            <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {metrics.breakdowns.withInspections}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400">With Inspections</div>
            </div>
            <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {metrics.breakdowns.pending}
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400">Pending</div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No breakdowns in this period</p>
        )}
      </div>
    </div>
  );
}

function StatusCard({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300",
    green: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300",
    red: "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
    gray: "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300",
  };

  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className={cn("border rounded-lg p-3", colors[color])}>
      <div className="text-lg font-bold">{count}</div>
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-xs mt-1 opacity-60">{percentage.toFixed(1)}%</div>
    </div>
  );
}

// Budget Detail Tab
function BudgetDetailTab({ items }: { items: TimeSeriesPoint["details"]["budgetItems"] }) {
  const [search, setSearch] = useState("");
  
  const filtered = items.filter(item => 
    item.particulars.toLowerCase().includes(search.toLowerCase())
  );

  const totalAllocated = items.reduce((sum, item) => sum + item.allocated, 0);
  const totalObligated = items.reduce((sum, item) => sum + item.obligated, 0);
  const totalUtilized = items.reduce((sum, item) => sum + item.utilized, 0);
  const avgUtilization = totalAllocated > 0 ? (totalUtilized / totalAllocated) * 100 : 0;

  return (
    <div className="space-y-4 py-4">
      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalAllocated)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
          </div>
          <div>
            <div className="text-lg font-bold text-violet-600 dark:text-violet-400">
              {formatCurrency(totalObligated)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Obligated</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {avgUtilization.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Avg Utilization</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search budget items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No budget items found</p>
        ) : (
          filtered.map((item) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-gray-900 dark:text-gray-100">{item.particulars}</h5>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(item.allocated)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Obligated</span>
                  <span className={cn(
                    item.obligated > 0 ? "text-violet-600 dark:text-violet-400" : "text-gray-400"
                  )}>
                    {formatCurrency(item.obligated)} ({formatPercent(item.obligated, item.allocated)})
                  </span>
                </div>
                <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet-500 rounded-full"
                    style={{ width: `${Math.min((item.obligated / item.allocated) * 100, 100)}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Utilized</span>
                  <span className={cn(
                    item.utilized > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"
                  )}>
                    {formatCurrency(item.utilized)} ({formatPercent(item.utilized, item.allocated)})
                  </span>
                </div>
                <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min((item.utilized / item.allocated) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// Projects Detail Tab
function ProjectsDetailTab({ projects }: { projects: TimeSeriesPoint["details"]["projects"] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = projects.filter(project => {
    const matchesSearch = project.particulars.toLowerCase().includes(search.toLowerCase()) ||
                         project.implementingOffice?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || project.status?.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    all: projects.length,
    ongoing: projects.filter(p => p.status?.toLowerCase() === 'ongoing').length,
    completed: projects.filter(p => p.status?.toLowerCase() === 'completed').length,
    delayed: projects.filter(p => p.status?.toLowerCase() === 'delayed').length,
    draft: projects.filter(p => p.status?.toLowerCase() === 'draft').length,
  };

  return (
    <div className="space-y-4 py-4">
      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all" className="text-xs">All ({statusCounts.all})</TabsTrigger>
          <TabsTrigger value="ongoing" className="text-xs">Ongoing</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">Done</TabsTrigger>
          <TabsTrigger value="delayed" className="text-xs">Delayed</TabsTrigger>
          <TabsTrigger value="draft" className="text-xs">Draft</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <div className="space-y-2 max-h-[450px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No projects found</p>
        ) : (
          filtered.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: TimeSeriesPoint["details"]["projects"][0] }) {
  const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    ongoing: { label: "Ongoing", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", icon: Clock },
    completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle },
    delayed: { label: "Delayed", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300", icon: AlertCircle },
    draft: { label: "Draft", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: FileText },
  };

  const status = project.status?.toLowerCase() || 'draft';
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-gray-900 dark:text-gray-100 truncate">{project.particulars}</h5>
          {project.implementingOffice && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{project.implementingOffice}</p>
          )}
        </div>
        <Badge className={cn("ml-2 flex-shrink-0", config.color)}>
          <Icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
      </div>
      
      <div className="flex justify-between items-center mt-3">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Budget: <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(project.totalBudgetAllocated)}</span>
        </span>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          <ExternalLink className="w-3 h-3 mr-1" />
          View
        </Button>
      </div>
    </motion.div>
  );
}

// Breakdowns Detail Tab
function BreakdownsDetailTab({ breakdowns }: { breakdowns: TimeSeriesPoint["details"]["breakdowns"] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "with-inspections" | "pending">("all");

  const filtered = breakdowns.filter(breakdown => {
    const matchesSearch = breakdown.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || 
      (filter === "with-inspections" && breakdown.hasInspection) ||
      (filter === "pending" && !breakdown.hasInspection);
    return matchesSearch && matchesFilter;
  });

  const withInspections = breakdowns.filter(b => b.hasInspection).length;
  const pending = breakdowns.filter(b => !b.hasInspection).length;

  return (
    <div className="space-y-4 py-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "p-3 rounded-lg border text-center transition-colors",
            filter === "all" 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
              : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
          )}
        >
          <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{breakdowns.length}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
        </button>
        <button
          onClick={() => setFilter("with-inspections")}
          className={cn(
            "p-3 rounded-lg border text-center transition-colors",
            filter === "with-inspections" 
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
              : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
          )}
        >
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{withInspections}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">With Inspections</div>
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={cn(
            "p-3 rounded-lg border text-center transition-colors",
            filter === "pending" 
              ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" 
              : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
          )}
        >
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{pending}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search breakdowns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No breakdowns found</p>
        ) : (
          filtered.map((breakdown) => (
            <motion.div
              key={breakdown._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{breakdown.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Project ID: {breakdown.projectId.slice(0, 8)}...
                  </p>
                </div>
                <Badge 
                  className={cn(
                    "ml-2 flex-shrink-0",
                    breakdown.hasInspection
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  )}
                >
                  {breakdown.hasInspection ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Inspected</>
                  ) : (
                    <><Clock className="w-3 h-3 mr-1" /> Pending</>
                  )}
                </Badge>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export function PeriodDetailDrawer({ open, onClose, data, year }: PeriodDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'projects' | 'breakdowns'>('overview');

  if (!data) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" />
            {data.label} {year} Details
          </SheetTitle>
          <SheetDescription>
            Complete breakdown of all activity for this period
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="mt-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="budget" className="text-xs sm:text-sm">
              Budget
            </TabsTrigger>
            <TabsTrigger value="projects" className="text-xs sm:text-sm">
              Projects
            </TabsTrigger>
            <TabsTrigger value="breakdowns" className="text-xs sm:text-sm">
              Breakdowns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab data={data} year={year} />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetDetailTab items={data.details.budgetItems} />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsDetailTab projects={data.details.projects} />
          </TabsContent>

          <TabsContent value="breakdowns">
            <BreakdownsDetailTab breakdowns={data.details.breakdowns} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
