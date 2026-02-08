"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, User, Building2, Mail, Phone, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export interface UserCardData {
  id: string;
  fullName: string;
  role: string;
  position?: string;
  department: string;
  email?: string;
  phone?: string;
  lastActive?: string; // ISO date string
  avatar?: string;
  status?: "Active" | "Inactive" | "On Leave";
}

interface UserCardProps {
  data: UserCardData;
  onClick?: () => void;
  className?: string;
}

const statusColors = {
  Active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  Inactive: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  "On Leave": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
};

export function UserCard({ data, onClick, className }: UserCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = React.useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/users/${data.id}`);
    }
  };

  const formatLastActive = (dateString?: string) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className={cn(
        "border-l-4 border-l-orange-500 transition-all duration-200 cursor-pointer",
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
          {data.status && (
            <Badge className={cn("rounded-full px-2 py-0.5 text-xs", statusColors[data.status])}>
              {data.status}
            </Badge>
          )}
          <div className="flex-1" />
          {isHovered && (
            <ArrowUpRight className="size-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>

        {/* User Info with Avatar */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="size-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
            {data.avatar ? (
              <img src={data.avatar} alt={data.fullName} className="size-12 rounded-full object-cover" />
            ) : (
              <span className="text-orange-600 dark:text-orange-400 font-semibold text-sm">
                {getInitials(data.fullName)}
              </span>
            )}
          </div>

          {/* Name and Role */}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base mb-0.5 line-clamp-1">
              {data.fullName}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{data.role}</p>
            {data.position && (
              <p className="text-xs text-muted-foreground line-clamp-1">{data.position}</p>
            )}
          </div>
        </div>

        {/* Department */}
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="size-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground truncate">{data.department}</span>
        </div>

        {/* Contact Information */}
        <div className="space-y-2 mb-3">
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

        {/* Last Active */}
        {data.lastActive && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>Last active {formatLastActive(data.lastActive)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
