"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAccentColor } from "../../../../../contexts/AccentColorContext";

interface TableRow {
  id: string;
  title: string;
  type: string;
  sector: string;
  percentage: number;
}

export default function OfficeDetailPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sectorFilter, setSectorFilter] = useState("All");
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const { accentColorValue } = useAccentColor();

  const officeCode = params.code as string;
  const officeName = officeCode.toUpperCase();

  // Fetch data from external API
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      setError(null);

      try {
        // For HRMO, use the proxy API endpoint to avoid CORS issues
        const apiUrl =
          officeCode.toLowerCase() === "hrmo"
            ? "/api/ppdo/external/ppe"
            : `/api/offices/${officeCode}/data`; // Fallback for other offices

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const responseData = await response.json();

        // Debug: Log the API response structure
        console.log("API Response:", responseData);

        // HRMO API returns: { success: true, count: number, data: [...] }
        // Handle both wrapped format and direct array format
        let items: any[] = [];

        if (Array.isArray(responseData)) {
          // Direct array response
          items = responseData;
        } else if (responseData?.data && Array.isArray(responseData.data)) {
          // Wrapped response with { success, count, data }
          items = responseData.data;
        } else if (responseData?.success === false) {
          // API returned error in response body
          throw new Error(responseData.error || "API returned an error");
        }

        if (items.length > 0) {
          console.log("Sample item structure:", items[0]);
        }

        // Transform API response to table format
        // HRMO API fields: id, title, type, sector, status, owner, percentComplete
        const transformedData: TableRow[] = items.map((item: any) => ({
          id: item.id || item._id || item.code || "N/A",
          title: item.title || item.name || "Untitled",
          type: item.type || item.category || "Unknown",
          sector: item.sector || item.area || "General",
          percentage:
            item.percentComplete !== undefined
              ? item.percentComplete
              : item.percentage !== undefined
                ? item.percentage
                : item.progress !== undefined
                  ? item.progress
                  : item.completion !== undefined
                    ? item.completion
                    : 0,
        }));

        setTableData(transformedData);
      } catch (err: any) {
        console.error("Error fetching office data:", err);
        setError(err.message || "Failed to load data");
        setTableData([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, officeCode]);

  useEffect(() => {
    const auth = localStorage.getItem("authenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
    } else {
      router.push("/");
    }
  }, [router]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const total = tableData.length;
    const approved = tableData.filter((item) => item.percentage === 100).length;
    const inReview = tableData.filter(
      (item) => item.percentage > 0 && item.percentage < 100
    ).length;
    const draft = tableData.filter((item) => item.percentage === 0).length;
    return { total, approved, inReview, draft };
  }, [tableData]);

  // Get unique types and sectors for filters
  const uniqueTypes = useMemo(() => {
    const types = new Set(tableData.map((item) => item.type));
    return Array.from(types);
  }, [tableData]);

  const uniqueSectors = useMemo(() => {
    const sectors = new Set(tableData.map((item) => item.sector));
    return Array.from(sectors);
  }, [tableData]);

  // Filter data
  const filteredData = useMemo(() => {
    return tableData.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "All" || item.type === typeFilter;
      const matchesSector =
        sectorFilter === "All" || item.sector === sectorFilter;
      return matchesSearch && matchesType && matchesSector;
    });
  }, [tableData, searchQuery, typeFilter, sectorFilter]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1
              className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              Provincial Planning and Development Office
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Cross Department • {officeName} Workspace
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium">
              View Data
            </button>
            <button className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium">
              View Submissions
            </button>
            <button className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm font-medium">
              Export CSV
            </button>
            <button
              className="px-4 py-2 rounded-lg text-white transition-colors text-sm font-medium hover:opacity-90"
              style={{ backgroundColor: accentColorValue }}
            >
              Create
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {summaryStats.total}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
            Approved
          </p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {summaryStats.approved}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
            In Review
          </p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {summaryStats.inReview}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Draft</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {summaryStats.draft}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, id..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
        >
          <option value="All">All</option>
          {uniqueTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
        >
          <option value="All">All</option>
          {uniqueSectors.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-zinc-100 mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading data...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-red-800 dark:text-red-200 font-medium">
                Error loading data
              </p>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !error && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    TITLE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    TYPE
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    SECTOR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      No data found
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {row.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">
                        {row.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">
                        {row.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">
                        {row.sector}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-700 dark:text-zinc-300">
                        {row.percentage}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 dark:text-zinc-500">
                        <button
                          className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="View details"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Showing {filteredData.length > 0 ? 1 : 0} to {filteredData.length}{" "}
              of {filteredData.length} items
            </p>
            <div className="flex gap-2">
              <button
                disabled={true}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 cursor-not-allowed text-sm"
              >
                Prev
              </button>
              <button
                disabled={true}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
