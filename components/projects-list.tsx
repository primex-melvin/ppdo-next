"use client"

import { useState, useMemo } from "react"
import { Search, Building2, MapPin, Calendar, Wallet, CheckCircle2, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Project, ProjectType, ProjectStatus } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  road: "Road",
  bridge: "Bridge",
  building: "Building",
  water: "Water",
  power: "Power",
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  ongoing: "Ongoing",
  completed: "Completed",
  suspended: "Suspended",
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  ongoing: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  completed: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  suspended: "bg-red-100 text-red-700 hover:bg-red-100",
}

interface ProjectsListProps {
  projects: Project[]
  onProjectSelect: (projectId: string) => void
}

export function ProjectsList({ projects, onProjectSelect }: ProjectsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [municipalityFilter, setMunicipalityFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Extract unique municipalities
  const municipalities = useMemo(() => {
    const unique = Array.from(new Set(projects.map((p) => p.municipality)))
    return unique.sort()
  }, [projects])

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        searchQuery === "" ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.projectNumber.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesMunicipality = municipalityFilter === "all" || project.municipality === municipalityFilter

      const matchesType = typeFilter === "all" || project.type === typeFilter

      const matchesStatus = statusFilter === "all" || project.status === statusFilter

      return matchesSearch && matchesMunicipality && matchesType && matchesStatus
    })
  }, [projects, searchQuery, municipalityFilter, typeFilter, statusFilter])

  const totalInspections = useMemo(() => projects.reduce((acc, p) => acc + p.inspectionCount, 0), [projects])
  const pendingProjects = useMemo(() => projects.filter((p) => p.status === "ongoing").length, [projects])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total Inspections</p>
              <p className="text-2xl font-bold text-primary">{totalInspections}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-amber-700 font-medium">Pending Verification</p>
              <p className="text-2xl font-bold text-amber-600">{pendingProjects}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-emerald-700 font-medium">Completed Projects</p>
              <p className="text-2xl font-bold text-emerald-600">
                {projects.filter((p) => p.status === "completed").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by name or number..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select value={municipalityFilter} onValueChange={setMunicipalityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Municipalities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Municipalities</SelectItem>
              {municipalities.map((municipality) => (
                <SelectItem key={municipality} value={municipality}>
                  {municipality}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredProjects.length}</span> of{" "}
          <span className="font-semibold text-foreground">{projects.length}</span> projects
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group relative"
            onClick={() => onProjectSelect(project.id)}
          >
            <div className="aspect-video bg-muted relative overflow-hidden">
              <img
                src={project.coverImage || "/placeholder.svg"}
                alt={project.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-center text-white">
                  <p className="text-4xl font-black">{project.inspectionCount}</p>
                  <p className="text-xs font-bold uppercase tracking-wider">Inspections</p>
                </div>
              </div>
              <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
                <Badge className={cn("font-bold shadow-sm", STATUS_COLORS[project.status])}>
                  {STATUS_LABELS[project.status]}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-white/90 backdrop-blur-sm text-primary font-black text-lg py-0.5 px-3 border-primary/20"
                >
                  {project.inspectionCount}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg leading-tight text-balance line-clamp-2 group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{project.projectNumber}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{project.municipality}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{PROJECT_TYPE_LABELS[project.type]}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium text-foreground">{project.budget}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs">
                    {project.inspectionCount} {project.inspectionCount === 1 ? "inspection" : "inspections"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  )
}
