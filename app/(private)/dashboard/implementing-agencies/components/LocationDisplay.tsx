"use client"

import { MapPin } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface LocationDisplayProps {
  locationFormattedAddress?: string | null
  address?: string | null // fallback legacy field
  onClick: () => void
}

export function LocationDisplay({
  locationFormattedAddress,
  address,
  onClick,
}: LocationDisplayProps) {
  const displayValue = locationFormattedAddress || address
  const hasLocation = displayValue && displayValue.trim() !== ""

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="group flex items-center justify-end gap-2 py-1 px-2 -mx-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
          onClick={onClick}
        >
          <span
            className={`text-sm text-right ${
              hasLocation ? "text-muted-foreground" : "text-zinc-400 italic"
            }`}
          >
            {hasLocation ? displayValue : "No location yet"}
          </span>
          <span className="text-zinc-400">
            <MapPin className="h-4 w-4" />
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>Click to view or edit location</p>
      </TooltipContent>
    </Tooltip>
  )
}
