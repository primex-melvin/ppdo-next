"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FolderKanban, PiggyBank, Heart, GraduationCap } from "lucide-react"
import { ProjectItem } from "./ProjectCard"

interface CompactProjectCardProps {
  project: ProjectItem
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `₱${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `₱${(amount / 1000).toFixed(1)}K`
  }
  return `₱${amount}`
}

const categoryBadgeConfig: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  project11Plans: {
    label: "Budget",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    icon: FolderKanban,
  },
  twentyPercentDF: {
    label: "20% DF",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    icon: PiggyBank,
  },
  trustFund: {
    label: "Trust",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    icon: PiggyBank,
  },
  specialHealth: {
    label: "Health",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    icon: Heart,
  },
  specialEducation: {
    label: "Education",
    className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    icon: GraduationCap,
  },
}

export function CompactProjectCard({ project }: CompactProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-[#15803D]/20 text-[#15803D]"
      case "completed":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400"
      case "delayed":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400"
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400"
    }
  }

  const categoryConfig = project.category ? categoryBadgeConfig[project.category] : null
  const CategoryIcon = categoryConfig?.icon

  return (
    <Card className="border hover:shadow-md transition-all duration-200 hover:border-[#15803D]/30 cursor-pointer group">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Folder Icon */}
          <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(project.status)}`}>
            {CategoryIcon ? (
              <CategoryIcon className="h-5 w-5" />
            ) : (
              <FolderKanban className="h-5 w-5" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate group-hover:text-[#15803D] transition-colors">
              {project.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              {categoryConfig && (
                <span className="text-[10px] text-muted-foreground">
                  {categoryConfig.label}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {formatCurrency(project.budget)}
              </span>
            </div>
          </div>
          
          {/* Status Dot */}
          <div className={`w-2 h-2 rounded-full shrink-0 mt-2 ${
            project.status === "ongoing" ? "bg-[#15803D]" :
            project.status === "completed" ? "bg-blue-500" :
            "bg-gray-500"
          }`} />
        </div>
      </CardContent>
    </Card>
  )
}
