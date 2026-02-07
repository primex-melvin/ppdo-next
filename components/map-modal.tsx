"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export function MapModal({
  location,
  isOpen,
  onClose,
}: {
  location: string
  isOpen: boolean
  onClose: () => void
}) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (!isOpen || !mapContainer.current || mapLoaded) return

    const loadMap = async () => {
      // Dynamically import Leaflet to avoid SSR issues
      const L = await import("leaflet")
      const { default: Leaflet } = L

      // Import Leaflet CSS
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      document.head.appendChild(link)

      if (mapContainer.current) {
        // Tarlac City coordinates as default
        const map = Leaflet.map(mapContainer.current).setView([15.4866, 120.5955], 13)

        Leaflet.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map)

        // Add marker at Tarlac City
        Leaflet.marker([15.4866, 120.5955]).addTo(map).bindPopup(`<strong>${location}</strong>`)

        setMapLoaded(true)
      }
    }

    loadMap()
  }, [isOpen, location, mapLoaded])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-muted">
          <h2 className="text-lg font-bold text-foreground">Project Location</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative w-full h-[500px] bg-gray-100">
          <div ref={mapContainer} className="w-full h-full" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-muted">
          <p className="text-sm text-foreground">
            <span className="font-bold">Location:</span> {location}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Use the map to view the project location. Zoom in/out to see more details.
          </p>
        </div>
      </div>
    </div>
  )
}
