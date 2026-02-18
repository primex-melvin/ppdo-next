"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { MapPin, Locate, Search, Trash2, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useTheme } from "next-themes"
import {
  ResizableModal,
  ResizableModalContent,
  ResizableModalHeader,
  ResizableModalTitle,
  ResizableModalBody,
  ResizableModalFooter,
} from "@/components/ui/resizable-modal"

// Tarlac City default coordinates
const DEFAULT_CENTER = { lat: 15.4866, lng: 120.5955 }

interface LocationEditorModalProps {
  isOpen: boolean
  onClose: () => void
  agencyId: string
  initialLocation?: {
    locationLatitude?: number | null
    locationLongitude?: number | null
    locationFormattedAddress?: string | null
    locationBarangay?: string | null
    locationMunicipality?: string | null
    locationProvince?: string | null
    locationPostalCode?: string | null
    address?: string | null // legacy fallback
  }
}

// Dynamic import Leaflet to avoid SSR issues
let L: typeof import("leaflet") | null = null

export function LocationEditorModal({
  isOpen,
  onClose,
  agencyId,
  initialLocation,
}: LocationEditorModalProps) {
  const { theme } = useTheme()
  const updateAgency = useMutation(api.implementingAgencies.update)
  
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import("leaflet").Map | null>(null)
  const markerRef = useRef<import("leaflet").Marker | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Form state
  const [latitude, setLatitude] = useState<number>(initialLocation?.locationLatitude || DEFAULT_CENTER.lat)
  const [longitude, setLongitude] = useState<number>(initialLocation?.locationLongitude || DEFAULT_CENTER.lng)
  const [formattedAddress, setFormattedAddress] = useState(initialLocation?.locationFormattedAddress || "")
  const [barangay, setBarangay] = useState(initialLocation?.locationBarangay || "")
  const [municipality, setMunicipality] = useState(initialLocation?.locationMunicipality || "")
  const [province, setProvince] = useState(initialLocation?.locationProvince || "")
  const [postalCode, setPostalCode] = useState(initialLocation?.locationPostalCode || "")
  const [isSaving, setIsSaving] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)

  // Initialize map when modal opens
  useEffect(() => {
    if (!isOpen || mapLoaded || !mapContainerRef.current) return

    const initMap = async () => {
      if (!L) {
        L = await import("leaflet")
      }

      // Import Leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        document.head.appendChild(link)
      }

      const initialLat = initialLocation?.locationLatitude || DEFAULT_CENTER.lat
      const initialLng = initialLocation?.locationLongitude || DEFAULT_CENTER.lng

      const map = L!.map(mapContainerRef.current!).setView([initialLat, initialLng], 13)
      mapRef.current = map

      // Add tile layer based on theme
      const isDark = theme === "dark"
      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"

      L!.tileLayer(tileUrl, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map)

      // Create custom green marker icon
      const greenIcon = L!.divIcon({
        className: "custom-green-marker",
        html: `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#15803D" width="36" height="36">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      })

      // Add marker if location exists
      if (initialLocation?.locationLatitude && initialLocation?.locationLongitude) {
        const marker = L!.marker([initialLocation.locationLatitude, initialLocation.locationLongitude], {
          icon: greenIcon,
        }).addTo(map)
        markerRef.current = marker
      }

      // Handle map clicks
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        setLatitude(lat)
        setLongitude(lng)

        // Update or create marker
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          const marker = L!.marker([lat, lng], { icon: greenIcon }).addTo(map)
          markerRef.current = marker
        }

        // Reverse geocode
        reverseGeocode(lat, lng)
      })

      setMapLoaded(true)
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
        setMapLoaded(false)
      }
    }
  }, [isOpen, theme])

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()
      
      if (data.display_name) {
        setFormattedAddress(data.display_name)
        
        // Extract address components
        const addr = data.address
        if (addr) {
          if (addr.suburb || addr.neighbourhood) {
            setBarangay(addr.suburb || addr.neighbourhood)
          }
          if (addr.city || addr.town || addr.municipality) {
            setMunicipality(addr.city || addr.town || addr.municipality)
          }
          if (addr.state || addr.province) {
            setProvince(addr.state || addr.province)
          }
          if (addr.postcode) {
            setPostalCode(addr.postcode)
          }
        }
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error)
    }
  }

  // Geocode address to get coordinates
  const handleGeocodeSearch = async () => {
    const searchQuery = [barangay, municipality, province, postalCode]
      .filter(Boolean)
      .join(", ")
    
    if (!searchQuery.trim()) {
      toast.error("Please enter at least one address field")
      return
    }

    setIsGeocoding(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const result = data[0]
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)
        
        setLatitude(lat)
        setLongitude(lng)
        setFormattedAddress(result.display_name)

        // Update map
        if (mapRef.current && L) {
          mapRef.current.setView([lat, lng], 15)
          
          const greenIcon = L.divIcon({
            className: "custom-green-marker",
            html: `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#15803D" width="36" height="36">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          })

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
          } else {
            const marker = L.marker([lat, lng], { icon: greenIcon }).addTo(mapRef.current)
            markerRef.current = marker
          }
        }

        toast.success("Address has been located on the map")
      } else {
        toast.error("Could not find the specified address")
      }
    } catch (error) {
      toast.error("Failed to search for address")
    } finally {
      setIsGeocoding(false)
    }
  }

  // Locate me using browser geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
        setLatitude(lat)
        setLongitude(lng)

        if (mapRef.current && L) {
          mapRef.current.setView([lat, lng], 15)
          
          const greenIcon = L.divIcon({
            className: "custom-green-marker",
            html: `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#15803D" width="36" height="36">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
          })

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
          } else {
            const marker = L.marker([lat, lng], { icon: greenIcon }).addTo(mapRef.current)
            markerRef.current = marker
          }
        }

        reverseGeocode(lat, lng)
        
        toast.success("Your current location has been set")
      },
      () => {
        toast.error("Unable to retrieve your location")
      }
    )
  }

  // Save location
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateAgency({
        id: agencyId as any,
        locationLatitude: latitude,
        locationLongitude: longitude,
        locationFormattedAddress: formattedAddress || undefined,
        locationBarangay: barangay || undefined,
        locationMunicipality: municipality || undefined,
        locationProvince: province || undefined,
        locationPostalCode: postalCode || undefined,
      })
      
      toast.success("Location updated successfully")
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to update location")
    } finally {
      setIsSaving(false)
    }
  }

  // Clear location
  const handleClear = async () => {
    setIsSaving(true)
    try {
      await updateAgency({
        id: agencyId as any,
        locationLatitude: undefined,
        locationLongitude: undefined,
        locationFormattedAddress: undefined,
        locationBarangay: undefined,
        locationMunicipality: undefined,
        locationProvince: undefined,
        locationPostalCode: undefined,
      })
      
      toast.success("Location cleared successfully")
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to clear location")
    } finally {
      setIsSaving(false)
    }
  }

  const hasLocation = initialLocation?.locationLatitude && initialLocation?.locationLongitude

  return (
    <ResizableModal open={isOpen} onOpenChange={onClose}>
      <ResizableModalContent width="750px" height="650px">
        <ResizableModalHeader>
          <ResizableModalTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#15803D]" />
            Edit Location
          </ResizableModalTitle>
        </ResizableModalHeader>

        <ResizableModalBody className="p-6">
          <Tabs defaultValue="map" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="map">Map View</TabsTrigger>
              <TabsTrigger value="address">Address Input</TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="flex-1 flex flex-col gap-4 mt-4">
              {/* Map Container */}
              <div className="relative flex-1 min-h-[300px] rounded-lg border border-border overflow-hidden">
                <div ref={mapContainerRef} className="w-full h-full" />
                {!mapLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <p className="text-sm text-muted-foreground">Loading map...</p>
                  </div>
                )}
                
                {/* Locate Me Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLocateMe}
                  className="absolute top-3 right-3 z-[1000] shadow-md"
                >
                  <Locate className="h-4 w-4 mr-2" />
                  Locate Me
                </Button>
              </div>

              {/* Current Selection Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">Selected Location</h4>
                {formattedAddress ? (
                  <p className="text-sm text-muted-foreground">{formattedAddress}</p>
                ) : (
                  <p className="text-sm text-zinc-400 italic">Click on the map to select a location</p>
                )}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Lat: {latitude.toFixed(6)}</span>
                  <span>Lng: {longitude.toFixed(6)}</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="address" className="flex flex-col gap-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barangay">Barangay</Label>
                  <Input
                    id="barangay"
                    placeholder="Enter barangay"
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="municipality">Municipality / City</Label>
                  <Input
                    id="municipality"
                    placeholder="Enter municipality or city"
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    placeholder="Enter province"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">Postal Code</Label>
                  <Input
                    id="postal"
                    placeholder="Enter postal code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleGeocodeSearch}
                disabled={isGeocoding}
                className="w-full"
              >
                <Search className="h-4 w-4 mr-2" />
                {isGeocoding ? "Searching..." : "Search Address on Map"}
              </Button>

              {formattedAddress && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-2">Found Address</h4>
                  <p className="text-sm text-muted-foreground">{formattedAddress}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ResizableModalBody>

        <ResizableModalFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleClear}
            disabled={isSaving || !hasLocation}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Location
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-[#15803D] hover:bg-[#15803D]/90">
              <Check className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Location"}
            </Button>
          </div>
        </ResizableModalFooter>
      </ResizableModalContent>
    </ResizableModal>
  )
}
