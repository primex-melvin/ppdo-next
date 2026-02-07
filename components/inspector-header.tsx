"use client"

import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Inspection } from "@/lib/mock-data"
import { Calendar, MapPin, FileText, Activity } from "lucide-react"

export function InspectorHeader({
  inspection,
  totalActivities,
  onLocationClick,
}: {
  inspection: Inspection
  totalActivities: number
  onLocationClick?: () => void
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{inspection.title}</h1>
            <Badge variant={inspection.status === "verified" ? "default" : "secondary"} className="capitalize">
              {inspection.status}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-3">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span className="font-mono">{inspection.projectNumber}</span>
            </div>
            <button
              onClick={onLocationClick}
              className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group"
            >
              <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="underline decoration-dashed">{inspection.location}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{new Date(inspection.dateRecorded).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              <span className="font-semibold">
                {totalActivities} {totalActivities === 1 ? "Activity" : "Activities"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{inspection.inspector.name}</p>
            <p className="text-xs text-gray-500">{inspection.inspector.role}</p>
          </div>
          <Avatar>
            <AvatarImage src={inspection.inspector.avatar || "/placeholder.svg"} alt={inspection.inspector.name} />
            <AvatarFallback>{inspection.inspector.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </div>
  )
}
