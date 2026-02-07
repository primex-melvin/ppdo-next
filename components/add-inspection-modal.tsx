"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Plus, Upload, X, CheckCircle2, Clock, ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type InspectionStatus = "pending" | "verified"

interface AddInspectionModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddInspectionModal({ open: externalOpen, onOpenChange }: AddInspectionModalProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen ?? internalOpen
  const setOpen = (value: boolean) => {
    setInternalOpen(value)
    onOpenChange?.(value)
  }
  const [status, setStatus] = useState<InspectionStatus>("pending")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))
    setImages((prev) => [...prev, ...files])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setImages((prev) => [...prev, ...files])
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Simulate submission
    console.log("[v0] Submitting inspection:", { status, description, imageCount: images.length })

    // Show success toast
    toast.success(`Inspection Added Successfully. Your ${status} inspection has been recorded with ${images.length} image(s).`)

    // Reset form and close modal
    setStatus("pending")
    setDescription("")
    setImages([])
    setOpen(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {!externalOpen && (
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Inspection
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Record New Inspection</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Status Selection - Visual Cards */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Status</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setStatus("pending")}
                  className={cn(
                    "relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
                    "hover:border-amber-300 hover:bg-amber-50",
                    status === "pending" ? "border-amber-500 bg-amber-50 shadow-md" : "border-gray-200 bg-white",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                      status === "pending" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400",
                    )}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900">Pending</p>
                    <p className="text-xs text-gray-500">Awaiting review</p>
                  </div>
                  {status === "pending" && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStatus("verified")}
                  className={cn(
                    "relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
                    "hover:border-green-300 hover:bg-green-50",
                    status === "verified" ? "border-green-500 bg-green-50 shadow-md" : "border-gray-200 bg-white",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                      status === "verified" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400",
                    )}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900">Verified</p>
                    <p className="text-xs text-gray-500">Approved</p>
                  </div>
                  {status === "verified" && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Image Upload - Drag and Drop */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Images</Label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer",
                  "hover:border-primary hover:bg-accent/5",
                  isDragging ? "border-primary bg-accent/10" : "border-gray-300",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Drop images here or click to browse</p>
                    <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, WebP (max 10MB each)</p>
                  </div>
                </div>
              </div>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {images.map((file, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={URL.createObjectURL(file) || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage(index)
                        }}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-xs text-white truncate">{file.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {images.length > 0 && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  {images.length} {images.length === 1 ? "image" : "images"} selected
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-semibold">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed notes about this inspection..."
                className="min-h-[120px] resize-none"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!description.trim() || images.length === 0}>
                Submit Inspection
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
