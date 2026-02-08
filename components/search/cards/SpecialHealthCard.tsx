"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Heart, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface SpecialHealthCardData {
  id: string;
  title: string;
  description?: string;
  budgetAllocated: number;
  budgetUtilized: number;
  utilizationRate: number; // 0-100
  healthCategory: "Primary Care" | "Emergency Services" | "Medical Equipment" | "Infrastructure" | "Programs";
  facilityCount: number;
  patientCount: number;
  fiscalYear: string;
}

interface SpecialHealthCardProps {
  data: SpecialHealthCardData;
  onClick?: () => void;
  className?: string;
}

const healthCategoryColors = {
  "Primary Care": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  "Emergency Services": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "Medical Equipment": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Infrastructure: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  Programs: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
};

export function SpecialHealthCard({ data, onClick, className }: SpecialHealthCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/special-health/${data.id}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <Card
      className={cn(
        "border-l-4 border-l-rose-500 transition-all duration-200 cursor-pointer",
        "hover:shadow-lg hover:-translate-y-0.5",
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        {/* Header with Badge and Arrow Icon */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 rounded-full px-2 py-0.5 text-xs">
            SHF
          </Badge>
          {isHovered && (
            <ArrowUpRight className="size-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base mb-1 line-clamp-2">
          {data.title}
        </h3>

        {/* Description */}
        {data.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {data.description}
          </p>
        )}

        {/* Health Category Badge */}
        <div className="mb-3">
          <Badge className={cn("rounded-full px-2 py-0.5 text-xs", healthCategoryColors[data.healthCategory])}>
            {data.healthCategory}
          </Badge>
        </div>

        {/* Fund Utilization Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Fund Utilization</span>
            <span className="font-medium">{data.utilizationRate}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-rose-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${data.utilizationRate}%` }}
            />
          </div>
        </div>

        {/* Budget Amounts */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Allocated</div>
            <div className="font-semibold text-sm">{formatCurrency(data.budgetAllocated)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Utilized</div>
            <div className="font-semibold text-sm text-rose-600 dark:text-rose-400">
              {formatCurrency(data.budgetUtilized)}
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5 text-sm">
            <Building2 className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatNumber(data.facilityCount)} {data.facilityCount === 1 ? "facility" : "facilities"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="size-4 text-muted-foreground" />
            <span className="font-medium">{formatNumber(data.patientCount)} patients</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
