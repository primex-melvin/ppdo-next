interface BudgetStatisticsProps {
  totalAllocated: number;
  totalUtilized: number;
  averageUtilizationRate: number;
  totalProjects: number;
}

export function BudgetStatistics({
  totalAllocated,
  totalUtilized,
  averageUtilizationRate,
  totalProjects,
}: BudgetStatisticsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 no-print">
      <StatCard
        label="Total Budget Allocated"
        value={`₱${totalAllocated.toLocaleString()}`}
      />
      <StatCard
        label="Total Budget Utilized"
        value={`₱${totalUtilized.toLocaleString()}`}
      />
      <StatCard
        label="Average Utilization Rate"
        value={`${averageUtilizationRate.toFixed(1)}%`}
      />
      <StatCard label="Total Particulars" value={totalProjects.toString()} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
        {label}
      </p>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}
