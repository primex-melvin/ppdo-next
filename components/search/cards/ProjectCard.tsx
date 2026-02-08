"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Users, MapPin, Calendar, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface ProjectCardData {
  id: string;
  title: string;
  description?: string;
  status: "Planning" | "Ongoing" | "Completed" | "On Hold" | "Cancelled";
  department: string;
  fiscalYear: string;
  location: string;
  completionRate: number; // 0-100
  beneficiaryCount: number;
  totalCost: number;
}

interface ProjectCardProps {
  data: ProjectCardData;
  onClick?: () => void;
  className?: string;
}

const statusColors = {
  Planning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  Ongoing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "On Hold": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

export function ProjectCard({ data, onClick, className }: ProjectCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/projects/${data.id}`);
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
        "border-l-4 border-l-blue-500 transition-all duration-200 cursor-pointer",
        "hover:shadow-lg hover:-translate-y-0.5",
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        {/* Header with Status Badge and Arrow Icon */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge className={cn("rounded-full px-2 py-0.5 text-xs", statusColors[data.status])}>
            {data.status}
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

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="size-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate text-muted-foreground">{data.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="size-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate text-muted-foreground">FY {data.fiscalYear}</span>
          </div>
        </div>

        {/* Department */}
        <div className="text-sm mb-3">
          <span className="text-muted-foreground">Department: </span>
          <span className="font-medium truncate">{data.department}</span>
        </div>

        {/* Completion Rate Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Completion Rate</span>
            <span className="font-medium">{data.completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${data.completionRate}%` }}
            />
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatNumber(data.beneficiaryCount)} beneficiaries
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <DollarSign className="size-4 text-muted-foreground" />
            <span>{formatCurrency(data.totalCost)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
