"use client";

import { useState, useMemo } from "react";
import { useAccentColor } from "../../../../contexts/AccentColorContext";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  Search,
  Edit,
  Trash2,
} from "lucide-react";

interface Breakdown {
  _id: string;
  projectTitle: string; // NEW FIELD
  reportDate: number; // Hidden from table but kept for sorting if needed internally
  district: string;
  municipality: string;
  barangay?: string;
  fundSource?: string;
  programType?: string;
  implementingAgency?: string;
  appropriation: number;
  obligation?: number;
  balance?: number;
  accomplishmentRate: number;
  remarksRaw: string;
  statusCategory: string;
  batchId?: string;
}

interface BreakdownHistoryTableProps {
  breakdowns: Breakdown[];
  onPrint: () => void;
  onAdd?: () => void;
  onEdit?: (breakdown: Breakdown) => void;
  onDelete?: (id: string) => void;
}

type SortDirection = "asc" | "desc" | null;
type SortField = keyof Breakdown | null;

export function BreakdownHistoryTable({
  breakdowns,
  onPrint,
  onAdd,
  onEdit,
  onDelete,
}: BreakdownHistoryTableProps) {
  const { accentColorValue } = useAccentColor();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("reportDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [municipalityFilter, setMunicipalityFilter] = useState<string[]>([]);
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(
    null
  );
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    breakdown: Breakdown;
  } | null>(null);

  // Get unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    breakdowns.forEach((breakdown) => {
      if (breakdown.statusCategory) statuses.add(breakdown.statusCategory);
    });
    return Array.from(statuses).sort();
  }, [breakdowns]);

  const uniqueMunicipalities = useMemo(() => {
    const municipalities = new Set<string>();
    breakdowns.forEach((breakdown) => {
      if (breakdown.municipality) municipalities.add(breakdown.municipality);
    });
    return Array.from(municipalities).sort();
  }, [breakdowns]);

  // Filter and sort breakdowns
  const filteredAndSortedBreakdowns = useMemo(() => {
    let filtered = [...breakdowns];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((breakdown) => {
        return (
          breakdown.projectTitle.toLowerCase().includes(query) ||
          breakdown.district.toLowerCase().includes(query) ||
          breakdown.municipality.toLowerCase().includes(query) ||
          breakdown.barangay?.toLowerCase().includes(query) ||
          breakdown.fundSource?.toLowerCase().includes(query) ||
          breakdown.statusCategory.toLowerCase().includes(query) ||
          breakdown.remarksRaw.toLowerCase().includes(query) ||
          breakdown.implementingAgency?.toLowerCase().includes(query) ||
          breakdown.appropriation.toString().includes(query)
        );
      });
    }

    // Apply status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter((breakdown) =>
        statusFilter.includes(breakdown.statusCategory)
      );
    }

    // Apply municipality filter
    if (municipalityFilter.length > 0) {
      filtered = filtered.filter((breakdown) =>
        municipalityFilter.includes(breakdown.municipality)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Handle undefined values
        if (aVal === undefined) return 1;
        if (bVal === undefined) return -1;

        // Compare values
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return filtered;
  }, [
    breakdowns,
    searchQuery,
    statusFilter,
    municipalityFilter,
    sortField,
    sortDirection,
  ]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string): string => {
    if (status === "completed") return "text-green-600 dark:text-green-400";
    if (status === "implementation")
      return "text-blue-600 dark:text-blue-400";
    if (status === "procurement")
      return "text-orange-600 dark:text-orange-400";
    if (status === "pre_procurement")
      return "text-purple-600 dark:text-purple-400";
    if (status === "suspended") return "text-red-600 dark:text-red-400";
    if (status === "cancelled") return "text-zinc-600 dark:text-zinc-400";
    return "text-zinc-600 dark:text-zinc-400";
  };

  const getAccomplishmentColor = (rate: number): string => {
    if (rate >= 80) return "text-green-600 dark:text-green-400";
    if (rate >= 50) return "text-orange-600 dark:text-orange-400";
    return "text-zinc-600 dark:text-zinc-400";
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const toggleMunicipalityFilter = (municipality: string) => {
    setMunicipalityFilter((prev) =>
      prev.includes(municipality)
        ? prev.filter((m) => m !== municipality)
        : [...prev, municipality]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter([]);
    setMunicipalityFilter([]);
    setSortField("reportDate");
    setSortDirection("desc");
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      clearAllFilters();
    }
  };

  const hasActiveFilters =
    searchQuery ||
    statusFilter.length > 0 ||
    municipalityFilter.length > 0 ||
    (sortField !== "reportDate" && sortField !== null);

  const handleContextMenu = (e: React.MouseEvent, breakdown: Breakdown) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      breakdown,
    });
  };

  const handleEdit = (breakdown: Breakdown) => {
    if (onEdit) {
      onEdit(breakdown);
    }
    setContextMenu(null);
  };

  const handleDelete = (id: string) => {
    if (onDelete) {
      onDelete(id);
    }
    setContextMenu(null);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />;
    if (sortDirection === "asc") return <ArrowUp className="w-3.5 h-3.5" />;
    return <ArrowDown className="w-3.5 h-3.5" />;
  };

  // Format location string
  const formatLocation = (breakdown: Breakdown): string => {
    const parts = [];
    if (breakdown.barangay) parts.push(breakdown.barangay);
    if (breakdown.municipality) parts.push(breakdown.municipality);
    return parts.join(", ");
  };

  return (
    <>
      <div className="print-area bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header with Search and Actions */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-4 no-print">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Breakdown History
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSearch}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md ${
                  isSearchVisible
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                }`}
                title={isSearchVisible ? "Hide Search" : "Show Search"}
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </div>
              </button>
              <button
                onClick={onPrint}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                title="Print"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print
                </div>
              </button>
              {onAdd && (
                <button
                  onClick={onAdd}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md text-white"
                  style={{ backgroundColor: accentColorValue }}
                >
                  Add New Breakdown
                </button>
              )}
            </div>
          </div>

          {/* Search Bar - Collapsible */}
          {isSearchVisible && (
            <div className="space-y-4 animate-in slide-in-from-top duration-200">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search by project title, location, status, or any value..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-0"
                    style={
                      {
                        "--tw-ring-color": accentColorValue,
                      } as React.CSSProperties
                    }
                  />
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Active Filters Display */}
              {(statusFilter.length > 0 || municipalityFilter.length > 0) && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Active filters:
                  </span>
                  {statusFilter.map((status) => (
                    <span
                      key={status}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    >
                      Status: {status.replace("_", " ")}
                      <button
                        onClick={() => toggleStatusFilter(status)}
                        className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {municipalityFilter.map((municipality) => (
                    <span
                      key={municipality}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    >
                      Municipality: {municipality}
                      <button
                        onClick={() => toggleMunicipalityFilter(municipality)}
                        className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Print Header */}
        <div className="hidden print-only p-4 border-b border-zinc-900">
          <h2 className="text-xl font-bold text-zinc-900 mb-2">
            Project Breakdown History
          </h2>
          <p className="text-sm text-zinc-700">
            Generated on:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Table with fixed header */}
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <th className="px-3 sm:px-4 py-3 text-left min-w-[250px] sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <button
                    onClick={() => handleSort("projectTitle")}
                    className="group flex items-center gap-2 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                      Program/Activity/Project
                    </span>
                    <SortIcon field="projectTitle" />
                  </button>
                </th>
                <th className="px-3 sm:px-4 py-3 text-left min-w-[200px] sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                    Location
                  </span>
                </th>
                <th className="px-3 sm:px-4 py-3 text-left min-w-[120px] sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                    Identifying Office/ Agency
                  </span>
                </th>
                <th className="px-3 sm:px-4 py-3 text-right min-w-[140px] sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <button
                    onClick={() => handleSort("appropriation")}
                    className="group flex items-center gap-2 ml-auto hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                      Appropriation
                    </span>
                    <SortIcon field="appropriation" />
                  </button>
                </th>
                <th className="px-3 sm:px-4 py-3 text-right min-w-[120px] sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <button
                    onClick={() => handleSort("accomplishmentRate")}
                    className="group flex items-center gap-2 ml-auto hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                      Accomplishment (%)
                    </span>
                    <SortIcon field="accomplishmentRate" />
                  </button>
                </th>
                <th className="px-3 sm:px-4 py-3 text-left min-w-[200px] sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-10">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                    Remarks
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredAndSortedBreakdowns.length > 0 ? (
                filteredAndSortedBreakdowns.map((breakdown) => (
                  <tr
                    key={breakdown._id}
                    onContextMenu={(e) => handleContextMenu(e, breakdown)}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
                  >
                    <td className="px-3 sm:px-4 py-3">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {breakdown.projectTitle}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        @ {formatLocation(breakdown)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {breakdown.implementingAgency || "-"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(breakdown.appropriation)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <span
                        className={`text-sm font-semibold ${getAccomplishmentColor(
                          breakdown.accomplishmentRate
                        )}`}
                      >
                        {breakdown.accomplishmentRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {breakdown.remarksRaw}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 sm:px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mb-3" />
                      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        No results found
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 py-1 z-50 min-w-[180px]"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
        >
          {onEdit && (
            <button
              onClick={() => handleEdit(contextMenu.breakdown)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-3"
            >
              <Edit className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <span className="text-zinc-700 dark:text-zinc-300">Edit</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => handleDelete(contextMenu.breakdown._id)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-3"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300">Delete</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}