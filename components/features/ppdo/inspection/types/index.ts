// app/dashboard/project/budget/[particularId]/[projectbreakdownId]/[inspectionId]/components/types.ts

import { type ReactNode } from "react"
import { Id } from "@/convex/_generated/dataModel"

// Core Data Structures
export interface FinancialBreakdownItem {
  id: string
  code?: string
  description: string
  appropriation: number
  obligation: number
  balance: number
  level: number
  children?: FinancialBreakdownItem[]
}

export interface InspectionItem {
  _id: string
  _creationTime: number
  projectId: string
  budgetItemId?: string
  programNumber: string
  title: string
  category: string
  inspectionDateTime: number
  remarks: string
  status: "completed" | "in_progress" | "pending" | "cancelled"
  viewCount: number
  uploadSessionId?: string
  createdBy: string
  createdAt: number
  updatedAt: number
  metadata?: string
  // Enriched fields from API
  creator?: {
    _id: string
    firstName?: string
    lastName?: string
    email?: string
  } | null
  imageCount?: number
  thumbnails?: string[]
  // Legacy alias for compatibility
  inspectionDate?: number
}

// Alias for backward compatibility
export type Inspection = InspectionItem

export interface InspectionFormData {
  programNumber: string
  title: string
  category: string
  date: string
  remarks: string
  images: File[]
  uploadSessionId?: Id<"uploadSessions">
}

export interface RemarkItem {
  id: string
  author: string
  authorRole: string
  date: string
  content: string
  category: string
  priority: "Low" | "Medium" | "High"
}

// Component Props
export interface FinancialBreakdownTabsProps {
  projectId: string
}

export interface CardProps {
  children: ReactNode
  className?: string
}

export interface StatCardProps {
  label: string
  amount: number
}

export interface TransactionCardProps {
  amount: number
  name: string
  email: string
  type: string
}

export interface StatItem {
  label: string
  amount: number
}

export interface BarChartItemProps {
  label: string
  value: number
  color: string
  isDashed?: boolean
}

export interface OverviewContentProps {
  stats: StatItem[]
  transactions: TransactionCardProps[]
}

export interface InspectionContentProps {
  data: FinancialBreakdownItem[]
}

export interface RemarksContentProps {
  projectId: string
}

export interface NewInspectionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: InspectionFormData) => void
}

export interface InspectionDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inspection: any | null
}