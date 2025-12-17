"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useAccentColor } from "../../../contexts/AccentColorContext";
import { useBreadcrumb } from "../../../contexts/BreadcrumbContext";
import { BreakdownHistoryTable } from "./components/BreakdownHistoryTable";
import { BreakdownForm } from "./components/BreakdownForm";
import { Modal } from "../../components/Modal";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Breakdown {
  _id: string;
  projectTitle: string; // Added projectTitle
  reportDate: number;
  district: string;
  municipality: string;
  barangay?: string;
  fundSource?: string;
  implementingAgency?: string;
  appropriation: number;
  accomplishmentRate: number;
  remarksRaw: string;
  statusCategory: string;
  batchId?: string;
}

// Helper function to get full name from particular ID
const getParticularFullName = (particular: string): string => {
  const mapping: { [key: string]: string } = {
    GAD: "Gender and Development (GAD)",
    LDRRMP: "Local Disaster Risk Reduction and Management Plan",
    LDRRMF: "Local Disaster Risk Reduction and Management Plan",
    LCCAP: "Local Climate Change Action Plan",
    LCPC: "Local Council for the Protection of Children",
    SCPD: "Sectoral Committee for Persons with Disabilities",
    POPS: "Provincial Operations",
    CAIDS: "Community Affairs and Information Development Services",
    LNP: "Local Nutrition Program",
    PID: "Provincial Information Department",
    ACDP: "Agricultural Competitiveness Development Program",
    LYDP: "Local Youth Development Program",
    "20% DF": "20% Development Fund",
  };
  return mapping[particular] || particular;
};

// Helper function to extract project ID from slug
// Format: "department-name-slug-projectId"
const extractProjectId = (slugWithId: string): string => {
  // The project ID is the last segment after the last hyphen
  // We need to find where the actual ID starts (Convex IDs are long alphanumeric)
  const parts = slugWithId.split('-');
  // Convex IDs are typically long strings without hyphens
  // Find the last part that looks like a Convex ID (long alphanumeric string)
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    // Convex IDs are usually 20+ characters and alphanumeric
    if (part.length > 15 && /^[a-z0-9]+$/i.test(part)) {
      return part;
    }
  }
  // If we can't find it in the expected format, return the last part
  return parts[parts.length - 1];
};

export default function ProjectBreakdownPage() {
  const router = useRouter();
  const params = useParams();
  const { accentColorValue } = useAccentColor();
  const { setCustomBreadcrumbs } = useBreadcrumb();
  
  const particularId = decodeURIComponent(params.particularId as string);
  const slugWithId = params.projectbreakdownId as string;
  
  // Extract the actual project ID from the slug
  const projectId = extractProjectId(slugWithId);
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<Breakdown | null>(null);

  // Get the project details
  const project = useQuery(
    api.projects.get,
    projectId ? { id: projectId as Id<"projects"> } : "skip"
  );
  // Get the breakdown history for this project
  const breakdownHistory = useQuery(
    api.govtProjects.getProjectHistory,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  );
  const particularFullName = getParticularFullName(particularId);

  // Set custom breadcrumbs when project data is loaded
  useEffect(() => {
    if (project) {
      setCustomBreadcrumbs([
        { label: "Home", href: "/dashboard" },
        { label: "Budget", href: "/dashboard/budget" },
        { label: particularFullName, href: `/dashboard/budget/${encodeURIComponent(particularId)}` },
        { label: project.departmentName || "Loading..." },
      ]);
    }

    // Cleanup: reset breadcrumbs when component unmounts
    return () => {
      setCustomBreadcrumbs(null);
    };
  }, [project, particularFullName, particularId, setCustomBreadcrumbs]);
  // Mutations
  const logProjectReport = useMutation(api.govtProjects.logProjectReport);

  // Calculate statistics from breakdown history
  const stats = breakdownHistory
    ? {
        totalReports: breakdownHistory.length,
        latestReport: breakdownHistory[breakdownHistory.length - 1],
        earliestReport: breakdownHistory[0],
        totalAppropriations: breakdownHistory.reduce(
          (sum, record) => sum + record.appropriation,
          0
        ),
        avgAccomplishment:
          breakdownHistory.reduce(
            (sum, record) => sum + record.accomplishmentRate,
            0
          ) / (breakdownHistory.length || 1),
        locations: new Set(
          breakdownHistory.map((record) => record.municipality)
        ).size,
      }
    : null;
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: number): string => {
    return new Intl.DateTimeFormat("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(timestamp));
  };

  const handlePrint = () => {
    window.print();
  };
  
  // Updated handleAdd to include projectTitle and generate reportDate
  const handleAdd = async (breakdownData: Omit<Breakdown, "_id" | "reportDate"> & { reportDate?: number }) => {
    try {
      if (!project) {
        toast.error("Project not found");
        return;
      }

      await logProjectReport({
        projectName: project.projectName,
        departmentId: project.departmentId,
        projectTitle: breakdownData.projectTitle, // Pass projectTitle
        reportDate: breakdownData.reportDate || Date.now(), // Use provided date or current time
        district: breakdownData.district,
        municipality: breakdownData.municipality,
        barangay: breakdownData.barangay,
        fundSource: breakdownData.fundSource,
        appropriation: breakdownData.appropriation,
        accomplishmentRate: breakdownData.accomplishmentRate,
        remarksRaw: breakdownData.remarksRaw,
        statusCategory: breakdownData.statusCategory as any,
        batchId: breakdownData.batchId,
      });
      toast.success("Breakdown record created successfully!");
      setShowAddModal(false);
    } catch (error) {
      console.error("Error creating breakdown:", error);
      toast.error("Failed to create breakdown record", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleEdit = (breakdown: Breakdown) => {
    setSelectedBreakdown(breakdown);
    setShowEditModal(true);
  };
  
  const handleUpdate = async (breakdownData: Omit<Breakdown, "_id" | "reportDate">) => {
    try {
      // TODO: Implement update mutation in backend
      toast.info("Update functionality coming soon!");
      setShowEditModal(false);
      setSelectedBreakdown(null);
    } catch (error) {
      console.error("Error updating breakdown:", error);
      toast.error("Failed to update breakdown record");
    }
  };

  const handleDelete = (id: string) => {
    const breakdown = breakdownHistory?.find((b) => b._id === id);
    if (breakdown) {
      setSelectedBreakdown(breakdown);
      setShowDeleteModal(true);
    }
  };
  const handleConfirmDelete = async () => {
    try {
      // TODO: Implement delete mutation in backend
      toast.info("Delete functionality coming soon!");
      setShowDeleteModal(false);
      setSelectedBreakdown(null);
    } catch (error) {
      console.error("Error deleting breakdown:", error);
      toast.error("Failed to delete breakdown record");
    }
  };

  return (
    <>
      {/* Back Button and Page Header */}
      <div className="mb-6 no-print">
        <Link
          href={`/dashboard/budget/${encodeURIComponent(particularId)}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 transition-colors"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Projects
        </Link>

        <h1
          className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          {project?.projectName || "Loading..."}
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Historical breakdown and progress tracking
        </p>
      </div>

      {/* Project Overview Cards */}
      {project && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-6 no-print">
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Implementing Office
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {project.departmentName || "N/A"}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Current Budget
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatCurrency(project.allocatedBudget)}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Current Accomplishment
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {project.projectAccomplishment.toFixed(1)}%
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Status
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
              {project.status?.replace("_", " ") || "N/A"}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              Date Started
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {formatDate(project.dateStarted)}
            </p>
          </div>

          {project.remarks && (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                Remarks
              </p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {project.remarks}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Summary Statistics Accordion */}
      {stats && (
        <div className="mb-6 no-print">
          <Accordion type="single" collapsible>
            <AccordionItem value="statistics" className="border-none">
              <AccordionTrigger className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 px-6 py-4 hover:no-underline [&[data-state=open]]:rounded-b-none">
                <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Summary Statistics
                </span>
              </AccordionTrigger>
              <AccordionContent className="bg-white dark:bg-zinc-900 rounded-b-xl border border-t-0 border-zinc-200 dark:border-zinc-800 px-6 pb-6 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                      Total Reports
                    </p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {stats.totalReports}
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                      Locations Covered
                    </p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {stats.locations}
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                      Total Appropriations
                    </p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(stats.totalAppropriations)}
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                      Average Accomplishment
                    </p>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {stats.avgAccomplishment.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Latest Report Highlight */}
                {stats.latestReport && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                      Latest Report
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Report Date
                        </p>
                        <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                          {formatDate(stats.latestReport.reportDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Location
                        </p>
                        <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                          {stats.latestReport.municipality}
                          {stats.latestReport.barangay &&
                            `, ${stats.latestReport.barangay}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Status</p>
                        <p className="text-base font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                          {stats.latestReport.statusCategory.replace("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                          Accomplishment
                        </p>
                        <p className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                          {stats.latestReport.accomplishmentRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {/* Breakdown History Table */}
      <div className="mb-6">
        {breakdownHistory === undefined ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-zinc-300 border-t-transparent dark:border-zinc-700 dark:border-t-transparent"></div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading breakdown history...
            </p>
          </div>
        ) : breakdownHistory.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <svg
              className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              No breakdown records found
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-4">
              Historical breakdown data will appear here once reports are added
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md text-white"
              style={{ backgroundColor: accentColorValue }}
            >
              Add First Breakdown
            </button>
          </div>
        ) : (
          <BreakdownHistoryTable
            breakdowns={breakdownHistory as any}
            onPrint={handlePrint}
            onAdd={() => setShowAddModal(true)}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Breakdown Record"
          size="xl"
        >
          <BreakdownForm
            onSave={handleAdd}
            onCancel={() => setShowAddModal(false)}
          />
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedBreakdown && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBreakdown(null);
          }}
          title="Edit Breakdown Record"
          size="xl"
        >
          <BreakdownForm
            breakdown={selectedBreakdown}
            onSave={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedBreakdown(null);
            }}
          />
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBreakdown && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedBreakdown(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Breakdown Record"
          message={`Are you sure you want to delete this breakdown record from ${selectedBreakdown.municipality}? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />
      )}
    </>
  );
}