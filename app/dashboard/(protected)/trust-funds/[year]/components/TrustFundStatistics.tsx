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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 no-print"
    >
      <StatCard
        label="Total Trust Funds Received"
        value={currency.format(totalReceived)}
      />

      <StatCard
        label="Total Trust Funds Utilized"
        value={currency.format(totalUtilized)}
      />

      <StatCard
        label="Total Available Balance"
        value={currency.format(totalBalance)}
      />

      <StatCard
        label="Total Projects"
        value={totalProjects.toLocaleString()}
      />

      <StatCard
        label="Average Utilization Rate"
        value={`${utilizationRate}%`}
      />
    </section>
  );
}

const StatCard = React.memo(function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Card role="group" aria-label={label} className="h-full">
      <CardContent className="p-6">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
          {label}
        </p>
        <p
          className="text-2xl font-bold text-zinc-900 dark:text-zinc-100"
          aria-live="polite"
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
});