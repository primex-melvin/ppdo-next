"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Wallet, TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface TrustFundCardData {
  id: string;
  title: string;
  description?: string;
  currentBalance: number;
  interestAccrued: number;
  fundType: "General" | "Special Purpose" | "Educational" | "Healthcare" | "Infrastructure";
  lastUpdated: string; // ISO date string
  fiscalYear: string;
}

interface TrustFundCardProps {
  data: TrustFundCardData;
  onClick?: () => void;
  className?: string;
}

const fundTypeColors = {
  General: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "Special Purpose": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  Educational: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  Healthcare: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  Infrastructure: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

export function TrustFundCard({ data, onClick, className }: TrustFundCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/trust-funds/${data.id}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <Card
      className={cn(
        "border-l-4 border-l-purple-500 transition-all duration-200 cursor-pointer",
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
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full px-2 py-0.5 text-xs">
            Trust Fund
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

        {/* Fund Type Badge */}
        <div className="mb-3">
          <Badge className={cn("rounded-full px-2 py-0.5 text-xs", fundTypeColors[data.fundType])}>
            {data.fundType}
          </Badge>
        </div>

        {/* Current Balance - Prominent */}
        <div className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="size-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-muted-foreground">Current Balance</span>
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatCurrency(data.currentBalance)}
          </div>
        </div>

        {/* Interest Accrued */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-muted-foreground">Interest Accrued</span>
          </div>
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(data.interestAccrued)}
          </span>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            <span>FY {data.fiscalYear}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Updated {formatDate(data.lastUpdated)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
