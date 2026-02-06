// app/dashboard/project/budget/[particularId]/[projectbreakdownId]/[inspectionId]/components/Card.tsx

import type React from "react";
import { type ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-gray-900 ${className}`}>{children}</div>
);