"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageLightboxProps {
  images: string[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
}

export function ImageLightbox({ images, initialIndex, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setIsZoomed(false)
  }, [images.length])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setIsZoomed(false)
  }, [images.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === "ArrowRight") handleNext()
      if (e.key === "ArrowLeft") handlePrev()
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, handleNext, handlePrev, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/60 to-transparent">
        <div className="text-sm font-bold tracking-tight italic">
          Image {currentIndex + 1} of {images.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsZoomed(!isZoomed)}
            className="text-white hover:bg-white/10"
          >
            {isZoomed ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12 overflow-hidden">
        <div
          className={cn(
            "relative max-w-full max-h-full transition-transform duration-500 cursor-zoom-in",
            isZoomed ? "scale-125 cursor-zoom-out" : "scale-100",
          )}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          <img
            src={images[currentIndex] || "/placeholder.svg"}
            alt={`Gallery image ${currentIndex + 1}`}
            className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm"
          />
        </div>

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12 rounded-full hidden md:flex"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12 rounded-full hidden md:flex"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          </>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              "w-12 h-12 rounded-md overflow-hidden border-2 transition-all",
              currentIndex === idx
                ? "border-primary scale-110 shadow-lg"
                : "border-transparent opacity-50 hover:opacity-100",
            )}
          >
            <img src={img || "/placeholder.svg"} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
