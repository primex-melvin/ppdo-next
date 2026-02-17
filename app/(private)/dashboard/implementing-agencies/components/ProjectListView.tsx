"use client"

import { ProjectItem } from "./ProjectCard"
import { Badge } from "@/components/ui/badge"
import { FolderKanban, PiggyBank, Heart, GraduationCap, Calendar, MapPin } from "lucide-react"

interface ProjectListViewProps {
  projects: ProjectItem[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const categoryBadgeConfig: Record<string, { label: string; className: string; icon: React.ComponentType<{ className?: string }> }> = {
  project11Plans: {
    label: "Budget Item",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    icon: FolderKanban,
  },
  twentyPercentDF: {
    label: "20% DF",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    icon: PiggyBank,
  },
  trustFund: {
    label: "Trust Fund",
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

export function ProjectListView({ projects }: ProjectListViewProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ongoing":
        return {
          label: "Ongoing",
          className: "bg-[#15803D]/10 text-[#15803D] border-[#15803D]/20",
          dotColor: "bg-[#15803D]",
        }
      case "completed":
        return {
          label: "Completed",
          className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
          dotColor: "bg-blue-500",
        }
      case "delayed":
        return {
          label: "Delayed",
          className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
          dotColor: "bg-gray-500",
        }
      default:
        return {
          label: status,
          className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
          dotColor: "bg-gray-500",
        }
    }
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No projects found</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Project</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Budget</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Utilized</th>
            <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {projects.map((project) => {
            const statusConfig = getStatusConfig(project.status)
            const categoryConfig = project.category ? categoryBadgeConfig[project.category] : null
            const CategoryIcon = categoryConfig?.icon
            const utilizationRate = project.budget > 0 ? ((project.utilized / project.budget) * 100).toFixed(0) : "0"

            return (
              <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                <td className="py-3 px-4">
                  <div className="font-medium">{project.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{project.description || "No description"}</div>
                </td>
                <td className="py-3 px-4">
                  {categoryConfig && (
                    <Badge variant="outline" className={`${categoryConfig.className} text-xs`}>
                      {CategoryIcon && <CategoryIcon className="h-3 w-3 mr-1" />}
                      {categoryConfig.label}
                    </Badge>
                  )}
                </td>
                <td className="py-3 px-4">
                  <Badge variant="outline" className={`${statusConfig.className} text-xs`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor} mr-1.5`} />
                    {statusConfig.label}
                  </Badge>
                </td>
                <td className="py-3 px-4 font-medium">{formatCurrency(project.budget)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#15803D]">{formatCurrency(project.utilized)}</span>
                    <span className="text-xs text-muted-foreground">({utilizationRate}%)</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate max-w-[120px]">{project.location}</span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
