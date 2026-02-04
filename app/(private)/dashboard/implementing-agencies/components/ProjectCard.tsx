"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users } from "lucide-react"
import { useAccentColor } from "@/contexts/AccentColorContext"

// Define the interface matching the backend's normalized structure
export interface ProjectItem {
  id: string
  name: string
  description: string
  status: string
  budget: number
  utilized: number
  location: string
  startDate: string
  endDate: string
  beneficiaries: number
  type: "project" | "breakdown"
}

interface ProjectCardProps {
  project: ProjectItem
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-PH").format(num)
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { accentColorValue } = useAccentColor()
  const utilizationRate = project.budget > 0 ? ((project.utilized / project.budget) * 100).toFixed(1) : "0.0"

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "ongoing":
        return {
          label: "Ongoing",
          className: "bg-[#15803D]/10 text-[#15803D] border-[#15803D]/20",
        }
      case "completed":
        return {
          label: "Completed",
          className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
        }
      case "planned":
        return {
          label: "Planned",
          className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
        }
      case "on-hold":
      case "delayed":
        return {
          label: status === "delayed" ? "Delayed" : "On Hold",
          className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
        }
      default:
        return {
          label: status,
          className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
        }
    }
  }

  const statusConfig = getStatusConfig(project.status)

  return (
    <Card className="border-2 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className={`${statusConfig.className} font-medium`}>
            {statusConfig.label}
          </Badge>
          {project.beneficiaries > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              <Users className="h-3 w-3" />
              <span>{formatNumber(project.beneficiaries)}</span>
            </div>
          )}
          {/* Show type badge if useful */}
          <Badge variant="secondary" className="text-[10px] h-5">
            {project.type === "project" ? "MAIN" : "BREAKDOWN"}
          </Badge>
        </div>

        <CardTitle className="text-lg font-cinzel leading-tight">{project.name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">
          {project.description}
        </p>

        {/* Project Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" style={{ color: accentColorValue }} />
            <span>{project.location}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" style={{ color: accentColorValue }} />
            <span>
              {new Date(project.startDate).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              -{" "}
              {new Date(project.endDate).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Budget Information */}
        <div className="space-y-3 pt-3 border-t">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm font-semibold">{formatCurrency(project.budget)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Utilized</p>
              <p className="text-sm font-semibold text-[#15803D]">{formatCurrency(project.utilized)}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{utilizationRate}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Number(utilizationRate) > 100 ? 100 : utilizationRate}%`,
                  backgroundColor: project.status === "completed" ? "#3b82f6" : accentColorValue,
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
