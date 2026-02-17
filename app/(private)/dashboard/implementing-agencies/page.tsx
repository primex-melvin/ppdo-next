"use client"

import { useState, useCallback } from "react"
import { Building2, TrendingUp, FileText, Users, Loader2, Eye, EyeOff, LayoutGrid, List } from "lucide-react"
import { ThemeToggle } from "@/components/shared"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import { ImplementingAgenciesTable } from "./components/table"
import { Agency } from "./types/agency-table.types"
import { DeleteAgencyModal } from "./components/modals/DeleteAgencyModal"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AgencyGallery } from "./components/AgencyGallery"

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

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAgencyId, setSelectedAgencyId] = useState<Id<"implementingAgencies"> | null>(null)

  // Statistics Visibility State
  const [showStatistics, setShowStatistics] = useState(false)

  // Calculate totals safely (only active agencies)
  const activeAgencies = implementingAgencies?.filter(a => a.isActive) || []
  const totalAgencies = activeAgencies.length
  const totalProjects = activeAgencies.reduce((sum, agency) => sum + (agency.totalProjects || 0), 0)
  const totalBudget = activeAgencies.reduce((sum, agency) => sum + (agency.totalBudget || 0), 0)
  const totalUtilized = activeAgencies.reduce((sum, agency) => sum + (agency.utilizedBudget || 0), 0)

  // Avoid division by zero
  const avgUtilization = totalBudget > 0 ? ((totalUtilized / totalBudget) * 100).toFixed(1) : "0.0"

  const handleDelete = useCallback((id: string) => {
    setSelectedAgencyId(id as Id<"implementingAgencies">)
    setDeleteModalOpen(true)
  }, [])

  const handleDeleteSuccess = useCallback(() => {
    setDeleteModalOpen(false)
    setSelectedAgencyId(null)
  }, [])

  if (implementingAgencies === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#15803D]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      <DeleteAgencyModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        agencyId={selectedAgencyId}
        onSuccess={handleDeleteSuccess}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-10 space-y-8">
        <Tabs defaultValue="table" className="space-y-8">
          {/* Page Title & Actions */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-cinzel font-bold tracking-tight">Implementing Agencies</h2>
              <p className="text-muted-foreground text-base md:text-lg max-w-3xl">
                Comprehensive overview of offices or agencies responsible for executing development projects across the
                province.
              </p>


            </div>

            <Button
              onClick={() => setShowStatistics(!showStatistics)}
              variant="outline"
              size="sm"
              className="gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 self-start md:self-auto"
            >
              {showStatistics ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Hide Statistics</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Show Statistics</span>
                </>
              )}
            </Button>
          </div>

          {/* Statistics Overview */}
          {showStatistics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
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
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <TabsList className="grid w-full max-w-[200px] grid-cols-2">
              <TabsTrigger value="gallery" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Gallery</span>
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Table</span>
              </TabsTrigger>
            </TabsList>
            <p className="text-sm text-muted-foreground">{implementingAgencies.length} found</p>
          </div>

          {/* Implementing Agencies Data */}
          <TabsContent value="table" className="animate-in fade-in slide-in-from-bottom-4 duration-500">

            <ImplementingAgenciesTable
              agencies={implementingAgencies as Agency[]}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="gallery" className="">
            <AgencyGallery agencies={implementingAgencies as Agency[]} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
