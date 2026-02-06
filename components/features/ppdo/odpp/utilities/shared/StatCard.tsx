/**
 * Shared StatCard Component
 *
 * Reusable stat card with consistent styling across all table pages.
 * Used by StandardStatisticsGrid and other statistics components.
 */

"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface StatCardProps {
  label: string;
  value: string;
  subContent?: React.ReactNode;
}

export const StatCard = React.memo(function StatCard({
  label,
  value,
  subContent,
}: StatCardProps) {
  return (
    <Card role="group" aria-label={label} className="h-full">
      <CardContent className="py-6 px-6">
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </p>
        <p
          className="text-2xl font-bold text-zinc-900 dark:text-zinc-100"
          aria-live="polite"
        >
          {value}
        </p>
        {subContent}
      </CardContent>
    </Card>
  );
});

export default StatCard;
