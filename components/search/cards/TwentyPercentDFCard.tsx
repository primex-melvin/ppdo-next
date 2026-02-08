"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, TrendingUp, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface TwentyPercentDFCardData {
  id: string;
  title: string;
  description?: string;
  utilizationRate: number; // 0-100
  allocatedAmount: number;
  utilizedAmount: number;
  barangayCount: number;
  fiscalYear: string;
}

interface TwentyPercentDFCardProps {
  data: TwentyPercentDFCardData;
  onClick?: () => void;
  className?: string;
}

export function TwentyPercentDFCard({ data, onClick, className }: TwentyPercentDFCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/twenty-percent-df/${data.id}`);
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

  // Color-code based on utilization rate
  const getProgressColor = (rate: number) => {
    if (rate >= 80) return "bg-emerald-500";
    if (rate >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getProgressBgColor = (rate: number) => {
    if (rate >= 80) return "bg-emerald-100 dark:bg-emerald-900/30";
    if (rate >= 50) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  return (
    <Card
      className={cn(
        "border-l-4 border-l-emerald-500 transition-all duration-200 cursor-pointer",
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
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full px-2 py-0.5 text-xs">
            20% DF
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

        {/* Fiscal Year */}
        <div className="text-sm mb-3">
          <span className="text-muted-foreground">Fiscal Year: </span>
          <span className="font-medium">{data.fiscalYear}</span>
        </div>

        {/* Utilization Rate Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Utilization Rate</span>
            <span className="font-medium">{data.utilizationRate}%</span>
          </div>
          <div className={cn("w-full rounded-full h-2", getProgressBgColor(data.utilizationRate))}>
            <div
              className={cn("h-2 rounded-full transition-all duration-300", getProgressColor(data.utilizationRate))}
              style={{ width: `${data.utilizationRate}%` }}
            />
          </div>
        </div>

        {/* Allocated vs Utilized Amounts */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Allocated</div>
            <div className="font-semibold text-sm">{formatCurrency(data.allocatedAmount)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Utilized</div>
            <div className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
              {formatCurrency(data.utilizedAmount)}
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5 text-sm">
            <MapPin className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {data.barangayCount} {data.barangayCount === 1 ? "barangay" : "barangays"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <TrendingUp className="size-4 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {data.utilizationRate}% utilized
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
