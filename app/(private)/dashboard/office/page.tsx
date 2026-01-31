"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccentColor } from "../../../../contexts/AccentColorContext";

const DEFAULT_OFFICES = [
  { code: "OPA", name: "Office of the Provincial Administrator" },
  { code: "HRMO", name: "Provincial Human Resource Management Office" },
  { code: "PCEDO", name: "Provincial Cooperative & Enterprise Dev't Office" },
  { code: "PPDO", name: "Provincial Planning & Development Office" },
  { code: "PTourO", name: "Provincial Tourism Office" },
  { code: "PENRO", name: "Provincial Environment & Natural Resources Office" },
  { code: "GSO", name: "Provincial General Services Office" },
  { code: "PEPO", name: "Provincial Equipment Pool Office" },
  { code: "PEO", name: "Provincial Engineering Office" },
  { code: "PIO", name: "Provincial Information Office" },
  { code: "PAgO", name: "Provincial Agriculture Office" },
  { code: "PTreasO", name: "Provincial Treasury Office" },
  { code: "PVO", name: "Provincial Veterinary Office" },
  { code: "PACCO", name: "Provincial Accounting Office" },
  { code: "PAssO", name: "Provincial Assessor's Office" },
  { code: "PLO", name: "Provincial Legal Office" },
  { code: "PSWDO", name: "Provincial Social Welfare & Development Office" },
  { code: "TPH", name: "Tarlac Provincial Hospital" },
  { code: "PHO", name: "Provincial Health Office" },
  { code: "GOTMH", name: "Gilberto O. Teodoro Memorial Hospital" },
  { code: "CDH", name: "Concepcion District Hospital" },
  { code: "LPMCH", name: "La Paz Medicare & Community Hospital" },
  { code: "EHMCMH", name: "Enrique \"Henry\" M. Cojuangco Memorial Hospital" },
  { code: "PESO", name: "Provincial Public Employment Service Office" },
  { code: "PDRRMO", name: "Provincial Disaster Risk Reduction and Management Office" },
  { code: "PBO", name: "Provincial Budget Office" },
  { code: "OSSP", name: "Office of the Secretary to the Sangguniang Panlalawigan" },
  { code: "OPVG", name: "Office of the Provincial Vice Governor" },
];

interface Office {
  code: string;
  name: string;
}

export default function OfficePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [offices, setOffices] = useState<Office[]>(DEFAULT_OFFICES);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOffice, setNewOffice] = useState({ code: "", name: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { accentColorValue } = useAccentColor();

  // Filter offices based on search query
  const filteredOffices = useMemo(() => {
    if (!searchQuery.trim()) return offices;
    const query = searchQuery.toLowerCase();
    return offices.filter(
      (office) =>
        office.name.toLowerCase().includes(query) ||
        office.code.toLowerCase().includes(query)
    );
  }, [offices, searchQuery]);

  const handleAddOffice = async () => {
    if (!newOffice.code.trim() || !newOffice.name.trim()) {
      alert("Please fill in both code and name");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/offices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newOffice.code.trim().toUpperCase(),
          name: newOffice.name.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOffices([...offices, { code: newOffice.code.trim().toUpperCase(), name: newOffice.name.trim() }]);
        setNewOffice({ code: "", name: "" });
        setShowAddModal(false);
      } else {
        alert(data.error || "Failed to add office");
      }
    } catch (error) {
      console.error("Error adding office:", error);
      alert("Failed to add office. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // useEffect(() => {
  //   const auth = localStorage.getItem("authenticated");
  //   if (auth === "true") {
  //     setIsAuthenticated(true);
  //   } else {
  //     router.push("/");
  //   }
  // }, [router]);

  // if (!isAuthenticated) {
  //   return null;
  // }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h1
          className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          Offices
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Select an office to view details and manage documents
        </p>
      </div>

      {/* Search and Add Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
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
            placeholder="Search offices by name or code..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
        </div>

        {/* Add Folder Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white dark:text-white transition-colors font-medium hover:opacity-90"
          style={{
            backgroundColor: accentColorValue,
          }}
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Add Office</span>
        </button>
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Found {filteredOffices.length} office{filteredOffices.length !== 1 ? "s" : ""}
          {filteredOffices.length === 0 && " - Try a different search"}
        </div>
      )}

      {/* Windows-style Folder Gallery */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {filteredOffices.map((office) => (
          <Link
            key={office.code}
            href={`/dashboard/office/${office.code.toLowerCase()}`}
            className="group flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all duration-200 cursor-pointer"
          >
            {/* Folder Icon - Windows Style */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
              <svg
                className="w-full h-full drop-shadow-md"
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

            {/* Office Name */}
            <div className="w-full text-center">
              <p className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                {office.name}
              </p>
              <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {office.code}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {filteredOffices.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-zinc-400 dark:text-zinc-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            No offices found
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {searchQuery
              ? "Try adjusting your search terms"
              : "Get started by adding your first office"}
          </p>
        </div>
      )}

      {/* Add Office Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Add New Office
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewOffice({ code: "", name: "" });
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Office Code
                </label>
                <input
                  type="text"
                  value={newOffice.code}
                  onChange={(e) =>
                    setNewOffice({ ...newOffice, code: e.target.value })
                  }
                  placeholder="e.g., OPA, HRMO"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Office Name
                </label>
                <input
                  type="text"
                  value={newOffice.name}
                  onChange={(e) =>
                    setNewOffice({ ...newOffice, name: e.target.value })
                  }
                  placeholder="Full office name"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewOffice({ code: "", name: "" });
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOffice}
                disabled={isSubmitting || !newOffice.code.trim() || !newOffice.name.trim()}
                className="flex-1 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{
                  backgroundColor: accentColorValue,
                }}
              >
                {isSubmitting ? "Adding..." : "Add Office"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

