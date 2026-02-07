"use client"

import { Shield, Bell, ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface InspectorPortalHeaderProps {
  provinceName?: string
}

export function InspectorPortalHeader({ provinceName = "Tarlac" }: InspectorPortalHeaderProps) {
  return (
    <div className="border-b bg-card sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary shadow-lg shadow-primary/20">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="h-8 w-px bg-border mx-1 hidden sm:block" />
            <div>
              <h1 className="text-xl font-black text-primary tracking-tight">PPDO - Inspector</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Province of {provinceName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-card" />
            </Button>

            <div className="h-8 w-px bg-border mx-1" />

            <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-muted transition-colors group">
              <Avatar className="h-8 w-8 border-2 border-transparent group-hover:border-primary/20 transition-all">
                <AvatarImage src="/professional-man-avatar.png" alt="User" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left mr-1">
                <p className="text-xs font-bold leading-none">Admin User</p>
                <p className="text-[10px] text-muted-foreground font-medium">Provincial Inspector</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
