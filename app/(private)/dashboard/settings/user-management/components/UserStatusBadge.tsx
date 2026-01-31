// app/dashboard/settings/user-management/components/UserStatusBadge.tsx

import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/rbac";

interface UserStatusBadgeProps {
  status?: "active" | "inactive" | "suspended";
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  if (!status) return <span className="text-sm text-zinc-500 dark:text-zinc-400">—</span>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200 dark:border-green-900";
      case "inactive":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900";
      case "suspended":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-900";
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`${getStatusColor(status)} font-medium text-xs px-2.5 py-1`}
    >
      {STATUS_LABELS[status] || status}
    </Badge>
  );
}