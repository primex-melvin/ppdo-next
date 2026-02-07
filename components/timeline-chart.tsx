"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

export function TimelineChart() {
  const years = Array.from({ length: 24 }, (_, i) => 2003 + i)

  return (
    <div className="w-full">
      <div className="relative bg-[#eee] border border-gray-300 h-24 flex items-end">
        {/* Mock data bars */}
        <div className="absolute inset-0 flex items-end px-1 gap-[2px]">
          {years.map((year) => (
            <div key={year} className="flex-1 flex flex-col items-center group relative">
              <div
                className={cn("w-full bg-black transition-all", year === 2026 ? "bg-yellow-200" : "")}
                style={{ height: `${Math.random() * 80 + 10}%` }}
              />
              <span className="absolute -bottom-6 text-[10px] font-medium text-gray-600">{year}</span>

              {year === 2026 && <div className="absolute inset-0 bg-yellow-200/50 -z-10" />}
            </div>
          ))}
          {/* Active year highlight */}
          <div className="absolute right-0 bottom-0 top-0 w-[4.1%] bg-black flex items-center justify-center">
            <span className="text-white text-xs font-bold font-mono">2026</span>
          </div>
        </div>
      </div>

      {/* Scrollbar UI */}
      <div className="mt-8 flex items-center gap-2">
        <ChevronLeft className="h-5 w-5 text-gray-400 cursor-pointer" />
        <div className="flex-1 h-3 bg-gray-200 rounded-full relative">
          <div className="absolute right-0 top-0 bottom-0 w-2/3 bg-gray-400 rounded-full" />
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 cursor-pointer" />
      </div>
    </div>
  )
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ")
}
