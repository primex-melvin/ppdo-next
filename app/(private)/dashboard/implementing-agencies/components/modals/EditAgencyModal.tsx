"use client"

import { useState, useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Edit, Building2, AlertTriangle, Info } from "lucide-react"
import { Agency } from "../../types/agency-table.types"

interface EditAgencyModalProps {
  agency: Agency | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditAgencyModal({ agency, open, onOpenChange, onSuccess }: EditAgencyModalProps) {
  const [code, setCode] = useState("")
  const [fullName, setFullName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ code?: string; fullName?: string }>({})

  const updateAgency = useMutation(api.implementingAgencies.update)

  // Reset form when agency changes
  useEffect(() => {
    if (agency) {
      setCode(agency.code)
      setFullName(agency.fullName)
      setErrors({})
    }
  }, [agency, open])

  // Check if agency has any associated projects/breakdowns
  const hasAssociations = agency && (
    (agency.totalProjects ?? 0) > 0 || 
    (agency.totalBreakdowns ?? 0) > 0
  )

  const validateForm = (): boolean => {
    const newErrors: { code?: string; fullName?: string } = {}

    if (!code.trim()) {
      newErrors.code = "Code is required"
    } else if (!/^[A-Z0-9_ ]+$/.test(code.toUpperCase())) {
      newErrors.code = "Code must contain only uppercase letters, numbers, spaces, and underscores"
    }

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required"
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agency || !validateForm()) return

    setIsSubmitting(true)

    try {
      // If agency has associations and code is being changed, prevent it
      if (hasAssociations && code !== agency.code) {
        toast.error("Cannot change code - agency has associated projects/breakdowns", {
          description: "Remove all associations first, or only edit the full name.",
        })
        setIsSubmitting(false)
        return
      }

      await updateAgency({
        id: agency._id as Id<"implementingAgencies">,
        code: code.toUpperCase(),
        fullName: fullName.trim(),
      })

      toast.success("Agency updated successfully")
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast.error("Failed to update agency", {
        description: error.message || "Please try again",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
    }
  }

  if (!agency) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto resize-x min-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Edit Agency
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Update agency details. Changes will be reflected immediately.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Code Field */}
          <div className="space-y-2">
            <Label htmlFor="code" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Agency Code
            </Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                if (errors.code) setErrors({ ...errors, code: undefined })
              }}
              placeholder="e.g., PEO, DPWH"
              disabled={isSubmitting || (hasAssociations ?? false)}
              className={`font-mono uppercase ${errors.code ? "border-red-500 focus-visible:ring-red-500" : ""} ${hasAssociations ? "bg-muted cursor-not-allowed" : ""}`}
            />
            {errors.code && (
              <p className="text-xs text-red-500">{errors.code}</p>
            )}
            {hasAssociations ? (
              <Alert className="py-2 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-xs text-amber-700 dark:text-amber-300">
                  Code cannot be changed - this agency has {(agency.totalProjects ?? 0) + (agency.totalBreakdowns ?? 0)} associated project(s)/breakdown(s).
                </AlertDescription>
              </Alert>
            ) : (
              <p className="text-xs text-muted-foreground">
                Unique identifier. Use uppercase letters, numbers, and underscores only.
              </p>
            )}
          </div>

          {/* Full Name Field */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Full Name
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (errors.fullName) setErrors({ ...errors, fullName: undefined })
              }}
              placeholder="e.g., Provincial Engineering Office"
              disabled={isSubmitting}
              className={errors.fullName ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.fullName && (
              <p className="text-xs text-red-500">{errors.fullName}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The complete name of the agency as it will appear in reports and documents.
            </p>
          </div>

          {/* Info Alert */}
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
              Editing this agency will update it across all projects and breakdowns immediately.
            </AlertDescription>
          </Alert>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (code === agency.code && fullName === agency.fullName)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
