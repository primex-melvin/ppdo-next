// app/dashboard/trust-funds/components/TrustFundStatistics.tsx

import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface TrustFundStatisticsProps {
  totalReceived: number;
  totalUtilized: number;
  totalBalance: number;
  totalProjects: number;
}

export default function TrustFundStatistics({
  totalReceived,
  totalUtilized,
  totalBalance,
  totalProjects,
}: TrustFundStatisticsProps) {
  const currency = useMemo(
    () =>
      new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
      }),
    []
  );

  const utilizationRate = useMemo(() => {
    if (totalReceived === 0) return 0;
    return ((totalUtilized / totalReceived) * 100).toFixed(2);
  }, [totalReceived, totalUtilized]);

  return (
    <section
      aria-label="Trust fund statistics"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 no-print"
    >
      <StatCard
        label="Total Trust Funds Received"
        value={currency.format(totalReceived)}
        trend={null}
      />

      <StatCard
        label="Total Trust Funds Utilized"
        value={currency.format(totalUtilized)}
        trend={null}
      />

      <StatCard
        label="Total Available Balance"
        value={currency.format(totalBalance)}
        trend={null}
      />

      <StatCard
        label="Total Projects"
        value={totalProjects.toLocaleString()}
        trend={null}
      />

      <StatCard
        label="Average Utilization Rate"
        value={`${utilizationRate}%`}
        trend={null}
        className="sm:col-span-2 lg:col-span-4"
      />
    </section>
  );
}

const StatCard = React.memo(function StatCard({
  label,
  value,
  trend,
  className = "",
}: {
  label: string;
  value: string;
  trend?: string | null;
  className?: string;
}) {
  return (
    <Card role="group" aria-label={label} className={`h-full ${className}`}>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <p
            className="text-2xl font-bold text-zinc-900 dark:text-zinc-100"
            aria-live="polite"
          >
            {value}
          </p>
          {trend && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {trend}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
});