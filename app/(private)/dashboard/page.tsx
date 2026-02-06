// app/dashboard/page.tsx
"use client";

/**
 * Main Dashboard Landing Page
 *
 * Displays fiscal year cards as the primary dashboard interface.
 * Users select a fiscal year to view year-specific analytics.
 *
 * Features global search overlay that appears on click.
 */

import { FiscalYearLanding, DashboardFundSelection } from "@/components/features/ppdo/dashboard/landing";
import { DashboardSearch } from "@/components/features/ppdo/dashboard/DashboardSearch";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchTriggerRef = useRef<HTMLDivElement>(null);

  const handleSelectFund = (fundId: string) => {
    router.push(`/dashboard?view=years&fund=${fundId}`);
  };

  const handleBackToSelection = () => {
    router.push("/dashboard");
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  // Handle ESC key to close search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !isSearchActive) {
        event.preventDefault();
        setIsSearchActive(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSearchActive]);

  if (view === "years") {
    return <FiscalYearLanding onBack={handleBackToSelection} />;
  }

  return (
    <div className="relative">
      {/* Main Dashboard Content */}
      <div className={cn(
        "transition-all duration-300",
        isSearchActive ? "opacity-20 blur-sm pointer-events-none" : "opacity-100"
      )}>
        {/* Search Trigger Bar */}
        <div 
          ref={searchTriggerRef}
          className="mb-8 max-w-2xl mx-auto"
        >
          <div
            onClick={() => setIsSearchActive(true)}
            className={cn(
              "flex items-center gap-3 px-6 py-4 rounded-xl cursor-pointer",
              "bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800",
              "hover:border-blue-400 dark:hover:border-blue-600",
              "hover:shadow-lg transition-all duration-200 group"
            )}
          >
            <Search className="w-5 h-5 text-zinc-400 group-hover:text-blue-500 transition-colors" />
            <span className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300">
              Search across all funds and particulars...
            </span>
            <div className="ml-auto flex items-center gap-1 text-xs text-zinc-400">
              <kbd className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">/</kbd>
            </div>
          </div>
        </div>

        {/* Fund Selection Cards -- Header is inside DashboardFundSelection component */}
        <DashboardFundSelection onSelectFund={handleSelectFund} onBack={handleBackToHome} />
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchActive && (
          <>
            {/* Backdrop - visual only, no click handler */}
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 pointer-events-none"
            />
            
            {/* Search Container */}
            <div className="fixed inset-x-4 top-24 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl z-50">
              <div className="bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                <DashboardSearch 
                  isActive={isSearchActive} 
                  onClose={() => setIsSearchActive(false)} 
                />
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}