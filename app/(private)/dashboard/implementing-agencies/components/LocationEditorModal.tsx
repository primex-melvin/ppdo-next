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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
    address?: string | null
  }
}

export function LocationEditorModal({
  isOpen,
  onClose,
  agencyId,
  initialLocation,
}: LocationEditorModalProps) {
  const { theme, resolvedTheme } = useTheme()
  const updateAgency = useMutation(api.implementingAgencies.update)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const mapInitializedRef = useRef(false)
  const initAttemptedRef = useRef(false)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

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
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("map")
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLatitude(initialLocation?.locationLatitude || DEFAULT_CENTER.lat)
      setLongitude(initialLocation?.locationLongitude || DEFAULT_CENTER.lng)
      setFormattedAddress(initialLocation?.locationFormattedAddress || "")
      setBarangay(initialLocation?.locationBarangay || "")
      setMunicipality(initialLocation?.locationMunicipality || "")
      setProvince(initialLocation?.locationProvince || "")
      setPostalCode(initialLocation?.locationPostalCode || "")
      setIsLoading(true)
      initAttemptedRef.current = false
    } else {
      // Cleanup when modal closes
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
        tileLayerRef.current = null
        mapInitializedRef.current = false
        initAttemptedRef.current = false
      }
      // Clean up resize observer
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }
    }
  }, [isOpen, initialLocation])

  // Initialize map - ONLY when modal opens
  useEffect(() => {
    if (!isOpen || initAttemptedRef.current) return

    initAttemptedRef.current = true

    const initMap = async () => {
      console.log("[LocationEditor] initMap started")
      try {
        // Load Leaflet CSS
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link")
          link.id = "leaflet-css"
          link.rel = "stylesheet"
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          link.crossOrigin = ""
          document.head.appendChild(link)

          // Wait for CSS
          await new Promise(resolve => setTimeout(resolve, 200))
        }

        // Check container exists and has dimensions
        const container = mapContainerRef.current
        if (!container) {
          console.error("Map container not found")
          setIsLoading(false)
          return
        }

        // Wait for container to have dimensions
        let attempts = 0
        while ((container.offsetWidth === 0 || container.offsetHeight === 0) && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 50))
          attempts++
        }

        if (container.offsetWidth === 0 || container.offsetHeight === 0) {
          console.error("Map container has no dimensions")
          setIsLoading(false)
          return
        }

        // Import Leaflet
        const L = await import("leaflet")

        const initialLat = initialLocation?.locationLatitude || DEFAULT_CENTER.lat
        const initialLng = initialLocation?.locationLongitude || DEFAULT_CENTER.lng

        // Create map
        const map = L.map(container, {
          center: [initialLat, initialLng],
          zoom: 13,
          zoomControl: false,
        })

        mapRef.current = map
        mapInitializedRef.current = true

        // Add zoom control
        L.control.zoom({
          position: "bottomright"
        }).addTo(map)

        // Add initial tile layer
        const isDark = (resolvedTheme || theme) === "dark"
        const tileLayer = L.tileLayer(
          isDark
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: isDark
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }
        )
        tileLayer.addTo(map)
        tileLayerRef.current = tileLayer

        // Create custom green marker
        const createGreenIcon = () => L.divIcon({
          className: "custom-green-marker",
          html: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#15803D" width="32" height="32" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        })

        // Add marker if location exists
        if (initialLocation?.locationLatitude && initialLocation?.locationLongitude) {
          const marker = L.marker(
            [initialLocation.locationLatitude, initialLocation.locationLongitude],
            { icon: createGreenIcon() }
          ).addTo(map)
          markerRef.current = marker
        }

        // Handle map clicks
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng
          setLatitude(lat)
          setLongitude(lng)

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
          } else {
            const marker = L.marker([lat, lng], { icon: createGreenIcon() }).addTo(map)
            markerRef.current = marker
          }

          reverseGeocode(lat, lng)
        })

        // Force size recalculation
        requestAnimationFrame(() => {
          map.invalidateSize()
          setTimeout(() => map.invalidateSize(), 300)
        })

        // Set up ResizeObserver to handle tab switching visibility changes
        if (mapContainerRef.current && !resizeObserverRef.current) {
          console.log("[LocationEditor] Setting up ResizeObserver")
          resizeObserverRef.current = new ResizeObserver((entries) => {
            for (const entry of entries) {
              const { width, height } = entry.contentRect
              console.log("[LocationEditor] ResizeObserver fired, dimensions:", width, "x", height)
              if (width > 0 && height > 0 && mapRef.current) {
                // Container is visible and has dimensions
                console.log("[LocationEditor] Container has dimensions, calling invalidateSize")
                mapRef.current.invalidateSize()
              }
            }
          })
          resizeObserverRef.current.observe(mapContainerRef.current)
        }

        setIsLoading(false)
        console.log("[LocationEditor] Map initialized successfully")
      } catch (error) {
        console.error("[LocationEditor] Map initialization error:", error)
        setIsLoading(false)
      }
    }

    // Delay to allow modal animation
    console.log("[LocationEditor] Scheduling map init in 300ms")
    const timer = setTimeout(initMap, 300)

    return () => {
      console.log("[LocationEditor] Cleanup - clearing timer")
      clearTimeout(timer)
      if (resizeObserverRef.current && mapContainerRef.current) {
        resizeObserverRef.current.unobserve(mapContainerRef.current)
      }
    }
  }, [isOpen]) // Only depend on isOpen

  // Handle tab changes - force map refresh when switching back to map tab
  useEffect(() => {
    if (activeTab === "map" && mapRef.current && mapInitializedRef.current) {
      console.log("[LocationEditor] Active tab is map, forcing refresh")
      // Small delay to let the visibility change take effect
      setTimeout(() => {
        if (mapRef.current) {
          const center = mapRef.current.getCenter()
          const zoom = mapRef.current.getZoom()
          // Force a minimal view change to trigger tile reload
          mapRef.current.setView(center, zoom, { animate: false })
          mapRef.current.invalidateSize(true)
          console.log("[LocationEditor] Map refresh completed")
        }
      }, 100)
    }
  }, [activeTab])

  // Handle theme changes separately
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return

    const L = require("leaflet")
    const isDark = (resolvedTheme || theme) === "dark"

    // Remove old tile layer
    mapRef.current.removeLayer(tileLayerRef.current)

    // Add new tile layer with correct theme
    const newTileLayer = L.tileLayer(
      isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: isDark
          ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    )
    newTileLayer.addTo(mapRef.current)
    tileLayerRef.current = newTileLayer
  }, [theme, resolvedTheme])

  // Reverse geocode
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()

      if (data.display_name) {
        setFormattedAddress(data.display_name)
        const addr = data.address
        if (addr) {
          if (addr.suburb || addr.neighbourhood) setBarangay(addr.suburb || addr.neighbourhood)
          if (addr.city || addr.town || addr.municipality) setMunicipality(addr.city || addr.town || addr.municipality)
          if (addr.state || addr.province) setProvince(addr.state || addr.province)
          if (addr.postcode) setPostalCode(addr.postcode)
        }
      }
    } catch (error) {
      console.error("Reverse geocoding error:", error)
    }
  }

  // Geocode address
  const handleGeocodeSearch = async () => {
    const searchQuery = [barangay, municipality, province, postalCode].filter(Boolean).join(", ")
    if (!searchQuery.trim()) {
      toast.error("Please enter at least one address field")
      return
    }

    setIsGeocoding(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ", Philippines")}&limit=1`
      )
      const data = await response.json()

      if (data?.length > 0) {
        const result = data[0]
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)

        setLatitude(lat)
        setLongitude(lng)
        setFormattedAddress(result.display_name)

        if (mapRef.current) {
          const L = require("leaflet")
          mapRef.current.setView([lat, lng], 15)

          const greenIcon = L.divIcon({
            className: "custom-green-marker",
            html: `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#15803D" width="32" height="32" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
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

  // Locate me
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

        if (mapRef.current) {
          const L = require("leaflet")
          mapRef.current.setView([lat, lng], 15)

          const greenIcon = L.divIcon({
            className: "custom-green-marker",
            html: `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#15803D" width="32" height="32" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                <path cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
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
        locationLatitude: null,
        locationLongitude: null,
        locationFormattedAddress: null,
        locationBarangay: null,
        locationMunicipality: null,
        locationProvince: null,
        locationPostalCode: null,
        address: null,
      })

      toast.success("Location cleared successfully")
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to clear location")
    } finally {
      setIsSaving(false)
    }
  }

  const hasExistingLocation = initialLocation?.locationLatitude && initialLocation?.locationLongitude

  return (
    <>
      <ResizableModal open={isOpen} onOpenChange={onClose}>
        <ResizableModalContent width="750px" height="650px" className="flex flex-col">
          <ResizableModalHeader>
            <ResizableModalTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#15803D]" />
              Edit Location
            </ResizableModalTitle>
          </ResizableModalHeader>

          <ResizableModalBody className="flex-1 p-0 overflow-hidden">
            <Tabs
              defaultValue="map"
              value={activeTab}
              onValueChange={(value) => {
                console.log("[LocationEditor] Tab changed to:", value)
                setActiveTab(value)
                // When switching back to map tab, invalidate size after animation
                if (value === "map" && mapRef.current) {
                  console.log("[LocationEditor] Switching to map tab, scheduling invalidateSize")
                    // Aggressive invalidateSize calls - needed because display:none to visible transition
                    // doesn't always trigger ResizeObserver properly
                    ;[50, 100, 200, 300, 500, 800].forEach((delay) => {
                      setTimeout(() => {
                        if (mapRef.current) {
                          console.log(`[LocationEditor] invalidateSize call at ${delay}ms`)
                          mapRef.current.invalidateSize(true) // true = animate pan
                        }
                      }, delay)
                    })
                }
              }}
              className="h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2 mx-6 mt-4 mb-0 rounded-b-none border-b-0">
                <TabsTrigger value="map">Map View</TabsTrigger>
                <TabsTrigger value="address">Address Input</TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="flex-1 flex flex-col mt-0 p-6 pt-4" forceMount>
                <div
                  className="relative flex-1 rounded-lg border border-border overflow-hidden bg-muted"
                  style={{
                    minHeight: "350px",
                    display: activeTab === 'map' ? 'block' : 'none'
                  }}
                >
                  <div
                    ref={mapContainerRef}
                    className="absolute inset-0 w-full h-full"
                    style={{ zIndex: 1 }}
                  />
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin h-6 w-6 border-2 border-[#15803D] border-t-transparent rounded-full" />
                        <p className="text-sm text-muted-foreground">Loading map...</p>
                      </div>
                    </div>
                  )}

                  {!isLoading && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleLocateMe}
                      className="absolute top-3 right-3 z-[400] shadow-md"
                    >
                      <Locate className="h-4 w-4 mr-2" />
                      Locate Me
                    </Button>
                  )}
                </div>

                <div className="bg-muted/50 rounded-lg p-4 mt-4 space-y-2">
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

              <TabsContent value="address" className={`flex flex-col gap-4 p-6 pt-4 overflow-y-auto ${activeTab !== 'address' ? 'hidden' : ''}`} forceMount>
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
                    <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                      <span>Lat: {latitude.toFixed(6)}</span>
                      <span>Lng: {longitude.toFixed(6)}</span>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </ResizableModalBody>

          <ResizableModalFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => setShowClearConfirm(true)}
              disabled={isSaving || !hasExistingLocation}
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

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Location Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the saved location from the database, including the coordinates and address details. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isSaving ? "Clearing..." : "Yes, Clear Location"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
