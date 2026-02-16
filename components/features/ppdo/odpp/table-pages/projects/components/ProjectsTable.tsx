
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Table as TableIcon } from "lucide-react";

// UI Components
import { Modal } from "./Modal";
import { ConfirmationModal } from "./ConfirmationModal";
import { ActivityLogSheet } from "@/components/shared/activity/ActivityLogSheet";
import { TrashConfirmationModal } from "@/components/shared/modals/TrashConfirmationModal";

// Local Components
import { ProjectForm } from "./ProjectForm";
import { ProjectCategoryCombobox } from "./ProjectCategoryCombobox";
import { ProjectShareModal } from "./ProjectShareModal";
import { ProjectCategoryFilter } from "./ProjectsTable/ProjectCategoryFilter";
import { ProjectsTableToolbar } from "./ProjectsTable/ProjectsTableToolbar";
import { ProjectsResizableTable } from "./ProjectsResizableTable";
import { ProjectContextMenu } from "./ProjectsTable/ProjectContextMenu";
import { ProjectBulkToggleDialog } from "./ProjectBulkToggleDialog";
import { PrintPreviewModal } from "@/components/features/ppdo/odpp/utilities/table/print-preview/PrintPreviewModal";
import { ProjectsKanban } from "./ProjectsKanban";

// Types, Constants, and Utils
import {
    Project,
    ProjectsTableProps,
    SortDirection,
    ProjectSortField,
    ProjectContextMenuState,
} from "../types";
import { AVAILABLE_COLUMNS, DEFAULT_COLUMN_WIDTHS } from "../constants";
import { TOGGLEABLE_FIELDS } from "@/components/features/ppdo/odpp/utilities/shared/kanban/KanbanFieldVisibilityMenu";
import {
    groupProjectsByCategory,
    calculateProjectTotals,
    createProjectSlug,
    getParticularFullName,
} from "../utils";
import { useGenericTableSettings } from "@/components/features/ppdo/odpp/utilities/shared/hooks";
import {
    applyFilters,
    createProjectFilterConfig,
    exportToCSV,
    createProjectExportConfig,
} from "@/services";
import {
    flattenGroupedProjectsForPrint,
    getProjectPrintColumns,
} from "../utils/printAdapters";
import { BudgetTotals, PrintDraft } from "@/lib/print-canvas/types";
import { BudgetItem } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/types";
import { useAutoScrollHighlight } from "@/lib/shared/hooks/useAutoScrollHighlight";

export function ProjectsTable({
    projects,
    particularId,
    budgetItemId,
    budgetItemYear,
    onAdd,
    onEdit,
    onDelete,
    onOpenTrash,
    newlyAddedProjectId,
    expandButton,
    sortOption,
    onSortChange,
}: ProjectsTableProps) {
    const { accentColorValue } = useAccentColor();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const searchInputRef = useRef<HTMLInputElement>(null);

    // ==================== QUERIES & MUTATIONS ====================
    const currentUser = useQuery(api.users.current, {});
    const allCategories = useQuery(api.projectCategories.list, {});
    const pendingParticularRequests = useQuery(
        api.accessRequests.getParticularPendingCount,
        { particularCode: particularId }
    );

    const togglePinProject = useMutation(api.projects.togglePin);
    const bulkMoveToTrash = useMutation(api.projects.bulkMoveToTrash);
    const bulkUpdateCategory = useMutation(api.projects.bulkUpdateCategory);
    const updateProject = useMutation(api.projects.update);
    const toggleAutoCalculate = useMutation(api.projects.toggleAutoCalculate);
    const bulkToggleAutoCalculate = useMutation(api.projects.bulkToggleAutoCalculate);
    const updateProjectStatus = useMutation(api.projects.updateStatus);

    // ==================== STATE: MODALS ====================
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showTrashConfirmModal, setShowTrashConfirmModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showBulkCategoryConfirmModal, setShowBulkCategoryConfirmModal] = useState(false);
    const [showSingleCategoryModal, setShowSingleCategoryModal] = useState(false);
    const [showSearchWarningModal, setShowSearchWarningModal] = useState(false);
    const [showHideAllWarning, setShowHideAllWarning] = useState(false);
    const [showBulkToggleDialog, setShowBulkToggleDialog] = useState(false);
    const [isBulkToggling, setIsBulkToggling] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);

    // ==================== STATE: KANBAN VIEW ====================
    const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
    const [showViewToggle, setShowViewToggle] = useState(false);
    const [visibleStatuses, setVisibleStatuses] = useState<Set<string>>(
        new Set(['delayed', 'ongoing', 'completed'])
    );
    const [visibleFields, setVisibleFields] = useState<Set<string>>(
        new Set(['totalBudgetAllocated', 'totalBudgetUtilized', 'balance', 'utilizationRate'])
    );

    // ==================== STATE: DATA ====================
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedCategoryProject, setSelectedCategoryProject] = useState<Project | null>(null);
    const [singleCategoryId, setSingleCategoryId] = useState<Id<"projectCategories"> | undefined>(undefined);
    const [pendingBulkCategoryId, setPendingBulkCategoryId] = useState<Id<"projectCategories"> | undefined>(undefined);

    // ==================== STATE: SELECTION & FILTERS ====================
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState<ProjectSortField | null>(null);
    const [sortDirection, setSortDirection] = useState<SortDirection>(null);
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [officeFilter, setOfficeFilter] = useState<string[]>([]);
    const [yearFilter, setYearFilter] = useState<number[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]); // ðŸ†• NEW: Category filter state
    const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);

    // ==================== STATE: UI ====================
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<ProjectContextMenuState | null>(null);

    // ==================== COLUMN WIDTH MANAGEMENT (Convex persistence) ====================
    const {
        columnWidths,
        getColumnWidth,
        startResizeColumn,
        canEditLayout,
    } = useGenericTableSettings({
        tableIdentifier: "projectsTable",
        defaultColumnWidths: DEFAULT_COLUMN_WIDTHS,
        minColumnWidth: 100,
    });

    // Resize handler for table header
    const handleResizeStart = useCallback((column: string, e: React.MouseEvent) => {
        const currentWidth = getColumnWidth(column, DEFAULT_COLUMN_WIDTHS[column as keyof typeof DEFAULT_COLUMN_WIDTHS] || 150);
        startResizeColumn(e, column, currentWidth);
    }, [getColumnWidth, startResizeColumn]);
    const [logSheetOpen, setLogSheetOpen] = useState(false);
    const [selectedLogProject, setSelectedLogProject] = useState<Project | null>(null);
    const [trashTargetItems, setTrashTargetItems] = useState<Project[]>([]);
    const [isBulkTrash, setIsBulkTrash] = useState(false);
    const [expandedRemarks, setExpandedRemarks] = useState<Set<string>>(new Set());
    const [isTogglingAutoCalculate, setIsTogglingAutoCalculate] = useState(false);

    // ==================== TRASH PREVIEW QUERY ====================
    const trashPreviewArgs = useMemo(() => {
        if (trashTargetItems.length === 0) return "skip" as const;
        if (isBulkTrash && trashTargetItems.length > 1) {
            return {
                entityType: "project" as const,
                entityIds: trashTargetItems.map(p => p.id),
            };
        }
        return {
            entityType: "project" as const,
            entityId: trashTargetItems[0]?.id,
        };
    }, [trashTargetItems, isBulkTrash]);

    const trashPreviewData = useQuery(
        api.trash.getTrashPreview,
        trashPreviewArgs === "skip" ? "skip" : trashPreviewArgs
    );
    const isTrashPreviewLoading = trashPreviewArgs !== "skip" && trashPreviewData === undefined;

    // ==================== COMPUTED VALUES ====================
    const canManageBulkActions = useMemo(() => {
        return currentUser?.role === "admin" || currentUser?.role === "super_admin";
    }, [currentUser]);

    // ðŸ†• Filter by category first
    const categoryFilteredProjects = useMemo(() => {
        if (categoryFilter.length === 0) return projects;
        return projects.filter((project) =>
            categoryFilter.includes(project.categoryId || "uncategorized")
        );
    }, [projects, categoryFilter]);

    // Apply remaining filters and sorting
    const filteredAndSortedProjects = useMemo(() =>
        applyFilters(categoryFilteredProjects, createProjectFilterConfig(
            searchQuery,
            statusFilter,
            yearFilter,
            officeFilter,
            sortField,
            sortDirection
        )),
        [categoryFilteredProjects, searchQuery, statusFilter, yearFilter, officeFilter, sortField, sortDirection]
    );

    // Group projects by category
    const groupedProjects = useMemo(() => {
        return groupProjectsByCategory(filteredAndSortedProjects, allCategories);
    }, [filteredAndSortedProjects, allCategories]);

    // Prepare categories for the category filter UI (include counts)
    const categoriesForFilter = useMemo(() => {
        const total = filteredAndSortedProjects.length;
        // groupedProjects contains only groups with projects (>0)
        const groups = groupedProjects.map(([id, group]) => ({
            _id: id,
            fullName: group.category?.fullName || "Uncategorized",
            count: group.projects.length,
        }));

        return [
            { _id: "all", fullName: "All Categories", count: total },
            ...groups,
        ];
    }, [groupedProjects, filteredAndSortedProjects]);

    // Calculate totals
    const totals = useMemo(() => {
        return calculateProjectTotals(filteredAndSortedProjects);
    }, [filteredAndSortedProjects]);

    // Prepare print data with category row markers
    const printData = useMemo(() => {
        const groupedArray = groupedProjects.map(([_, group]) => group);
        return flattenGroupedProjectsForPrint(groupedArray);
    }, [groupedProjects]);

    // Get print columns (respecting hidden columns)
    const printColumns = useMemo(() => {
        return getProjectPrintColumns(hiddenColumns);
    }, [hiddenColumns]);

    // Convert project totals to budget totals format for PrintPreviewModal
    const printTotals: BudgetTotals = useMemo(() => ({
        totalBudgetAllocated: totals.totalBudgetAllocated || 0,
        obligatedBudget: totals.obligatedBudget || 0,
        totalBudgetUtilized: totals.totalBudgetUtilized || 0,
        projectCompleted: totals.projectCompleted || 0,
        projectDelayed: totals.projectDelayed || 0,
        projectsOngoing: totals.projectsOngoing || 0,
    }), [totals]);

    // Selection state
    const isAllSelected = filteredAndSortedProjects.length > 0 &&
        selectedIds.size === filteredAndSortedProjects.length;
    const isIndeterminate = selectedIds.size > 0 &&
        selectedIds.size < filteredAndSortedProjects.length;

    // Count visible columns
    const totalVisibleColumns = AVAILABLE_COLUMNS.filter(
        col => !hiddenColumns.has(col.id)
    ).length;

    // 🔍 Auto-scroll and highlight for search results navigation
    const { isHighlighted } = useAutoScrollHighlight(
        filteredAndSortedProjects.map(p => p.id),
        { scrollDelay: 200 } // Allow data to load before scrolling
    );

    // ==================== URL SYNC HELPER ====================
    const updateURL = (key: string, values: string[]) => {
        const params = new URLSearchParams(searchParams.toString());

        // Remove existing params with this key
        params.delete(key);

        // Add new values
        if (values.length > 0) {
            values.forEach(value => params.append(key, value));
        }

        const newURL = params.toString()
            ? `${pathname}?${params.toString()}`
            : pathname;

        router.replace(newURL, { scroll: false });
    };

    // ==================== EFFECTS ====================

    // ðŸ†• Initialize category filter from URL (ONLY ON MOUNT)
    useEffect(() => {
        const categoryParams = searchParams.getAll("category");
        if (categoryParams.length > 0) {
            setCategoryFilter(categoryParams);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // Initialize year filter from URL (ONLY ON MOUNT)
    useEffect(() => {
        const yearParams = searchParams.getAll("year");
        if (yearParams.length > 0) {
            const years = yearParams.map(y => parseInt(y)).filter(y => !isNaN(y));
            if (years.length > 0) {
                setYearFilter(years);
                return;
            }
        }

        const sessionYear = typeof window !== "undefined"
            ? sessionStorage.getItem("budget_year_preference")
            : null;
        if (sessionYear) {
            const year = parseInt(sessionYear);
            if (!isNaN(year)) {
                setYearFilter([year]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run on mount

    // ðŸ†• Sync category filter to URL (skip if matching URL)
    useEffect(() => {
        const currentParams = searchParams.getAll("category");
        const isSame = currentParams.length === categoryFilter.length &&
            currentParams.every(p => categoryFilter.includes(p));

        if (!isSame) {
            updateURL("category", categoryFilter);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryFilter]);

    // Sync year filter to URL (skip if matching URL)
    useEffect(() => {
        const currentParams = searchParams.getAll("year");
        const currentYears = yearFilter.map(String);
        const isSame = currentParams.length === currentYears.length &&
            currentParams.every(p => currentYears.includes(p));

        if (!isSame) {
            updateURL("year", yearFilter.map(String));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [yearFilter]);

    // ðŸ†• Handle category filter change
    const handleCategoryFilterChange = (categoryIds: string[]) => {
        setCategoryFilter(categoryIds);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = new Set(filteredAndSortedProjects.map(p => p.id));
            setSelectedIds(allIds);
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectRow = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSelectCategory = (categoryProjects: Project[], checked: boolean) => {
        const newSelected = new Set(selectedIds);
        categoryProjects.forEach(p => {
            if (checked) {
                newSelected.add(p.id);
            } else {
                newSelected.delete(p.id);
            }
        });
        setSelectedIds(newSelected);
    };

    const handleSort = (field: ProjectSortField) => {
        if (sortField === field) {
            setSortDirection(
                sortDirection === "asc" ? "desc" :
                    sortDirection === "desc" ? null :
                        "asc"
            );
            if (sortDirection === "desc") setSortField(null);
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const handleRowClick = (project: Project, e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).closest("button") ||
            (e.target as HTMLElement).closest("[role='checkbox']") ||
            (e.target as HTMLElement).closest(".no-click")
        ) {
            return;
        }

        const pathSegments = pathname.split('/');
        const projectIndex = pathSegments.findIndex(seg => seg === 'project');
        const year = pathSegments[projectIndex + 1];

        const projectSlug = createProjectSlug(project.particulars, project.id);

        // The `particularId` is already decoded by the page-level route handler.
        // Avoid calling `decodeURIComponent` here which can throw on malformed inputs.
        const encodedParticularId = encodeURIComponent(particularId);
        const targetUrl = `/dashboard/project/${year}/${encodedParticularId}/${projectSlug}`;

        router.push(targetUrl);
    };

    const handleContextMenu = (project: Project, e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, entity: project });
    };

    const handleBulkTrash = async () => {
        try {
            const toastId = toast.loading(`Moving ${selectedIds.size} project(s) to trash...`);

            const result = await bulkMoveToTrash({
                ids: Array.from(selectedIds) as Id<"projects">[]
            });

            toast.dismiss(toastId);
            toast.success(`Successfully moved ${selectedIds.size} project(s) to trash`);

            const failed = (result as any)?.failed || 0;
            if (failed > 0) {
                toast.info(`Note: ${failed} project(s) failed to move`);
            }

            setSelectedIds(new Set());
        } catch (error) {
            toast.error("Failed to move projects to trash");
            console.error(error);
        }
    };

    const handleBulkCategoryChange = (categoryId: Id<"projectCategories"> | undefined) => {
        if (!categoryId) return;
        setPendingBulkCategoryId(categoryId);
        setShowBulkCategoryConfirmModal(true);
    };

    const confirmBulkCategoryUpdate = async () => {
        if (!pendingBulkCategoryId) return;

        try {
            const toastId = toast.loading(`Updating ${selectedIds.size} project(s)...`);

            await bulkUpdateCategory({
                ids: Array.from(selectedIds) as Id<"projects">[],
                categoryId: pendingBulkCategoryId
            });

            toast.dismiss(toastId);
            toast.success(`Successfully updated ${selectedIds.size} project(s)`);

            setSelectedIds(new Set());
            setPendingBulkCategoryId(undefined);
            setShowBulkCategoryConfirmModal(false);
        } catch (error) {
            toast.error("Failed to update categories");
            setShowBulkCategoryConfirmModal(false);
            console.error(error);
        }
    };

    const handleToggleAutoCalculate = async (newValue: boolean) => {
        if (!contextMenu) return;

        setIsTogglingAutoCalculate(true);

        try {
            const toastId = toast.loading("Updating auto-calculate mode...");

            await toggleAutoCalculate({
                id: contextMenu.entity.id as Id<"projects">,
                autoCalculate: newValue,
            });

            toast.dismiss(toastId);
            toast.success(`Switched to ${newValue ? 'auto-calculate' : 'manual'} mode`, {
                description: newValue
                    ? "Budget utilized will be calculated from breakdowns"
                    : "You can now enter budget utilized manually"
            });
        } catch (error) {
            console.error("Error toggling auto-calculate:", error);
            toast.error("Failed to toggle auto-calculate", {
                description: error instanceof Error ? error.message : "An unexpected error occurred"
            });
        } finally {
            setIsTogglingAutoCalculate(false);
        }
    };

    const handleOpenBulkToggleDialog = () => {
        if (selectedIds.size === 0) {
            toast.error("No items selected");
            return;
        }
        setShowBulkToggleDialog(true);
    };

    const handleBulkToggleAutoCalculate = async (autoCalculate: boolean, reason?: string) => {
        setIsBulkToggling(true);

        try {
            const result = await bulkToggleAutoCalculate({
                ids: Array.from(selectedIds) as Id<"projects">[],
                autoCalculate,
                reason,
            });

            const count = (result as any).count || selectedIds.size;

            toast.success(`Updated ${count} project(s)`, {
                description: `All items switched to ${autoCalculate ? 'auto-calculate' : 'manual'} mode`
            });

            setSelectedIds(new Set());
            setShowBulkToggleDialog(false);
        } catch (error) {
            console.error("Error bulk toggling auto-calculate:", error);
            toast.error("Failed to update items", {
                description: error instanceof Error ? error.message : "Some items could not be updated"
            });
        } finally {
            setIsBulkToggling(false);
        }
    };

    const handleSearchFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        if (selectedIds.size > 0) {
            e.target.blur();
            setShowSearchWarningModal(true);
        }
    };

    const handleConfirmSearchClear = () => {
        setSelectedIds(new Set());
        setShowSearchWarningModal(false);
        setTimeout(() => {
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }, 50);
    };

    const handleToggleColumn = (columnId: string, isChecked: boolean) => {
        const newHidden = new Set(hiddenColumns);
        if (isChecked) {
            newHidden.delete(columnId);
        } else {
            newHidden.add(columnId);
        }
        setHiddenColumns(newHidden);
    };

    const handleHideAllColumns = () => {
        setShowHideAllWarning(true);
    };

    const confirmHideAll = () => {
        const allColIds = AVAILABLE_COLUMNS.map(c => c.id);
        setHiddenColumns(new Set(allColIds));
        setShowHideAllWarning(false);
    };

    const handleShowAllColumns = () => {
        setHiddenColumns(new Set());
    };

    const handleOpenPrintPreview = () => {
        setShowPrintPreview(true);
    };

    const handleExportCSV = () => {
        try {
            exportToCSV(
                filteredAndSortedProjects,
                createProjectExportConfig(AVAILABLE_COLUMNS, hiddenColumns)
            );
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to export CSV");
        }
    };

    const handleContextChangeCategory = () => {
        if (!contextMenu) return;
        setSelectedCategoryProject(contextMenu.entity);
        setSingleCategoryId(contextMenu.entity.categoryId as Id<"projectCategories"> | undefined);
        setShowSingleCategoryModal(true);
    };

    const saveSingleCategoryChange = async () => {
        if (!selectedCategoryProject) return;

        try {
            const toastId = toast.loading("Updating category...");

            await updateProject({
                id: selectedCategoryProject.id as Id<"projects">,
                categoryId: singleCategoryId,
                particulars: selectedCategoryProject.particulars,
                implementingOffice: selectedCategoryProject.implementingOffice,
                totalBudgetAllocated: selectedCategoryProject.totalBudgetAllocated,
                totalBudgetUtilized: selectedCategoryProject.totalBudgetUtilized,
                budgetItemId: selectedCategoryProject.budgetItemId as Id<"budgetItems">,
                remarks: selectedCategoryProject.remarks,
                year: selectedCategoryProject.year,
                projectManagerId: selectedCategoryProject.projectManagerId as Id<"users">,
                reason: "Category updated via context menu"
            });

            toast.dismiss(toastId);
            toast.success("Category updated successfully");

            setShowSingleCategoryModal(false);
            setSelectedCategoryProject(null);
        } catch (error) {
            toast.error("Failed to update category");
            console.error(error);
        }
    };

    const handlePinProject = async () => {
        if (!contextMenu) return;

        try {
            await togglePinProject({ id: contextMenu.entity.id as Id<"projects"> });
        } catch (error) {
            toast.error("Failed to toggle pin");
        }
    };

    const handleViewLog = () => {
        if (!contextMenu) return;
        setSelectedLogProject(contextMenu.entity);
        setLogSheetOpen(true);
    };

    const handleEditProject = () => {
        if (!contextMenu) return;
        setSelectedProject(contextMenu.entity);
        setShowEditModal(true);
    };

    const handleDeleteProject = () => {
        if (!contextMenu) return;
        setTrashTargetItems([contextMenu.entity]);
        setIsBulkTrash(false);
        setShowTrashConfirmModal(true);
        setContextMenu(null);
    };

    const handleBulkTrashClick = () => {
        if (selectedIds.size === 0) return;
        const selectedProjects = projects.filter(p => selectedIds.has(p.id));
        setTrashTargetItems(selectedProjects);
        setIsBulkTrash(true);
        setShowTrashConfirmModal(true);
    };

    const handleConfirmTrash = async () => {
        try {
            const toastId = toast.loading(`Moving ${trashTargetItems.length} project(s) to trash...`);

            if (isBulkTrash && trashTargetItems.length > 1) {
                await bulkMoveToTrash({
                    ids: trashTargetItems.map(p => p.id) as Id<"projects">[]
                });
            } else {
                const projectId = trashTargetItems[0]?.id;
                if (projectId && onDelete) {
                    await onDelete(projectId);
                }
            }

            toast.dismiss(toastId);
            toast.success(`Successfully moved ${trashTargetItems.length} project(s) to trash`);
            setSelectedIds(new Set());
            setShowTrashConfirmModal(false);
            setTrashTargetItems([]);
        } catch (error) {
            toast.error("Failed to move projects to trash");
            console.error(error);
        }
    };

    const handleCancelTrash = () => {
        setShowTrashConfirmModal(false);
        setTrashTargetItems([]);
        setIsBulkTrash(false);
    };

    const handleToggleRemarks = (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newExpanded = new Set(expandedRemarks);
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId);
        } else {
            newExpanded.add(projectId);
        }
        setExpandedRemarks(newExpanded);
    };

    // ==================== KANBAN VIEW HANDLERS ====================

    // Keyboard shortcut to toggle view toggle visibility (Ctrl+Shift+V)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === "V") {
                e.preventDefault();
                setShowViewToggle((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Handle Kanban status change via drag-drop
    const handleKanbanStatusChange = useCallback(async (itemId: string, newStatus: string) => {
        const validStatuses = ["completed", "ongoing", "delayed"] as const;
        if (validStatuses.includes(newStatus as typeof validStatuses[number])) {
            try {
                await updateProjectStatus({
                    id: itemId as Id<"projects">,
                    status: newStatus as "completed" | "ongoing" | "delayed",
                });
            } catch (error) {
                console.error("Failed to update project status:", error);
                toast.error("Failed to update project status");
            }
        }
    }, [updateProjectStatus]);

    // Kanban view log handler
    const handleKanbanViewLog = useCallback((item: Project) => {
        setSelectedLogProject(item);
        setLogSheetOpen(true);
    }, []);

    // Kanban edit handler
    const handleKanbanEdit = useCallback((item: Project) => {
        setSelectedProject(item);
        setShowEditModal(true);
    }, []);

    // Kanban delete handler
    const handleKanbanDelete = useCallback((item: Project) => {
        setTrashTargetItems([item]);
        setIsBulkTrash(false);
        setShowTrashConfirmModal(true);
    }, []);

    // Kanban pin handler
    const handleKanbanPin = useCallback(async (item: Project) => {
        try {
            await togglePinProject({ id: item.id as Id<"projects"> });
        } catch (error) {
            toast.error("Failed to toggle pin");
        }
    }, [togglePinProject]);

    // Toggle status visibility
    const handleToggleStatus = useCallback((statusId: string, isChecked: boolean) => {
        setVisibleStatuses(prev => {
            const newSet = new Set(prev);
            if (isChecked) {
                newSet.add(statusId);
            } else {
                newSet.delete(statusId);
            }
            return newSet;
        });
    }, []);

    // Toggle field visibility
    const handleToggleField = useCallback((fieldId: string, isChecked: boolean) => {
        setVisibleFields(prev => {
            const newSet = new Set(prev);
            if (isChecked) {
                newSet.add(fieldId);
            } else {
                newSet.delete(fieldId);
            }
            return newSet;
        });
    }, []);

    // ... (handlers)

    const handleShowAllFields = useCallback(() => {
        setVisibleFields(new Set(TOGGLEABLE_FIELDS.map(f => f.id)));
    }, []);

    const handleHideAllFields = useCallback(() => {
        setVisibleFields(new Set());
    }, []);

    return (
        <>
            {/* Main Container with Tabs */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "kanban")} className="w-full">
                <div className={`print-area bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-visible transition-all duration-300 shadow-sm ${viewMode === "table" ? "inline-block max-w-full" : "w-full"}`}>

                    {/* Toolbar */}
                    <ProjectsTableToolbar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onSearchFocus={handleSearchFocus}
                        searchInputRef={searchInputRef}
                        selectedCount={selectedIds.size}
                        onClearSelection={() => setSelectedIds(new Set())}
                        canManageBulkActions={canManageBulkActions}
                        onBulkCategoryChange={handleBulkCategoryChange}

                        // Unified Column/Field Visibility
                        columnTriggerLabel={viewMode === 'kanban' ? "Fields" : "Columns"}
                        columns={viewMode === 'table'
                            ? undefined // Use default from ProjectsTableToolbar
                            : TOGGLEABLE_FIELDS.map(f => ({ key: f.id, label: f.label }))
                        }
                        hiddenColumns={viewMode === 'table'
                            ? hiddenColumns
                            : new Set(TOGGLEABLE_FIELDS.filter(f => !visibleFields.has(f.id)).map(f => f.id))
                        }
                        onToggleColumn={viewMode === 'table'
                            ? handleToggleColumn
                            : (id, checked) => handleToggleField(id, !checked)
                        }
                        onShowAllColumns={viewMode === 'table' ? handleShowAllColumns : handleShowAllFields}
                        onHideAllColumns={viewMode === 'table' ? handleHideAllColumns : handleHideAllFields}

                        onExportCSV={handleExportCSV}
                        onOpenPrintPreview={handleOpenPrintPreview}
                        onOpenTrash={onOpenTrash}
                        onBulkTrash={handleBulkTrashClick}
                        isAdmin={canManageBulkActions}
                        pendingRequestsCount={pendingParticularRequests}
                        onOpenShare={() => setShowShareModal(true)}
                        onBulkToggleAutoCalculate={handleOpenBulkToggleDialog}
                        onAddNew={onAdd ? () => setShowAddModal(true) : undefined}
                        expandButton={expandButton}
                        accentColor={accentColorValue}
                        // Kanban View Support
                        visibleStatuses={viewMode === 'kanban' ? visibleStatuses : undefined}
                        onToggleStatus={viewMode === 'kanban' ? handleToggleStatus : undefined}
                        visibleFields={undefined} // Hide the separate Fields toolbar
                        onToggleField={undefined}
                        showColumnVisibility={true} // Always show unified menu
                        showExport={viewMode === "table"}
                        // Sort functionality
                        sortOption={sortOption}
                        onSortChange={onSortChange}
                        showSort={!!onSortChange}
                    />

                    {/* View Toggle (Ctrl+Shift+V to show/hide) */}
                    {showViewToggle && (
                        <div className="flex items-center justify-center py-2 border-b border-zinc-200 dark:border-zinc-800">
                            <TabsList className="bg-zinc-100 dark:bg-zinc-800">
                                <TabsTrigger value="table" className="gap-2">
                                    <TableIcon className="w-4 h-4" />
                                    Table
                                </TabsTrigger>
                                <TabsTrigger value="kanban" className="gap-2">
                                    <LayoutGrid className="w-4 h-4" />
                                    Kanban
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    )}

                    {/* ðŸ†• Category Filter - YouTube Style (only in table view) */}
                    {viewMode === "table" && (
                        <ProjectCategoryFilter
                            categories={categoriesForFilter}
                            selectedCategoryIds={categoryFilter}
                            onSelectionChange={handleCategoryFilterChange}
                            accentColor={accentColorValue}
                        />
                    )}

                    {/* Table View */}
                    <TabsContent value="table" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <ProjectsResizableTable
                            projects={filteredAndSortedProjects}
                            groupedData={groupedProjects}
                            particularId={particularId}
                            hiddenColumns={hiddenColumns}
                            selectedIds={selectedIds}
                            onRowClick={handleRowClick}
                            onEdit={(project) => {
                                setSelectedProject(project);
                                setShowEditModal(true);
                            }}
                            onDelete={(project) => {
                                setTrashTargetItems([project]);
                                setIsBulkTrash(false);
                                setShowTrashConfirmModal(true);
                            }}
                            onPin={async (project) => {
                                try {
                                    await togglePinProject({ id: project.id as Id<"projects"> });
                                } catch (error) {
                                    toast.error("Failed to toggle pin");
                                }
                            }}
                            onToggleAutoCalculate={async (project, newValue) => {
                                setIsTogglingAutoCalculate(true);
                                try {
                                    const toastId = toast.loading("Updating auto-calculate mode...");
                                    await toggleAutoCalculate({
                                        id: project.id as Id<"projects">,
                                        autoCalculate: newValue,
                                    });
                                    toast.dismiss(toastId);
                                    toast.success(`Switched to ${newValue ? 'auto-calculate' : 'manual'} mode`);
                                } catch (error) {
                                    toast.error("Failed to toggle auto-calculate");
                                } finally {
                                    setIsTogglingAutoCalculate(false);
                                }
                            }}
                            onChangeCategory={(project) => {
                                setSelectedCategoryProject(project);
                                setSingleCategoryId(project.categoryId as Id<"projectCategories"> | undefined);
                                setShowSingleCategoryModal(true);
                            }}
                            onSelectRow={handleSelectRow}
                            onSelectAll={handleSelectAll}
                            onSelectCategory={handleSelectCategory}
                            isHighlighted={isHighlighted}
                            onContextMenu={handleContextMenu}
                        />
                    </TabsContent>

                    {/* Kanban View */}
                    <TabsContent value="kanban" className="mt-0">
                        <ProjectsKanban
                            data={filteredAndSortedProjects}
                            isAdmin={canManageBulkActions}
                            onViewLog={handleKanbanViewLog}
                            onEdit={onEdit ? handleKanbanEdit : undefined}
                            onDelete={onDelete ? handleKanbanDelete : undefined}
                            onPin={handleKanbanPin}
                            visibleStatuses={visibleStatuses}
                            visibleFields={visibleFields}
                            onStatusChange={handleKanbanStatusChange}
                        />
                    </TabsContent>
                </div>
            </Tabs>

            {/* Context Menu */}
            <ProjectContextMenu
                contextMenu={contextMenu}
                onClose={() => setContextMenu(null)}
                onPin={handlePinProject}
                onViewLog={handleViewLog}
                onChangeCategory={handleContextChangeCategory}
                onEdit={handleEditProject}
                onDelete={handleDeleteProject}
                canEdit={!!onEdit}
                canDelete={!!onDelete}
                onToggleAutoCalculate={handleToggleAutoCalculate}
                isTogglingAutoCalculate={isTogglingAutoCalculate}
            />

            {/* Bulk Auto-Calculate Toggle Dialog */}
            <ProjectBulkToggleDialog
                isOpen={showBulkToggleDialog}
                onClose={() => setShowBulkToggleDialog(false)}
                onConfirm={handleBulkToggleAutoCalculate}
                selectedCount={selectedIds.size}
                isLoading={isBulkToggling}
            />

            {/* Activity Log Sheet */}
            {selectedLogProject && (
                <ActivityLogSheet
                    type="project"
                    entityId={selectedLogProject.id}
                    title={`Project History: ${selectedLogProject.particulars}`}
                    isOpen={logSheetOpen}
                    onOpenChange={(open) => {
                        setLogSheetOpen(open);
                        if (!open) setSelectedLogProject(null);
                    }}
                />
            )}

            {/* Add Project Modal */}
            {showAddModal && (
                <Modal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    title="Add Project"
                    size="xl"
                >
                    <ProjectForm
                        budgetItemId={budgetItemId}
                        budgetItemYear={budgetItemYear}
                        onSave={(data) => {
                            if (onAdd) onAdd(data);
                            setShowAddModal(false);
                        }}
                        onCancel={() => setShowAddModal(false)}
                    />
                </Modal>
            )}

            {/* Edit Project Modal */}
            {showEditModal && selectedProject && (
                <Modal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedProject(null);
                    }}
                    title="Edit Project"
                    size="xl"
                >
                    <ProjectForm
                        project={selectedProject}
                        budgetItemId={budgetItemId}
                        onSave={(data) => {
                            if (onEdit) onEdit(selectedProject.id, data);
                            setShowEditModal(false);
                            setSelectedProject(null);
                        }}
                        onCancel={() => {
                            setShowEditModal(false);
                            setSelectedProject(null);
                        }}
                    />
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {/* Trash Confirmation Modal */}
            <TrashConfirmationModal
                open={showTrashConfirmModal}
                onOpenChange={setShowTrashConfirmModal}
                onConfirm={handleConfirmTrash}
                onCancel={handleCancelTrash}
                previewData={trashPreviewData}
                isLoading={isTrashPreviewLoading}
            />

            {/* Share Modal */}
            {showShareModal && (
                <ProjectShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    particularCode={particularId}
                    particularFullName={getParticularFullName(particularId)} // Updated usage
                />
            )}

            {/* Bulk Category Change Confirmation */}
            {showBulkCategoryConfirmModal && pendingBulkCategoryId && (
                <ConfirmationModal
                    isOpen={showBulkCategoryConfirmModal}
                    onClose={() => setShowBulkCategoryConfirmModal(false)}
                    onConfirm={confirmBulkCategoryUpdate}
                    title="Update Projects Category"
                    message={`Are you sure you want to move ${selectedIds.size} selected projects to this category?`}
                    confirmText="Move Projects"
                    variant="info"
                />
            )}

            {/* Single Category Change Modal */}
            {showSingleCategoryModal && selectedCategoryProject && (
                <Modal
                    isOpen={showSingleCategoryModal}
                    onClose={() => setShowSingleCategoryModal(false)}
                    title="Move Project Category"
                    size="sm"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Select a new category for "{selectedCategoryProject.particulars}":
                        </p>
                        <div className="no-click relative z-50">
                            <ProjectCategoryCombobox
                                value={singleCategoryId}
                                onChange={setSingleCategoryId}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <button
                                onClick={() => setShowSingleCategoryModal(false)}
                                className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveSingleCategoryChange}
                                disabled={!singleCategoryId}
                                className="px-4 py-2 rounded-lg text-sm bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-50"
                            >
                                Move
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Search Warning Modal */}
            {showSearchWarningModal && (
                <ConfirmationModal
                    isOpen={showSearchWarningModal}
                    onClose={() => setShowSearchWarningModal(false)}
                    onConfirm={handleConfirmSearchClear}
                    title="Clear Selection?"
                    message="Modifying the search will clear your current selection of projects. Do you want to continue?"
                    confirmText="Clear & Search"
                    cancelText="Keep Selection"
                    variant="warning"
                />
            )}

            {/* Hide All Columns Warning */}
            {showHideAllWarning && (
                <ConfirmationModal
                    isOpen={showHideAllWarning}
                    onClose={() => setShowHideAllWarning(false)}
                    onConfirm={confirmHideAll}
                    title="Hide All Columns?"
                    message="This will hide all columns except the bulk selection checkbox. You can restore them using the column visibility menu."
                    confirmText="Hide All"
                    variant="warning"
                />
            )}


            {/* Print Preview Modal */}
            {showPrintPreview && (
                <PrintPreviewModal
                    isOpen={showPrintPreview}
                    onClose={() => setShowPrintPreview(false)}
                    budgetItems={printData.flatItems.map(p => ({
                        ...p,
                        particular: p.particulars,
                        // Ensure required fields for BudgetItem are present or cast existing
                    })) as unknown as BudgetItem[]}
                    rowMarkers={printData.rowMarkers}
                    columns={printColumns}
                    hiddenColumns={hiddenColumns}
                    totals={printTotals}
                    filterState={{
                        searchQuery,
                        statusFilter,
                        yearFilter,
                        sortField: sortField as string | null,
                        sortDirection,
                    }}
                    year={budgetItemYear || new Date().getFullYear()}
                    particular={getParticularFullName(particularId)}
                />
            )}
        </>
    );
}