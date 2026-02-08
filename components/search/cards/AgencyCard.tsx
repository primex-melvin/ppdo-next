"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Building, User, MapPin, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface AgencyCardData {
  id: string;
  name: string;
  description?: string;
  agencyType: "Government" | "NGO" | "Private" | "International" | "Local";
  contactPerson?: string;
  contactTitle?: string;
  address?: string;
  activePartnershipsCount: number;
  email?: string;
  phone?: string;
}

interface AgencyCardProps {
  data: AgencyCardData;
  onClick?: () => void;
  className?: string;
}

const agencyTypeColors = {
  Government: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  NGO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  Private: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  International: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  Local: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
};

export function AgencyCard({ data, onClick, className }: AgencyCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/agencies/${data.id}`);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <Card
      className={cn(
        "border-l-4 border-l-cyan-500 transition-all duration-200 cursor-pointer",
        "hover:shadow-lg hover:-translate-y-0.5",
        className
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        {/* Header with Agency Type Badge and Arrow Icon */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge className={cn("rounded-full px-2 py-0.5 text-xs", agencyTypeColors[data.agencyType])}>
            {data.agencyType}
          </Badge>
          {isHovered && (
            <ArrowUpRight className="size-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>

        {/* Agency Name */}
        <div className="flex items-start gap-2 mb-1">
          <Building className="size-5 text-cyan-500 flex-shrink-0 mt-0.5" />
          <h3 className="font-semibold text-base line-clamp-2">
            {data.name}
          </h3>
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 ml-7">
            {data.description}
          </p>
        )}

        {/* Contact Person */}
        {data.contactPerson && (
          <div className="flex items-center gap-2 mb-3">
            <User className="size-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{data.contactPerson}</div>
              {data.contactTitle && (
                <div className="text-xs text-muted-foreground truncate">{data.contactTitle}</div>
              )}
            </div>
          </div>
        )}

        {/* Address */}
        {data.address && (
          <div className="flex items-start gap-2 mb-3">
            <MapPin className="size-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground line-clamp-2">{data.address}</p>
          </div>
        )}

        {/* Active Partnerships */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Handshake className="size-4 text-cyan-500" />
              <span className="text-sm text-muted-foreground">Active Partnerships</span>
            </div>
            <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 rounded-full px-2 py-0.5 text-xs font-semibold">
              {formatNumber(data.activePartnershipsCount)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
