"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, GraduationCap, School, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface SpecialEducationCardData {
  id: string;
  title: string;
  description?: string;
  budgetAllocated: number;
  budgetUtilized: number;
  utilizationRate: number; // 0-100
  schoolYear: string;
  schoolCount: number;
  studentBeneficiaries: number;
  programType?: string;
}

interface SpecialEducationCardProps {
  data: SpecialEducationCardData;
  onClick?: () => void;
  className?: string;
}

export function SpecialEducationCard({ data, onClick, className }: SpecialEducationCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/special-education/${data.id}`);
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
        "border-l-4 border-l-amber-500 transition-all duration-200 cursor-pointer",
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
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-full px-2 py-0.5 text-xs">
            SEF
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

        {/* School Year & Program Type */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-muted-foreground">SY {data.schoolYear}</span>
          {data.programType && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm font-medium">{data.programType}</span>
            </>
          )}
        </div>

        {/* Budget Utilization Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Budget Utilization</span>
            <span className="font-medium">{data.utilizationRate}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
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
            <div className="font-semibold text-sm text-amber-600 dark:text-amber-400">
              {formatCurrency(data.budgetUtilized)}
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <School className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {formatNumber(data.schoolCount)} {data.schoolCount === 1 ? "school" : "schools"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="size-4 text-muted-foreground" />
            <span className="font-medium">{formatNumber(data.studentBeneficiaries)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
