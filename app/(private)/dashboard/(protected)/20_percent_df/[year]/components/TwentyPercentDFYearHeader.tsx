"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Calendar, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityLogSheet } from "@/components/ActivityLogSheet";

// Define the activity log type - must match ActivityLogType from ActivityLogSheet
type ActivityLogType =
  | "budgetItem"
  | "project"
  | "breakdown"
  | "trustFund"
  | "specialEducationFund"
  | "specialHealthFund"
  | "twentyPercentDF";

interface TwentyPercentDFYearHeaderProps {
  year: number;
  pageTitle?: string;
  pageDescription?: string;
  showDetails: boolean;
  onToggleDetails: () => void;

  activityLogType: ActivityLogType;
}

export function TwentyPercentDFYearHeader({
  year,
  pageTitle = "20% Development Fund",
  pageDescription = "Manage 20% development fund allocations and utilization",
  showDetails,
  onToggleDetails,

  activityLogType,
}: TwentyPercentDFYearHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6 no-print">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/20_percent_df")}
        className="mb-4 -ml-2"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to 20% Development Fund
      </Button>

      {/* Title Section */}
      <div className="flex items-center justify-between gap-4 mb-1">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Calendar className="w-6 h-6 text-amber-700 dark:text-amber-300" />
          </div>
          <div>
            <h1
              className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {pageTitle} {year}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {pageDescription}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleDetails}
            className="gap-2"
          >
            {showDetails ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Details
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show Details
              </>
            )}
          </Button>



          <ActivityLogSheet
            type={activityLogType}
            entityId="all"
            title={`${pageTitle} History ${year}`}
          />
        </div>
      </div>
    </div>
  );
}