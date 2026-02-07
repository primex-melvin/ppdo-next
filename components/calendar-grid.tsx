"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, BarChart3, TrendingUp, Images } from "lucide-react"
import { MOCK_SNAPSHOTS, MOCK_INSPECTIONS } from "@/lib/mock-data"

const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

function getLatestInspectionImages(year: number): string[] {
  const yearSnapshots = Object.entries(MOCK_SNAPSHOTS)
    .filter(([dateStr]) => dateStr.startsWith(String(year)))
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12)

  return yearSnapshots
    .map(([_, snapshots]) => {
      const snapshot = snapshots[0]
      const inspection = MOCK_INSPECTIONS.find((insp) => insp.id === snapshot.id)
      return inspection?.activities?.[0]?.images?.[0] || `/placeholder.svg?height=200&width=300&query=infrastructure inspection`
    })
    .filter((img) => img)
}

export function CalendarGrid({ year: initialYear, projectId }: { year: number; projectId?: string }) {
  const [startYear, setStartYear] = useState(initialYear)
  const [endYear, setEndYear] = useState(initialYear + 1)
  const [viewMode, setViewMode] = useState<"monthly" | "weekly" | "yearly">("monthly")
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const savedStartYear = localStorage.getItem("ppdo_start_year")
    const savedEndYear = localStorage.getItem("ppdo_end_year")
    const savedViewMode = localStorage.getItem("ppdo_view_mode")

    if (savedStartYear) setStartYear(Number.parseInt(savedStartYear))
    if (savedEndYear) setEndYear(Number.parseInt(savedEndYear))
    if (savedViewMode) setViewMode(savedViewMode as "monthly" | "weekly" | "yearly")
  }, [])

  const latestImages = getLatestInspectionImages(endYear)

  const handleYearRangeChange = (values: number[]) => {
    const newStart = Math.min(values[0], values[1])
    const newEnd = Math.max(values[0], values[1])
    setStartYear(newStart)
    setEndYear(newEnd)
    localStorage.setItem("ppdo_start_year", newStart.toString())
    localStorage.setItem("ppdo_end_year", newEnd.toString())
  }

  const handleViewModeChange = (mode: "monthly" | "weekly" | "yearly") => {
    setViewMode(mode)
    localStorage.setItem("ppdo_view_mode", mode)
  }

  const handleDateClick = (dateStr: string) => {
    if (MOCK_SNAPSHOTS[dateStr]) {
      const url = projectId
        ? `/inspector/${MOCK_SNAPSHOTS[dateStr][0].id}?projectId=${projectId}`
        : `/inspector/${MOCK_SNAPSHOTS[dateStr][0].id}`
      router.push(url)
    }
  }

  const handleDateHover = (dateStr: string, e: React.MouseEvent) => {
    if (MOCK_SNAPSHOTS[dateStr]) {
      const rect = e.currentTarget.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (containerRect) {
        setTooltipPos({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top + rect.height,
        })
        setActiveDate(dateStr)
      }
    }
  }

  const handleDateLeave = () => {
    setActiveDate(null)
  }

  return (
    <div ref={containerRef} className="relative space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl border border-border/50">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="rounded-full font-bold h-9 gap-2"
            >
              {showAnalytics ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showAnalytics ? "Hide Analytics" : "Show Analytics"}
            </Button>
            <div className="h-4 w-px bg-border" />
            <p className="text-sm font-black text-primary uppercase tracking-tighter italic">Inspection Timeline</p>
          </div>

          <div className="flex items-center gap-2 bg-background p-1 rounded-lg border border-border">
            {(["monthly", "weekly", "yearly"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleViewModeChange(mode)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all",
                  viewMode === mode
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode === "monthly" && "Monthly"}
                {mode === "weekly" && "Weekly"}
                {mode === "yearly" && "Yearly"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-4 bg-card rounded-xl border border-border/50">
          <div className="flex items-center gap-4 flex-1">
            <div className="text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase">From</p>
              <p className="text-lg font-black text-foreground">{startYear}</p>
            </div>
            <div className="flex-1 px-4">
              <Slider
                value={[startYear, endYear]}
                min={2020}
                max={2030}
                step={1}
                onValueChange={handleYearRangeChange}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-medium mt-2">
                <span>2020</span>
                <span>2030</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase">To</p>
              <p className="text-lg font-black text-primary">{endYear}</p>
            </div>
          </div>
        </div>
      </div>

      {showAnalytics && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between p-6 bg-primary/[0.03] border border-primary/10 rounded-2xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-black uppercase tracking-widest text-primary">
                  Daily Inspection Analytics
                </h4>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Real-time trend of inspections ({startYear} - {endYear})
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Peak Day</p>
                <p className="text-sm font-black text-foreground">Jan 30, {endYear}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Avg/Month</p>
                <p className="text-sm font-black text-foreground">1</p>
              </div>
            </div>
          </div>
          <div className="h-32 bg-card border border-dashed rounded-xl flex items-center justify-center text-muted-foreground text-xs font-medium">
            <BarChart3 className="h-4 w-4 mr-2" />
            Inspection Activity Visualization
          </div>
        </div>
      )}

      <div className="bg-card border rounded-xl p-4 overflow-hidden shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Images className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-black uppercase tracking-widest text-primary">Latest Inspections ({endYear})</h4>
        </div>
        <div className="overflow-x-auto scrollbar-none hover:scrollbar-thin transition-all">
          <div className="flex gap-3 pb-2 min-w-max">
            {latestImages.length > 0 ? (
              latestImages.map((img, idx) => (
                <div
                  key={idx}
                  className="shrink-0 w-52 h-36 rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:scale-[1.02] cursor-pointer relative group bg-muted"
                >
                  <img
                    src={img || "/placeholder.svg"}
                    alt={`Inspection ${idx + 1}`}
                    className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all"
                    onError={(e) => {
                      e.currentTarget.src = `/placeholder.svg?height=200&width=300&query=infrastructure inspection`
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white font-bold uppercase tracking-tight">View Inspection</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full py-8 text-center text-muted-foreground text-sm">No inspections for {endYear}</div>
            )}
          </div>
        </div>
      </div>

      {viewMode === "monthly" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 pt-4">
          {months.map((month, idx) => (
            <MonthCalendar
              key={month}
              name={month}
              monthIndex={idx}
              year={endYear}
              activeDate={activeDate}
              onDateClick={handleDateClick}
              onDateHover={handleDateHover}
              onDateLeave={handleDateLeave}
            />
          ))}
        </div>
      )}

      {viewMode === "yearly" && <YearlyView year={endYear} onDateClick={handleDateClick} activeDate={activeDate} />}

      {viewMode === "weekly" && <WeeklyView year={endYear} onDateClick={handleDateClick} activeDate={activeDate} />}

      {activeDate && (
        <div
          className="absolute z-50 bg-white border border-gray-300 shadow-lg rounded-md px-3 py-2 text-xs pointer-events-none"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y + 8}px`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-semibold">{MOCK_SNAPSHOTS[activeDate].length} inspections</p>
          <p className="text-gray-500 text-[10px]">Click to view details</p>
        </div>
      )}
    </div>
  )
}

function MonthCalendar({
  name,
  monthIndex,
  year,
  activeDate,
  onDateClick,
  onDateHover,
  onDateLeave,
}: {
  name: string
  monthIndex: number
  year: number
  activeDate: string | null
  onDateClick: (dateStr: string) => void
  onDateHover: (dateStr: string, e: React.MouseEvent) => void
  onDateLeave: () => void
}) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, monthIndex, 1).getDay()

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i)

  const getSnapshotColor = (day: number) => {
    const monthStr = String(monthIndex + 1).padStart(2, "0")
    const snapshots = MOCK_SNAPSHOTS[`${year}-${monthStr}-${String(day).padStart(2, "0")}`]
    if (!snapshots) return ""

    const allVerified = snapshots.every((s) => s.status === "green")
    if (allVerified) return "bg-green-200/80"
    return "bg-sky-200/80"
  }

  const getSnapshotSize = (day: number) => {
    const monthStr = String(monthIndex + 1).padStart(2, "0")
    const snapshots = MOCK_SNAPSHOTS[`${year}-${monthStr}-${String(day).padStart(2, "0")}`]
    if (!snapshots) return ""

    const count = snapshots.length
    if (count >= 5) return "w-10 h-10"
    if (count >= 3) return "w-8 h-8"
    return "w-6 h-6"
  }

  return (
    <div className="flex flex-col">
      <h3 className="text-center font-bold text-gray-500 mb-4 text-sm">{name}</h3>
      <div className="grid grid-cols-7 gap-y-4">
        {blanks.map((b) => (
          <div key={`blank-${b}`} />
        ))}
        {days.map((day) => {
          const monthStr = String(monthIndex + 1).padStart(2, "0")
          const dateStr = `${year}-${monthStr}-${String(day).padStart(2, "0")}`
          const hasSnapshots = !!MOCK_SNAPSHOTS[dateStr]
          const isActive = activeDate === dateStr

          return (
            <div key={day} className="relative flex items-center justify-center h-8 w-8 group">
              <span className="relative z-10 text-[10px] text-gray-600 font-medium select-none">{day}</span>
              {hasSnapshots && (
                <div
                  onClick={() => onDateClick(dateStr)}
                  onMouseEnter={(e) => onDateHover(dateStr, e)}
                  onMouseLeave={onDateLeave}
                  className={cn(
                    "absolute rounded-full transition-all cursor-pointer",
                    getSnapshotColor(day),
                    getSnapshotSize(day),
                    isActive ? "ring-2 ring-gray-400" : "hover:scale-110",
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function YearlyView({
  year,
  onDateClick,
  activeDate,
}: {
  year: number
  onDateClick: (dateStr: string) => void
  activeDate: string | null
}) {
  return (
    <div className="pt-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {months.map((month, idx) => {
          const daysInMonth = new Date(year, idx + 1, 0).getDate()
          const firstDayOfMonth = new Date(year, idx, 1).getDay()
          const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
          const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i)

          const getSnapshotColor = (day: number) => {
            const monthStr = String(idx + 1).padStart(2, "0")
            const snapshots = MOCK_SNAPSHOTS[`${year}-${monthStr}-${String(day).padStart(2, "0")}`]
            if (!snapshots) return ""
            const allVerified = snapshots.every((s) => s.status === "green")
            return allVerified ? "bg-green-300/60" : "bg-sky-300/60"
          }

          const getSnapshotSize = (day: number) => {
            const monthStr = String(idx + 1).padStart(2, "0")
            const snapshots = MOCK_SNAPSHOTS[`${year}-${monthStr}-${String(day).padStart(2, "0")}`]
            if (!snapshots) return "w-3 h-3"
            return "w-4 h-4"
          }

          return (
            <div
              key={month}
              className="bg-card border rounded-lg p-3 hover:border-primary/50 transition-all hover:shadow-md"
            >
              <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase text-center">{month}</h4>
              <div className="grid grid-cols-7 gap-1">
                {blanks.map((b) => (
                  <div key={`blank-${b}`} className="h-4" />
                ))}
                {days.map((day) => {
                  const monthStr = String(idx + 1).padStart(2, "0")
                  const dateStr = `${year}-${monthStr}-${String(day).padStart(2, "0")}`
                  const hasSnapshots = !!MOCK_SNAPSHOTS[dateStr]

                  return (
                    <div key={day} className="relative h-4 w-4 flex items-center justify-center group">
                      {hasSnapshots ? (
                        <div
                          onClick={() => onDateClick(dateStr)}
                          className={cn(
                            "rounded-full cursor-pointer transition-all",
                            getSnapshotColor(day),
                            getSnapshotSize(day),
                            activeDate === dateStr ? "ring-1 ring-gray-400" : "hover:scale-125",
                          )}
                        />
                      ) : (
                        <span className="text-[8px] text-gray-300 font-medium">{day}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeeklyView({
  year,
  onDateClick,
  activeDate,
}: {
  year: number
  onDateClick: (dateStr: string) => void
  activeDate: string | null
}) {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const currentDate = today.getDate()

  // Get week starting from Monday
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const weekStart = getWeekStart(new Date(year, currentMonth, currentDate))
  const weeks = []

  // Generate 4 weeks starting from current week
  for (let w = 0; w < 4; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + w * 7 + d)
      week.push(date)
    }
    weeks.push(week)
  }

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return (
    <div className="pt-4 space-y-4">
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="bg-card border rounded-lg p-4 hover:shadow-md transition-all">
          <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">
            Week of {week[0].toLocaleDateString()} - {week[6].toLocaleDateString()}
          </p>
          <div className="grid grid-cols-7 gap-3">
            {week.map((date, dayIdx) => {
              const year = date.getFullYear()
              const month = String(date.getMonth() + 1).padStart(2, "0")
              const day = String(date.getDate()).padStart(2, "0")
              const dateStr = `${year}-${month}-${day}`
              const hasSnapshots = !!MOCK_SNAPSHOTS[dateStr]

              const getSnapshotColor = () => {
                const snapshots = MOCK_SNAPSHOTS[dateStr]
                if (!snapshots) return ""
                const allVerified = snapshots.every((s) => s.status === "green")
                return allVerified ? "bg-green-200/80" : "bg-sky-200/80"
              }

              return (
                <div
                  key={dayIdx}
                  className={cn(
                    "p-2 rounded-lg text-center cursor-pointer transition-all hover:bg-muted/50",
                    hasSnapshots ? "border-2 border-primary/30" : "border border-border/30",
                  )}
                  onClick={() => hasSnapshots && onDateClick(dateStr)}
                >
                  <p className="text-[10px] font-bold text-gray-500">{dayNames[dayIdx]}</p>
                  <p className="text-sm font-bold text-gray-700">{date.getDate()}</p>
                  {hasSnapshots && <div className={cn("w-2 h-2 rounded-full mx-auto mt-1", getSnapshotColor())} />}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
