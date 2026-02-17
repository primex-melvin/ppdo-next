"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Agency } from "../types/agency-table.types"
import { Loader2, Building2, FileText, CheckCircle2 } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AgencyGalleryProps {
  agencies: Agency[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Individual agency folder component with loading state and tooltip
function AgencyFolder({ agency }: { agency: Agency }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = useCallback(() => {
    setIsLoading(true)
    router.push(`/dashboard/implementing-agencies/${agency._id}`)
  }, [router, agency._id])

  const utilizationRate = agency.totalBudget > 0
    ? ((agency.utilizedBudget / agency.totalBudget) * 100).toFixed(1)
    : "0.0"

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all duration-200 cursor-pointer relative"
          >
            {/* Folder Icon Container */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
              {/* Loading Spinner Overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/20 rounded-lg">
                  <Loader2 className="h-8 w-8 animate-spin text-white drop-shadow-lg" />
                </div>
              )}
              
              {/* Folder SVG */}
              <svg
                className={`w-full h-full drop-shadow-md transition-opacity duration-200 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Shadow */}
                <path
                  d="M12 48C10.3431 48 9 46.6569 9 45V16C9 14.3431 10.3431 13 12 13H26L28 17H52C53.6569 17 55 18.3431 55 20V45C55 46.6569 53.6569 48 52 48H12Z"
                  className="fill-black/10 translate-x-0.5 translate-y-0.5"
                />
                {/* Folder body - main yellow */}
                <path
                  d="M8 44C8 45.6569 9.34315 47 11 47H50C51.6569 47 53 45.6569 53 44V19C53 17.3431 51.6569 16 50 16H26L24 12H11C9.34315 12 8 13.3431 8 15V44Z"
                  className="fill-yellow-400 dark:fill-yellow-500 group-hover:fill-yellow-500 dark:group-hover:fill-yellow-400 transition-colors"
                />
                {/* Folder tab - lighter yellow */}
                <path
                  d="M8 15C8 13.3431 9.34315 12 11 12H26L28 16H50C51.6569 16 53 17.3431 53 19V21H8V15Z"
                  className="fill-yellow-300 dark:fill-yellow-600 group-hover:fill-yellow-400 dark:group-hover:fill-yellow-500 transition-colors"
                />
                {/* Top highlight */}
                <path
                  d="M11 12H26L28 16H50C51.6569 16 53 17.3431 53 19V20H8V15C8 13.3431 9.34315 12 11 12Z"
                  className="fill-white/30"
                />
                {/* Left edge highlight */}
                <path
                  d="M8 15V44C8 45.6569 9.34315 47 11 47H12V15C12 13.3431 10.6569 12 9 12H8V15Z"
                  className="fill-white/20"
                />
                {/* Bottom shadow */}
                <path
                  d="M11 46H50C51.6569 46 53 44.6569 53 43V44C53 45.6569 51.6569 47 50 47H11C9.34315 47 8 45.6569 8 44V43C8 44.6569 9.34315 46 11 46Z"
                  className="fill-black/15"
                />
              </svg>
            </div>

            {/* Agency Name */}
            <div className="w-full text-center">
              <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                {agency.name}
              </p>
              <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {agency.code}
              </p>
            </div>
          </div>
        </TooltipTrigger>
        
        {/* Tooltip Content - Agency Summary */}
        <TooltipContent 
          side="top" 
          align="center"
          className="max-w-xs p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg"
        >
          <div className="space-y-3">
            {/* Agency Header */}
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-zinc-500 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  {agency.fullName}
                </p>
                <p className="text-xs text-zinc-500">
                  {agency.code}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-zinc-500 mb-1">
                  <FileText className="h-3 w-3" />
                </div>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{agency.totalProjects || 0}</p>
                <p className="text-[10px] text-zinc-500">Projects</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-emerald-500 mb-1">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{agency.completedProjects || 0}</p>
                <p className="text-[10px] text-zinc-500">Completed</p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-500 mb-1">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{agency.activeProjects || 0}</p>
                <p className="text-[10px] text-zinc-500">Active</p>
              </div>
            </div>

            {/* Budget Info */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Total Budget:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{formatCurrency(agency.totalBudget || 0)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Utilized:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(agency.utilizedBudget || 0)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Utilization Rate:</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{utilizationRate}%</span>
              </div>
            </div>

            {/* Click Hint */}
            <p className="text-[10px] text-zinc-400 text-center pt-1">
              Click to view details
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function AgencyGallery({ agencies }: AgencyGalleryProps) {
  if (agencies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          No agencies found
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-in fade-in zoom-in-95 duration-300">
      {agencies.map((agency) => (
        <AgencyFolder key={agency._id} agency={agency} />
      ))}
    </div>
  )
}
