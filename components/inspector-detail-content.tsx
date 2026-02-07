"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { Inspection } from "@/lib/mock-data"
import { InspectorHeader } from "@/components/inspector-header"
import { ActivityTimeline } from "@/components/activity-timeline"
import { ImageLightbox } from "@/components/image-lightbox"
import { AddInspectionModal } from "@/components/add-inspection-modal"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Clock } from "lucide-react"

import { ActivitySearchFilter } from "@/components/activity-search-filter"
import { MapModal } from "@/components/map-modal"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function InspectorDetailContent({ inspection }: { inspection: Inspection }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get("projectId")

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "pending">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const handleImageClick = (images: string[], index: number) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const filteredActivities = inspection.activities.filter((activity) => {
    const matchesSearch =
      activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.postedBy.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || activity.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage)
  const paginatedActivities = filteredActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const backUrl = projectId ? `/?project=${projectId}` : "/"

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-muted">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(backUrl)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button onClick={() => setModalOpen(true)} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4" />
            Add New Inspection
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <InspectorHeader
          inspection={inspection}
          totalActivities={inspection.activities.length}
          onLocationClick={() => setMapOpen(true)}
        />

        <ActivitySearchFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          resultCount={filteredActivities.length}
        />

        <div className="grid grid-cols-3 gap-8 mt-8">
          <div className="col-span-2 space-y-8">
            <ActivityTimeline
              activities={paginatedActivities}
              onImageClick={handleImageClick}
              inspectionId={inspection.id}
            />

            {totalPages > 1 && (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-1 text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="col-span-1 sticky top-20 h-fit">
            <div className="bg-card border border-border/50 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">Latest Activities</h3>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {inspection.activities.slice(0, 10).map((activity) => (
                  <Link key={activity.id} href={`/activities/${activity.id}?from=${inspection.id}`}>
                    <div className="pb-3 border-b border-muted/50 last:border-0 hover:bg-muted/40 p-2 rounded transition-colors cursor-pointer">
                      <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs font-medium text-foreground/80 line-clamp-2">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            activity.status === "verified" ? "bg-emerald-500" : "bg-amber-500",
                          )}
                        />
                        <span
                          className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            activity.status === "verified" ? "text-emerald-700" : "text-amber-700",
                          )}
                        >
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <MapModal location={inspection.location} isOpen={mapOpen} onClose={() => setMapOpen(false)} />

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      <AddInspectionModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  )
}
