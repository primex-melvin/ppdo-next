"use client";

import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Database } from "lucide-react";

interface MigrationButtonProps {
  onClick: () => void;
}

export function MigrationButton({ onClick }: MigrationButtonProps) {
  const { user, isLoading } = useCurrentUser();

  // Only show for admin or super_admin
  if (isLoading || !user) return null;
  if (user.role !== "admin" && user.role !== "super_admin") return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="hidden md:flex items-center gap-2 border-amber-500 text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950/30"
      title="Temporary data migration tool"
    >
      <Database className="h-4 w-4" />
      <span>Migrate Data</span>
    </Button>
  );
}
