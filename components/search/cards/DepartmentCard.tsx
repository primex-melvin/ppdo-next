"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Building2, Users, FolderKanban, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface DepartmentCardData {
  id: string;
  name: string;
  description?: string;
  departmentCode: string;
  employeeCount: number;
  activeProjectsCount: number;
  headOfDepartment?: string;
  email?: string;
  phone?: string;
  location?: string;
}

interface DepartmentCardProps {
  data: DepartmentCardData;
  onClick?: () => void;
  className?: string;
}

export function DepartmentCard({ data, onClick, className }: DepartmentCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/departments/${data.id}`);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <Card
      className={cn(
        "border-l-4 border-l-indigo-500 transition-all duration-200 cursor-pointer",
        "hover:shadow-lg hover:-translate-y-0.5",
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        {/* Header with Department Code and Arrow Icon */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full px-2 py-0.5 text-xs font-mono">
            {data.departmentCode}
          </Badge>
          {isHovered && (
            <ArrowUpRight className="size-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>

        {/* Department Name */}
        <h3 className="font-semibold text-base mb-1 line-clamp-2">
          {data.name}
        </h3>

        {/* Description */}
        {data.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {data.description}
          </p>
        )}

        {/* Head of Department */}
        {data.headOfDepartment && (
          <div className="text-sm mb-3">
            <span className="text-muted-foreground">Head: </span>
            <span className="font-medium">{data.headOfDepartment}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-indigo-500" />
            <div>
              <div className="text-xs text-muted-foreground">Employees</div>
              <div className="font-semibold text-sm">{formatNumber(data.employeeCount)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FolderKanban className="size-4 text-indigo-500" />
            <div>
              <div className="text-xs text-muted-foreground">Active Projects</div>
              <div className="font-semibold text-sm">{formatNumber(data.activeProjectsCount)}</div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        {(data.email || data.phone) && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
            {data.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="size-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate text-muted-foreground">{data.email}</span>
              </div>
            )}
            {data.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="size-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{data.phone}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
