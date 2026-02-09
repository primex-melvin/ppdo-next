"use client";

import { useState, useRef } from "react";
import { useSidebar } from "@/contexts/SidebarContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SearchInput } from "@/components/search/SearchInput";
import { Button } from "@/components/ui/button";
import { Bug, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountModal } from "@/components/features/account/AccountModal";
import { UserDropdown } from "./UserDropdown";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { EmailDropdown } from "./EmailDropdown";
import { getDisplayName } from "@/lib/utils";
import domToImage from "dom-to-image-more";
import { ConcernModal } from "./ConcernModal";
import { ScreenshotZoom } from "./ScreenshotZoom";
// import { MigrationContainer } from "@/components/features/migration/MigrationContainer";

// HeaderProps interface kept for compatibility
interface HeaderProps {
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
}

function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState("");

  // Sync with URL query param on mount or navigation
  useEffect(() => {
    const query = searchParams.get("q");
    if (query !== null) {
      setValue(query);
    } else if (pathname !== "/search") {
      // Clear value if navigating away from search (and no q param)
      setValue("");
    }
  }, [searchParams, pathname]);

  const handleSearchChange = (newValue: string) => {
    setValue(newValue);

    // Live update ONLY if on search page
    if (pathname === "/search") {
      const params = new URLSearchParams(searchParams.toString());
      if (newValue) {
        params.set("q", newValue);
      } else {
        params.delete("q");
      }
      // Replace to avoid cluttering history state while typing
      router.replace(`/search?${params.toString()}`, { scroll: false });
    }
  };

  const handleSubmit = (submittedValue: string) => {
    // If NOT on search page, or if we want to force navigation/history push
    if (pathname !== "/search") {
      const params = new URLSearchParams();
      if (submittedValue) {
        params.set("q", submittedValue);
      }
      router.push(`/search?${params.toString()}`);
    } else {
      // Already on search page, effectively a no-op visually, 
      // but we could treat it as a "fresh" search if needed.
    }
  };

  const handleSuggestionSelect = (suggestion: { text: string }) => {
    // Navigate on select
    const params = new URLSearchParams();
    params.set("q", suggestion.text);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <Suspense>
      {/* Suspense boundary for useSearchParams */}
      <SearchInput
        value={value}
        onChange={handleSearchChange}
        onSubmit={handleSubmit}
        onSuggestionSelect={handleSuggestionSelect}
        className="w-full"
      />
    </Suspense>
  );
}

export function Header({ onSearchChange, searchQuery }: HeaderProps) {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState<"profile" | "security">("profile");
  // Note: search-related props (onSearchChange, searchQuery) are kept for API compatibility
  // but not used until new search is implemented
  const { isMinimized, toggleMinimize } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const [showBugReport, setShowBugReport] = useState(false);

  // Concern Logic State
  const [isCapturing, setIsCapturing] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [showConcernModal, setShowConcernModal] = useState(false);

  // Initialize state from local storage
  useEffect(() => {
    const stored = localStorage.getItem("showBugReport");
    if (stored !== null) {
      setShowBugReport(JSON.parse(stored));
    }
  }, []);

  // Listen for open-account-settings event from PIN reminder
  useEffect(() => {
    const handleOpenAccountSettings = (e: CustomEvent<{ tab?: "profile" | "security" }>) => {
      setAccountModalTab(e.detail?.tab || "profile");
      setShowAccountModal(true);
    };

    window.addEventListener("open-account-settings", handleOpenAccountSettings as EventListener);
    return () => {
      window.removeEventListener("open-account-settings", handleOpenAccountSettings as EventListener);
    };
  }, []);



  const toggleBugReport = () => {
    const newState = !showBugReport;
    setShowBugReport(newState);
    localStorage.setItem("showBugReport", JSON.stringify(newState));
  };

  const handleCaptureConcern = async () => {
    try {
      setIsCapturing(true);

      const domToImage = (await import("dom-to-image-more")).default;

      const dataUrl = await domToImage.toPng(document.body, {
        filter: (node) => true
      });

      setScreenshotUrl(dataUrl);

    } catch (error) {
      console.error("Screenshot capture failed:", error);
      setIsCapturing(false);
    }
  };

  const handleAnimationComplete = () => {
    setShowConcernModal(true);
    // We don't clear screenshotUrl yet because we pass it to the modal
    setIsCapturing(false);
  };

  // âœ… Use your existing useCurrentUser hook - FULLY DYNAMIC with image support!
  const { user, isLoading } = useCurrentUser();

  // Extract user data with proper name handling
  const userName = user ? getDisplayName(user) : "User";

  // Show loading state while fetching user data
  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 bg-[#f8f8f8]/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 py-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="hidden md:flex p-2 rounded-lg">
                <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
                <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
              <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </header>
    );
  }

  // If no user data, show minimal header
  if (!user) {
    return (
      <header className="sticky top-0 z-50 bg-[#f8f8f8]/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 py-4">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={toggleMinimize}
                className="hidden md:flex p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
              >
                <svg
                  className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMinimized ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  )}
                </svg>
              </button>
              <div className="flex flex-col">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Welcome back
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#f8f8f8]/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 py-4">
            {/* Left section - Sidebar Toggle, Welcome and User Name */}
            <div className="flex items-center gap-4">
              {/* Sidebar Toggle Button */}
              <button
                onClick={toggleMinimize}
                className="hidden md:flex p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
              >
                <svg
                  className="w-5 h-5 text-zinc-600 dark:text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMinimized ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  )}
                </svg>
              </button>

              {/* Welcome Message */}
              <div className="hidden md:flex flex-col">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  Welcome back,
                </span>
                <span
                  className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
                  style={{ fontFamily: "var(--font-cinzel), serif" }}
                >
                  {userName}
                </span>
              </div>

              {/* Report Bug Button & Toggle */}
              <div className="ml-4 flex items-center gap-2">
                {showBugReport && (
                  <Button
                    variant="outline"
                    className="rounded-full border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 gap-2 h-8"
                    onClick={handleCaptureConcern}
                    disabled={isCapturing}
                  >
                    {isCapturing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Bug className="h-3.5 w-3.5" />
                    )}
                    Report Concerns
                  </Button>
                )}

                <button
                  onClick={toggleBugReport}
                  className="cursor-grab text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1 opacity-50 hover:opacity-100"
                  title={showBugReport ? "Hide Bug Report Button" : "Show Bug Report Button"}
                >
                  {showBugReport ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            {/* Center - Search Bar */}
            <div className="flex-1 max-w-2xl mx-auto px-4 lg:px-8">
              <HeaderSearch />
            </div>

            {/* Right section - Actions */}
            <div className="flex items-center gap-3">
              {/* Email Dropdown */}
              <EmailDropdown />

              {/* Notifications Dropdown */}
              <NotificationsDropdown />

              {/* User Dropdown with Dynamic Avatar */}
              <UserDropdown
                user={user}
                onOpenAccountModal={() => setShowAccountModal(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Account Modal - Portal style overlay */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl">
            <AccountModal
              onClose={() => setShowAccountModal(false)}
              initialTab={accountModalTab}
            />
          </div>
        </div>
      )}

      {/* Screenshot Zoom Animation */}
      <ScreenshotZoom
        screenshotUrl={screenshotUrl}
        onAnimationComplete={handleAnimationComplete}
      />

      {/* Concern Modal */}
      <ConcernModal
        open={showConcernModal}
        onOpenChange={(open) => {
          setShowConcernModal(open);
          if (!open) setScreenshotUrl(null); // Clear screenshot when closed
        }}
        screenshot={screenshotUrl}
      />

    </>
  );
}