"use client";

import { Wallet, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityLogSheet } from "@/components/shared/activity/ActivityLogSheet";
import { PageHeaderWithIcon } from "@/components/features/ppdo/odpp/utilities/shared";

interface FundsPageHeaderProps {
  year: number;
  showDetails: boolean;
  onToggleDetails: () => void;
  pageTitle: string;
  pageDescription?: string;
  activityLogType: "trustFund" | "specialEducationFund" | "specialHealthFund" | "twentyPercentDF";
  iconBgClass?: string;
  iconTextClass?: string;
}

export function FundsPageHeader({
  year,
  showDetails,
  onToggleDetails,
  pageTitle,
  pageDescription = "Monitor fund allocation, utilization, and project status",
  activityLogType,
  iconBgClass = "bg-emerald-100 dark:bg-emerald-900/30",
  iconTextClass = "text-emerald-700 dark:text-emerald-300",
}: FundsPageHeaderProps) {
  return (
    <PageHeaderWithIcon
      icon={Wallet}
      iconBgClass={iconBgClass}
      iconTextClass={iconTextClass}
      title={`${pageTitle} ${year}`}
      description={`${pageDescription} for year ${year}`}
      actionButton={
        <div className="flex items-center gap-2">
          {/* Show Details Toggle Button */}
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

          {/* Activity Log Button */}
          <ActivityLogSheet
            type={activityLogType}
            entityId="all"
            title={`${pageTitle} Activity Log - ${year}`}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <span className="hidden sm:inline">Activity Log</span>
              </Button>
            }
          />
        </div>
      }
    />
  );
}

export default FundsPageHeader;