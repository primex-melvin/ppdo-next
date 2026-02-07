"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InspectorPortalHeader } from "@/components/inspector-portal-header"
import { ProjectsList } from "@/components/projects-list"
import { WaybackNav } from "@/components/wayback-nav"
import { TimelineChart } from "@/components/timeline-chart"
import { CalendarGrid } from "@/components/calendar-grid"

import { cn } from "@/lib/utils"
import { TARLAC_PROJECTS } from "@/lib/mock-data"

// Added status color mapping
const STATUS_COLORS = {
  planning: "bg-blue-500 hover:bg-blue-600",
  ongoing: "bg-amber-500 hover:bg-amber-600",
  completed: "bg-emerald-500 hover:bg-emerald-600",
  suspended: "bg-red-500 hover:bg-red-600",
}

export default function InspectorPortal() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const selectedProject = selectedProjectId ? TARLAC_PROJECTS.find((p) => p.id === selectedProjectId) : null

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
  }

  const handleBackToProjects = () => {
    setSelectedProjectId(null)
  }

  return (
    <main className="min-h-screen bg-background">
      <InspectorPortalHeader provinceName="Tarlac" />

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {!selectedProjectId ? (
          <div>
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight italic">
                  Tarlac Infrastructure Projects
                </h2>
                <p className="text-muted-foreground mt-2 font-medium">
                  Official monitoring portal for the Province of Tarlac
                </p>
              </div>
            </div>
            <ProjectsList projects={TARLAC_PROJECTS} onProjectSelect={handleProjectSelect} />
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <Button variant="ghost" onClick={handleBackToProjects} className="mb-4 -ml-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>

              <div className="bg-card border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Added status badge next to title */}
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-foreground">{selectedProject?.name}</h2>
                      <Badge
                        className={cn("capitalize text-white", STATUS_COLORS[selectedProject?.status || "ongoing"])}
                      >
                        {selectedProject?.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">{selectedProject?.projectNumber}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <span className="text-muted-foreground">
                        <span className="font-medium text-foreground">{selectedProject?.municipality}</span>
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        Budget: <span className="font-medium text-foreground">{selectedProject?.budget}</span>
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        Contractor: <span className="font-medium text-foreground">{selectedProject?.contractor}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <WaybackNav />

            <div className="mt-6 text-center text-sm">
              <p>
                Recorded <span className="font-bold">{selectedProject?.inspectionCount} times</span> between{" "}
                <span className="text-primary hover:underline cursor-pointer">
                  {new Date(selectedProject?.startDate || "").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>{" "}
                and{" "}
                <span className="text-primary hover:underline cursor-pointer">
                  {new Date(selectedProject?.expectedCompletion || "").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                .
              </p>
            </div>

            <div className="mt-8">
              <TimelineChart />
            </div>

            <div className="mt-12">
              {/* Pass projectId to calendar grid for proper back navigation */}
              <CalendarGrid year={2026} projectId={selectedProjectId} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
