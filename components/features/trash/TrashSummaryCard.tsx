import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import * as React from "react";

interface TrashSummaryCardProps {
  title: string;
  icon: React.ReactNode;
  counts: Array<{
    label: string;
    value: number;
    color?: "default" | "amber" | "red" | "green";
  }>;
  financials?: {
    allocated: number;
    utilized: number;
    obligated?: number;
  };
  variant?: "trash" | "restore";
}

const formatCurrency = (amount: number) => {
  return `₱${amount.toLocaleString("en-PH")}`;
};

const getCountColorClass = (color?: "default" | "amber" | "red" | "green") => {
  switch (color) {
    case "amber":
      return "text-amber-600 dark:text-amber-400";
    case "red":
      return "text-red-600 dark:text-red-400";
    case "green":
      return "text-green-600 dark:text-green-400";
    default:
      return "text-foreground";
  }
};

export function TrashSummaryCard({
  title,
  icon,
  counts,
  financials,
  variant = "trash",
}: TrashSummaryCardProps) {
  const iconBgColor =
    variant === "trash"
      ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
      : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              iconBgColor
            )}
          >
            {icon}
          </div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Items Column */}
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="text-base">📊</span>
              ITEMS
            </h4>
            <ul className="space-y-2">
              {counts.map((count, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{count.label}</span>
                  <span
                    className={cn(
                      "font-semibold",
                      getCountColorClass(count.color)
                    )}
                  >
                    {count.value.toLocaleString("en-PH")}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Financial Column */}
          {financials && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="text-base">💰</span>
                FINANCIAL
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Allocated:</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(financials.allocated)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Utilized:</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(financials.utilized)}
                  </p>
                </div>
                {typeof financials.obligated === "number" && (
                  <div>
                    <p className="text-sm text-muted-foreground">Obligated:</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(financials.obligated)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TrashSummaryCard;
