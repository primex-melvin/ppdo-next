"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Pencil, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"

interface EditableAgencyNameProps {
  id: string
  value: string | null | undefined
  onUpdate?: () => void
}

export function EditableAgencyName({ 
  id, 
  value, 
  onUpdate 
}: EditableAgencyNameProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || "")
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const updateAgency = useMutation(api.implementingAgencies.update)

  useEffect(() => {
    setEditValue(value || "")
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Handle click outside to cancel edit mode
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isEditing &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        handleCancel()
      }
    }

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isEditing])

  const handleSave = async () => {
    // Only save if value changed
    if (editValue.trim() === (value || "")) {
      setIsEditing(false)
      return
    }

    try {
      await updateAgency({
        id: id as any,
        fullName: editValue.trim() || undefined,
      })
      toast.success("Agency name updated successfully")
      setIsEditing(false)
      onUpdate?.()
    } catch (error: any) {
      toast.error("Failed to update agency name", { description: error.message })
      // Keep edit mode open on error so user can retry
    }
  }

  const handleCancel = useCallback(() => {
    setEditValue(value || "")
    setIsEditing(false)
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  const handleRowClick = () => {
    if (!isEditing) {
      setIsEditing(true)
    }
  }

  if (isEditing) {
    return (
      <div ref={containerRef} className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-10 text-lg md:text-xl"
          placeholder="Enter agency full name"
        />
        <button
          onClick={handleSave}
          className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded text-emerald-600"
        >
          <Check className="h-5 w-5" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="group flex items-center gap-2 py-1 px-2 -mx-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer w-fit"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleRowClick}
    >
      <p className="text-lg md:text-xl text-muted-foreground">
        {value || "No full name set"}
      </p>
      <span 
        className={`transition-all duration-200 ${
          isHovered 
            ? "opacity-100 translate-x-0" 
            : "opacity-0 -translate-x-2"
        } text-zinc-400`}
      >
        <Pencil className="h-4 w-4" />
      </span>
    </div>
  )
}
