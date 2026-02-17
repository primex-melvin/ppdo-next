"use client"

import { useState, useRef, useEffect } from "react"
import { Pencil, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"

interface EditableContactItemProps {
  id: string
  icon: React.ReactNode
  label: string
  value: string | null | undefined
  fieldName: "contactPerson" | "contactEmail" | "contactPhone" | "address"
  placeholder?: string
  onUpdate?: () => void
}

export function EditableContactItem({ 
  id, 
  icon, 
  label, 
  value, 
  fieldName,
  placeholder = "N/A",
  onUpdate 
}: EditableContactItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || "")
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
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

  const handleSave = async () => {
    try {
      await updateAgency({
        id: id as any,
        [fieldName]: editValue.trim() || undefined,
      })
      toast.success(`${label} updated successfully`)
      setIsEditing(false)
      onUpdate?.()
    } catch (error: any) {
      toast.error(`Failed to update ${label}`, { description: error.message })
    }
  }

  const handleCancel = () => {
    setEditValue(value || "")
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 text-sm"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
          <button
            onClick={handleSave}
            className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded text-emerald-600"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <span className="text-zinc-400">{icon}</span>
      </div>
    )
  }

  return (
    <div 
      className="group flex items-center justify-end gap-2 py-1 px-2 -mx-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-grab active:cursor-grabbing"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-sm text-muted-foreground text-right">
        {value || placeholder}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        className={`p-1 rounded transition-all duration-200 ${
          isHovered 
            ? "opacity-100 translate-x-0" 
            : "opacity-0 translate-x-2 pointer-events-none"
        } hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500`}
      >
        <Pencil className="h-3 w-3" />
      </button>
      <span className="text-zinc-400">{icon}</span>
    </div>
  )
}
