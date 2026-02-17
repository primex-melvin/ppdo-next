"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  User,
  Pause,
  Loader2,
  FolderKanban,
  PiggyBank,
  Heart,
  GraduationCap,
} from "lucide-react"
import { ThemeToggle } from "@/components/shared"
import { ProjectCard, ProjectItem } from "../components/ProjectCard"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

// Helper function
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Category configuration - keys must match backend categoryCounts keys
const categoryConfig: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  borderColor: string;
  bgColor: string;
}> = {
  project11Plans: {
    label: "Project 11 Plans / Budget Items",
    icon: FolderKanban,
    color: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-500/20",
    bgColor: "bg-emerald-500/10",
  },
  twentyPercentDF: {
    label: "20% Development Fund",
    icon: PiggyBank,
    color: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-500/20",
    bgColor: "bg-amber-500/10",
  },
  trustFund: {
    label: "Trust Fund",
    icon: PiggyBank,
    color: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-500/20",
    bgColor: "bg-blue-500/10",
  },
  specialHealth: {
    label: "Special Health Fund",
    icon: Heart,
    color: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-500/20",
    bgColor: "bg-rose-500/10",
  },
  specialEducation: {
    label: "Special Education Fund",
    icon: GraduationCap,
    color: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-500/20",
    bgColor: "bg-purple-500/10",
  },
}

type ProjectCategory = keyof typeof categoryConfig

interface CategorizedProjectItem extends Omit<ProjectItem, 'type' | 'category'> {
  category?: ProjectCategory
}

export default function AgencyDetailPage() {
  const params = useParams()
  const id = params?.id as Id<"implementingAgencies">

  const agency = useQuery(api.implementingAgencies.get, { id })

  if (agency === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#15803D]" />
      </div>
    )
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "external":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
      case "internal":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
    }
  }

  // Get categorized projects from the new API response
  const projectsByCategory = agency.projectsByCategory || {
    project11Plans: [],
    twentyPercentDF: [],
    trustFund: [],
    specialHealth: [],
    specialEducation: [],
  }

  const categoryCounts = agency.categoryCounts || {
    project11Plans: 0,
    twentyPercentDF: 0,
    trustFund: 0,
    specialHealth: 0,
    specialEducation: 0,
  }

  // Use calculated stats from backend
  const stats = {
    utilizationRate: agency.totalBudget > 0 ? ((agency.utilizedBudget / agency.totalBudget) * 100).toFixed(1) : "0.0",
    avgProjectBudget: agency.avgProjectBudget || 0
  }

  // Helper to render a category section
  const renderCategorySection = (
    categoryKey: ProjectCategory,
    projects: CategorizedProjectItem[]
  ) => {
    if (projects.length === 0) return null

    const config = categoryConfig[categoryKey]
    if (!config) return null
    const IconComponent = config.icon

    // Group by status within category
    const ongoing = projects.filter(p => p.status === "ongoing")
    const completed = projects.filter(p => p.status === "completed")
    const delayed = projects.filter(p => p.status === "delayed")

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <IconComponent className={`h-5 w-5 ${config.color}`} />
          <h4 className="text-xl font-cinzel font-semibold">{config.label}</h4>
          <Badge variant="outline" className={`${config.borderColor} ${config.color}`}>
            {projects.length}
          </Badge>
        </div>

        {/* Ongoing */}
        {ongoing.length > 0 && (
          <div className="pl-8 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-[#15803D]" />
              <span>Ongoing ({ongoing.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ongoing.map((project) => (
                <ProjectCard key={project.id} project={project as ProjectItem} />
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <div className="pl-8 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Completed ({completed.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completed.map((project) => (
                <ProjectCard key={project.id} project={project as ProjectItem} />
              ))}
            </div>
          </div>
        )}

        {/* Delayed */}
        {delayed.length > 0 && (
          <div className="pl-8 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Pause className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span>Delayed ({delayed.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {delayed.map((project) => (
                <ProjectCard key={project.id} project={project as ProjectItem} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-10 space-y-8">
        {/* Agency Header */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-4 md:p-6 rounded-2xl" style={{ backgroundColor: "#15803D20" }}>
              <Building2 className="h-10 w-10 md:h-12 md:w-12" style={{ color: "#15803D" }} />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className={`${getTypeColor(agency.type)} font-medium`}>
                  {agency.type === "internal" ? "PROVINCIAL" : "EXTERNAL"}
                </Badge>
              </div>
              <div>
                <h2 className="text-3xl md:text-5xl font-cinzel font-bold tracking-tight mb-2">{agency.code}</h2>
                <p className="text-lg md:text-xl text-muted-foreground">{agency.fullName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Information Card */}
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-cinzel font-semibold">Agency Overview</h3>
              <Badge variant="outline" style={{ borderColor: "#15803D", color: "#15803D" }}>
                Active
              </Badge>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Projects</p>
                <p className="text-3xl font-bold font-cinzel">{agency.totalProjects}</p>
                <p className="text-xs text-muted-foreground mt-1">All projects</p>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Active Projects</p>
                <p className="text-3xl font-bold font-cinzel text-[#15803D]">{agency.activeProjects}</p>
                <p className="text-xs text-muted-foreground mt-1">Currently ongoing</p>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-3xl font-bold font-cinzel text-blue-600 dark:text-blue-400">
                  {agency.completedProjects}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Successfully finished</p>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Utilization Rate</p>
                <p className="text-3xl font-bold font-cinzel">{stats.utilizationRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">Budget efficiency</p>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              {Object.entries(categoryCounts).map(([key, count]) => {
                const config = categoryConfig[key]
                if (!config) return null
                const IconComponent = config.icon
                return (
                  <div key={key} className={`text-center p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
                    <IconComponent className={`h-5 w-5 mx-auto mb-1 ${config.color}`} />
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground truncate">{config.label.split(" / ")[0]}</p>
                  </div>
                )
              })}
            </div>

            {/* Budget Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>Total Allocated Budget</span>
                  </div>
                  <p className="text-2xl font-bold font-cinzel">{formatCurrency(agency.totalBudget)}</p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Total Utilized Budget</span>
                  </div>
                  <p className="text-2xl font-bold font-cinzel text-[#15803D]">
                    {formatCurrency(agency.utilizedBudget)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Average per Project</span>
                  </div>
                  <p className="text-2xl font-bold font-cinzel">{formatCurrency(stats.avgProjectBudget)}</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-2">
          <CardContent className="p-6">
            <h3 className="text-xl font-cinzel font-semibold mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-[#15803D] mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Head Officer</p>
                    <p className="font-semibold">{agency.contactPerson || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[#15803D] mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email Address</p>
                    <p className="font-semibold">{agency.contactEmail || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#15803D] mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Number</p>
                    <p className="font-semibold">{agency.contactPhone || "N/A"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#15803D] mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Office Address</p>
                    <p className="font-semibold">{agency.address || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Section - Categorized */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl md:text-3xl font-cinzel font-bold">Projects Portfolio</h3>
            <p className="text-sm text-muted-foreground">{agency.totalProjects} total projects</p>
          </div>

          {/* Project 11 Plans / Budget Items */}
          {renderCategorySection("project11Plans", projectsByCategory.project11Plans as CategorizedProjectItem[])}

          {/* 20% Development Fund */}
          {renderCategorySection("twentyPercentDF", projectsByCategory.twentyPercentDF as CategorizedProjectItem[])}

          {/* Trust Fund */}
          {renderCategorySection("trustFund", projectsByCategory.trustFund as CategorizedProjectItem[])}

          {/* Special Health Fund */}
          {renderCategorySection("specialHealth", projectsByCategory.specialHealth as CategorizedProjectItem[])}

          {/* Special Education Fund */}
          {renderCategorySection("specialEducation", projectsByCategory.specialEducation as CategorizedProjectItem[])}

          {/* Empty State */}
          {agency.totalProjects === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No projects found</p>
              <p className="text-sm">This agency has no projects assigned yet.</p>
            </div>
          )}
        </div>
      </main>

    </div>
  )
}
