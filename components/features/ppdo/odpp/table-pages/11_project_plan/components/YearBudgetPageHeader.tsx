// app/dashboard/project/[year]/components/YearBudgetPageHeader.tsx

"use client";

import { Calendar } from "lucide-react";
import { ActivityLogSheet } from "@/components/shared/activity/ActivityLogSheet";
import { PageHeaderWithIcon } from "@/components/features/ppdo/odpp/utilities/shared";

interface YearBudgetPageHeaderProps {
  year: number;
}

export function YearBudgetPageHeader({ year }: YearBudgetPageHeaderProps) {
  return (
    <PageHeaderWithIcon
      icon={Calendar}
      iconBgClass="bg-amber-100 dark:bg-amber-900/30"
      iconTextClass="text-amber-700 dark:text-amber-300"
      title={`Budget Tracking ${year}`}
      description={`Monitor budget allocation, utilization, and project status for year ${year}`}
      actionButton={
        <ActivityLogSheet
          type="budgetItem"
          title={`Budget History ${year}`}
        />
      }
    />
  );
}

export default YearBudgetPageHeader;