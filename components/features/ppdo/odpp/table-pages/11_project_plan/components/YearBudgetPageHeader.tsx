// app/dashboard/project/[year]/components/YearBudgetPageHeader.tsx

"use client";

import { Calendar, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityLogSheet } from "@/components/shared/activity/ActivityLogSheet";
import { PageHeaderWithIcon } from "@/components/features/ppdo/odpp/utilities/shared";

interface YearBudgetPageHeaderProps {
  year: number;
  showDetails: boolean;
  onToggleDetails: () => void;
}

export function YearBudgetPageHeader({
  year,
  showDetails,
  onToggleDetails
}: YearBudgetPageHeaderProps) {
  return (
    <PageHeaderWithIcon
      icon={Calendar}
      iconBgClass="bg-amber-100 dark:bg-amber-900/30"
      iconTextClass="text-amber-700 dark:text-amber-300"
      title={`Budget Tracking ${year}`}
      description={`Monitor budget allocation, utilization, and project status for year ${year}`}
      actionButton={
        <div className="flex items-center gap-2">
          <Button
            onClick={onToggleDetails}
            variant="outline"
            size="sm"
            className="gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {showDetails ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span className="hidden sm:inline">Hide Statistics</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Show Statistics</span>
              </>
            )}
          </Button>

          <ActivityLogSheet
            type="budgetItem"
            title={`Budget History ${year}`}
          />
        </div>
      }
    />
  );
}

export default YearBudgetPageHeader;