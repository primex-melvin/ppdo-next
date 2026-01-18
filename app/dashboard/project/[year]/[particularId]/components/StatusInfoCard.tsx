// app/dashboard/project/budget/[particularId]/components/StatusInfoCard.tsx

import { getStatusColorClass } from "../../../../../../types/types";

interface StatusInfoCardProps {
  budgetStatus?: string;
  totalProjects: number;
  projectCompleted: number;
  projectDelayed: number;
  projectsOnTrack: number;
  totalBreakdowns: number;
}

export function StatusInfoCard({
  budgetStatus = "ongoing",
  totalProjects,
  projectCompleted,
  projectDelayed,
  projectsOnTrack,
  totalBreakdowns,
}: StatusInfoCardProps) {
  const getStatusRule = () => {
    if (projectsOnTrack > 0) return "Ongoing (has ongoing projects)";
    if (projectDelayed > 0) return "Delayed (has delayed projects)";
    return "Completed (all projects completed)";
  };

  return (
    <div className="mb-6 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6 no-print">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Status Information
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Budget Status
          </div>
          <div className={`text-2xl font-bold ${getStatusColorClass(budgetStatus as any)}`}>
            {budgetStatus.toUpperCase()}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Auto-calculated from projects
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Total Projects
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {totalProjects}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            {projectCompleted}C • {projectDelayed}D • {projectsOnTrack}O
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Total Breakdowns
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {totalBreakdowns}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Across all projects
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
            Status Rule
          </div>
          <div className="text-sm text-zinc-700 dark:text-zinc-300">
            {getStatusRule()}
          </div>
        </div>
      </div>
    </div>
  );
}
