// components/activity-log/types.ts

import { ReactNode } from "react";

// 🆕 UPDATED: Added "trustFund" to type union
export type ActivityLogType = "breakdown" | "project" | "budget" | "trustFund";

export type UnifiedActivityLog = {
  _id: string;
  action: string;
  performedByName: string;
  timestamp: number;
  reason?: string;
  changedFields?: string;
  previousValues?: string;
  newValues?: string;
  projectName?: string;
  municipality?: string;
  particulars?: string;
  // 🆕 ADDED: Trust fund specific fields
  projectTitle?: string;
  officeInCharge?: string;
};

export interface ActivityLogSheetProps {
  type: ActivityLogType;
  entityId?: string;
  budgetItemId?: string;
  projectName?: string;
  implementingOffice?: string;
  trigger?: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
}