"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

// <CHANGE> Removed extra tabs (Collections, Changes, Summary, Site Map, URLs) per user request
const tabs = ["Calendar"]

export function WaybackNav() {
  const [activeTab, setActiveTab] = useState("Calendar")

  return (
    <div className="flex items-center justify-center gap-6 text-lg font-medium">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={cn(
            "relative px-4 py-1 transition-colors",
            activeTab === tab ? "bg-[#cc0000] text-white rounded-full" : "text-[#0645ad] hover:underline",
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
