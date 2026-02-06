// app/dashboard/components/LoginTrailTable.tsx

"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BlockModal } from "@/components/shared/modals";
import { toast } from "sonner";
import { Pin, PinOff, Filter, RotateCcw, MoreVertical } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LoginEvent {
  id: string;
  userId?: Id<"users">;
  userName: string;
  userEmail: string;
  timestamp: number;
  ipAddress: string;
  location: string;
  status: "success" | "failed" | "suspicious" | "blocked";
  device: string;
  browser: string;
  riskScore?: number;
  failureReason?: string;
  isPinned: boolean;
}

interface Filters {
  status: "all" | "success" | "failed" | "suspicious" | "blocked";
  searchTerm: string;
  startDate: string;
  endDate: string;
  ipAddress: string;
  location: string;
  showPinnedOnly: boolean;
}

export function LoginTrailTable() {
  const currentUser = useQuery(api.auth.getCurrentUser, {});
  const isAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [activeTab, setActiveTab] = useState<"all" | "pinned">("all");
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    searchTerm: "",
    startDate: "",
    endDate: "",
    ipAddress: "",
    location: "",
    showPinnedOnly: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockingAttempt, setBlockingAttempt] = useState<LoginEvent | null>(null);

  const queryArgs = useMemo(() => {
    const showPinned = activeTab === "pinned";
    return {
      page: currentPage,
      pageSize,
      status: filters.status,
      searchTerm: filters.searchTerm || undefined,
      startDate: filters.startDate ? new Date(filters.startDate).getTime() : undefined,
      endDate: filters.endDate ? new Date(filters.endDate).getTime() : undefined,
      ipAddress: filters.ipAddress || undefined,
      location: filters.location || undefined,
      showPinnedOnly: showPinned || undefined,
    };
  }, [currentPage, pageSize, filters, activeTab]);

  const data = useQuery(api.loginTrail.getRecentLoginAttempts, queryArgs);
  const togglePin = useMutation(api.loginTrail.togglePinLoginAttempt);
  const blockIP = useMutation(api.loginTrail.blockIPAddress);
  const blockEmail = useMutation(api.loginTrail.blockEmail);

  const transformedEvents: LoginEvent[] = data?.attempts
    ? data.attempts.map((attempt) => ({
      id: attempt.id,
      userId: attempt.userId,
      userName: attempt.userName,
      userEmail: attempt.userEmail,
      timestamp: attempt.timestamp,
      ipAddress: attempt.ipAddress,
      location: attempt.location,
      status: attempt.status as "success" | "failed" | "suspicious" | "blocked",
      device: attempt.device,
      browser: attempt.browser,
      riskScore: attempt.riskScore,
      failureReason: attempt.failureReason,
      isPinned: attempt.isPinned,
    }))
    : [];

  const pagination = data?.pagination;

  const handleTogglePin = async (attemptId: string, currentPinState: boolean) => {
    try {
      await togglePin({ attemptId: attemptId as Id<"loginAttempts"> });
      toast.success(currentPinState ? "Attempt unpinned successfully" : "Attempt pinned successfully");
    } catch (error) {
      console.error("Failed to toggle pin:", error);
      toast.error("Failed to toggle pin");
    }
  };

  const handleOpenBlockModal = (event: LoginEvent) => {
    setBlockingAttempt(event);
    setBlockModalOpen(true);
  };

  const handleConfirmBlock = async (type: "ip" | "email", reason: string) => {
    if (!blockingAttempt) return;

    try {
      if (type === "ip") {
        await blockIP({
          ipAddress: blockingAttempt.ipAddress,
          reason,
          attemptId: blockingAttempt.id as Id<"loginAttempts">,
        });
        toast.success("IP address blocked successfully");
      } else {
        await blockEmail({
          email: blockingAttempt.userEmail,
          reason,
          attemptId: blockingAttempt.id as Id<"loginAttempts">,
        });
        toast.success("Email blocked successfully");
      }
      setBlockModalOpen(false);
      setBlockingAttempt(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to block");
      throw error;
    }
  };

  const resetFilters = () => {
    setFilters({
      status: "all",
      searchTerm: "",
      startDate: "",
      endDate: "",
      ipAddress: "",
      location: "",
      showPinnedOnly: false,
    });
    setCurrentPage(1);
    toast.info("Filters reset");
  };

  const getStatusColor = (status: LoginEvent["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50";
      case "failed":
        return "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50";
      case "suspicious":
        return "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50";
      case "blocked":
        return "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700";
      default:
        return "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700";
    }
  };

  const getStatusIcon = (status: LoginEvent["status"]) => {
    switch (status) {
      case "success":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "failed":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "suspicious":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return days === 1 ? "1 day ago" : `${days} days ago`;
    if (hours > 0) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    if (minutes > 0) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
    return "Just now";
  };

  if (data === undefined) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
              Login Trail
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Monitor system access and detect anomalies
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
            Login Trail
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Monitor system access and detect anomalies
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isAdmin && (
            <Tabs
              value={activeTab}
              onValueChange={(v) => { setActiveTab(v as "all" | "pinned"); setCurrentPage(1); }}
              className="scale-90 sm:scale-100 origin-right sm:origin-center"
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pinned">Pinned</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  className={`gap-2 ${showFilters ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' : ''}`}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">{showFilters ? "Hide Filters" : "Filters"}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{showFilters ? "Hide filter panel" : "Show filter panel"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => { setFilters({ ...filters, status: e.target.value as any }); setCurrentPage(1); }}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="suspicious">Suspicious</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Search User</label>
              <input
                type="text"
                placeholder="Name or email..."
                value={filters.searchTerm}
                onChange={(e) => { setFilters({ ...filters, searchTerm: e.target.value }); setCurrentPage(1); }}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">IP Address</label>
              <input
                type="text"
                placeholder="e.g., 192.168.1.1"
                value={filters.ipAddress}
                onChange={(e) => { setFilters({ ...filters, ipAddress: e.target.value }); setCurrentPage(1); }}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Location</label>
              <input
                type="text"
                placeholder="City or country..."
                value={filters.location}
                onChange={(e) => { setFilters({ ...filters, location: e.target.value }); setCurrentPage(1); }}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setCurrentPage(1); }}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setCurrentPage(1); }}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-end mt-4">
            <Button
              onClick={resetFilters}
              variant="ghost"
              size="sm"
              className="text-zinc-500 hover:text-red-500 gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </Button>
          </div>
        </div>
      )}

      {/* Results Count */}
      {pagination && (
        <div className="mb-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 px-1">
          Showing <span className="font-medium text-zinc-900 dark:text-zinc-100">{((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)}</span> of <span className="font-medium text-zinc-900 dark:text-zinc-100">{pagination.totalCount}</span> results
        </div>
      )}

      {/* Login Events List */}
      {transformedEvents.length === 0 ? (
        <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-950/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <svg className="mx-auto h-12 w-12 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No login attempts match your filters</p>
          <Button variant="link" size="sm" onClick={resetFilters} className="text-green-600 mt-2">Clear all filters</Button>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
          {transformedEvents.map((event) => (
            <div
              key={event.id}
              className={`flex items-start gap-4 p-3 sm:p-4 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all border ${event.isPinned
                ? "shadow-md shadow-yellow-200/50 dark:shadow-yellow-950/30 border-yellow-300 dark:border-yellow-800 bg-yellow-50/30 dark:bg-yellow-950/10"
                : event.status === "suspicious" || event.status === "failed"
                  ? "border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/50 dark:bg-yellow-950/20"
                  : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/50"
                }`}
            >
              {/* Status Icon */}
              <div className={`p-2 rounded-lg border ${getStatusColor(event.status)} shrink-0 self-center hidden xs:block`}>
                {getStatusIcon(event.status)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className={`p-1 rounded border ${getStatusColor(event.status)} shrink-0 xs:hidden`}>
                        {getStatusIcon(event.status)}
                      </div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{event.userName}</p>
                    </div>
                    <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-500 truncate">{event.userEmail}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded border capitalize tracking-tight ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>

                    {/* Dropdown Menu with Pin Indicator */}
                    {isAdmin && (
                      <div className="relative">
                        {/* Pin Indicator Badge */}
                        {event.isPinned && (
                          <span className="absolute -top-3.5 -right-3 sm:-right-4 text-base sm:text-lg z-10 animate-bounce">ðŸ“Œ</span>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                              <MoreVertical className="w-4 h-4 text-zinc-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleTogglePin(event.id, event.isPinned)} className="gap-2">
                              {event.isPinned ? (
                                <>
                                  <PinOff className="w-4 h-4 text-zinc-500" />
                                  Unpin Attempt
                                </>
                              ) : (
                                <>
                                  <Pin className="w-4 h-4 text-zinc-500" />
                                  Pin Attempt
                                </>
                              )}
                            </DropdownMenuItem>
                            {(event.status === "failed" || event.status === "suspicious") && (
                              <>
                                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                <DropdownMenuItem
                                  onClick={() => handleOpenBlockModal(event)}
                                  className="text-red-600 dark:text-red-400 gap-2"
                                >
                                  <span className="text-sm">ðŸš«</span>
                                  Block Access
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">{getTimeAgo(event.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span className="truncate font-mono tracking-tighter sm:tracking-normal">{event.ipAddress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{event.device} <span className="hidden sm:inline">â€¢</span><br className="sm:hidden" /> {event.browser}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 order-2 sm:order-1">Page <span className="text-zinc-900 dark:text-zinc-100 font-medium">{pagination.page}</span> of <span className="text-zinc-900 dark:text-zinc-100 font-medium">{pagination.totalPages}</span></div>
          <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPreviousPage}
              className="h-8 sm:h-9"
            >
              Previous
            </Button>
            <div className="hidden xs:flex items-center gap-1">
              {Array.from({ length: Math.min(pagination.totalPages <= 5 ? 5 : 3, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 2) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 1) {
                  pageNum = pagination.totalPages - 2 + i;
                } else {
                  pageNum = pagination.page - 1 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 sm:h-9 sm:w-9 p-0 ${pagination.page === pageNum ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              {pagination.totalPages > 5 && pagination.page < pagination.totalPages - 2 && (
                <span className="px-1 text-zinc-400 text-xs">...</span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage}
              className="h-8 sm:h-9"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {blockingAttempt && (
        <BlockModal
          open={blockModalOpen}
          onOpenChange={setBlockModalOpen}
          userName={blockingAttempt.userName}
          userEmail={blockingAttempt.userEmail}
          ipAddress={blockingAttempt.ipAddress}
          userId={blockingAttempt.userId}
          onConfirm={handleConfirmBlock}
        />
      )}
    </div>
  );
}