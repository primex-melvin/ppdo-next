"use client"

import { useState, useCallback } from "react"
import { Building2, TrendingUp, FileText, Users, Loader2 } from "lucide-react"
import { ThemeToggle } from "@/components/shared"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import { ImplementingAgenciesTable } from "./components/table"
import { Agency } from "./types/agency-table.types"

// Helper function for currency formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function ImplementingAgenciesPage() {
  const implementingAgencies = useQuery(api.implementingAgencies.list, { includeInactive: true })
  const removeAgency = useMutation(api.implementingAgencies.remove)

  // Calculate totals safely (only active agencies)
  const activeAgencies = implementingAgencies?.filter(a => a.isActive) || []
  const totalAgencies = activeAgencies.length
  const totalProjects = activeAgencies.reduce((sum, agency) => sum + (agency.totalProjects || 0), 0)
  const totalBudget = activeAgencies.reduce((sum, agency) => sum + (agency.totalBudget || 0), 0)
  const totalUtilized = activeAgencies.reduce((sum, agency) => sum + (agency.utilizedBudget || 0), 0)

  // Avoid division by zero
  const avgUtilization = totalBudget > 0 ? ((totalUtilized / totalBudget) * 100).toFixed(1) : "0.0"

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this agency?")) return
    try {
      await removeAgency({ id: id as Id<"implementingAgencies"> })
      toast.success("Agency deleted successfully")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete agency")
    }
  }, [removeAgency])

  if (implementingAgencies === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#15803D]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-10 space-y-8">
        {/* Page Title */}
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-cinzel font-bold tracking-tight">Implementing Agencies</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-3xl">
            Comprehensive overview of government agencies responsible for executing development projects across the
            province.
          </p>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-card border rounded-xl p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#15803D20" }}>
                <Building2 className="h-5 w-5" style={{ color: "#15803D" }} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Agencies</p>
              <p className="text-3xl font-bold font-cinzel">{totalAgencies}</p>
              <p className="text-xs text-muted-foreground">Active implementing bodies</p>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#15803D20" }}>
                <FileText className="h-5 w-5" style={{ color: "#15803D" }} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Projects</p>
              <p className="text-3xl font-bold font-cinzel">{totalProjects}</p>
              <p className="text-xs text-muted-foreground">Across all agencies</p>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#15803D20" }}>
                <TrendingUp className="h-5 w-5" style={{ color: "#15803D" }} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl md:text-3xl font-bold font-cinzel">{formatCurrency(totalBudget)}</p>
              <p className="text-xs text-muted-foreground">Allocated funding</p>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#15803D20" }}>
                <Users className="h-5 w-5" style={{ color: "#15803D" }} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Utilization Rate</p>
              <p className="text-3xl font-bold font-cinzel">{avgUtilization}%</p>
              <p className="text-xs text-muted-foreground">Budget efficiency</p>
            </div>
          </div>
        </div>

        {/* Implementing Agencies Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl md:text-2xl font-cinzel font-semibold">All Agencies</h3>
            <p className="text-sm text-muted-foreground">{implementingAgencies.length} agencies found</p>
          </div>

          <ImplementingAgenciesTable
            agencies={implementingAgencies as Agency[]}
            onDelete={handleDelete}
          />
        </div>
      </main>
    </div>
  )
}
