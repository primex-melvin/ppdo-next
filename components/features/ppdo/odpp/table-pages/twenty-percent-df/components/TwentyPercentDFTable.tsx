
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useAccentColor } from "@/contexts/AccentColorContext";

// UI Components
import { Modal } from "./Modal";
import { ConfirmationModal } from "./ConfirmationModal";
import { ActivityLogSheet } from "@/components/shared/activity/ActivityLogSheet";

// Local Components
import { TwentyPercentDFForm } from "./TwentyPercentDFForm";
import { TwentyPercentDFCategoryCombobox } from "./TwentyPercentDFCategoryCombobox";
import { TwentyPercentDFShareModal } from "./TwentyPercentDFShareModal";
import { TwentyPercentDFCategoryFilter } from "./TwentyPercentDFTable/TwentyPercentDFCategoryFilter";
import { TwentyPercentDFTableToolbar } from "./TwentyPercentDFTable/TwentyPercentDFTableToolbar";
import { TwentyPercentDFContextMenu } from "./TwentyPercentDFTable/TwentyPercentDFContextMenu";
import { PrintPreviewModal } from "@/components/features/ppdo/odpp/utilities/table/print-preview/PrintPreviewModal";
import { TwentyPercentDFResizableTable } from "./TwentyPercentDFResizableTable";

// Types, Constants, and Utils
import {
    TwentyPercentDF,
    TwentyPercentDFTableProps,
    TwentyPercentDFSortDirection,
    TwentyPercentDFSortField,
    TwentyPercentDFContextMenuState,
} from "../types";
import { AVAILABLE_COLUMNS } from "../constants";
import {
    groupTwentyPercentDFByCategory,
    calculateTwentyPercentDFTotals,
    createTwentyPercentDFSlug,
} from "../utils";
import {
    applyFilters,
    createTwentyPercentDFFilterConfig,
    exportToCSV,
    createTwentyPercentDFExportConfig,
} from "@/services";
import {
    flattenGroupedTwentyPercentDFForPrint,
    getTwentyPercentDFPrintColumns,
} from "../utils/printAdapters";
import { BudgetTotals } from "@/lib/print-canvas/types";
import { BudgetItem } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/types";
import { TwentyPercentDFBulkToggleDialog } from "./TwentyPercentDFBulkToggleDialog";
import { TwentyPercentDFKanban } from "./TwentyPercentDFKanban";

// Tabs for view switching
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { useAutoScrollHighlight } from "@/lib/shared/hooks/useAutoScrollHighlight";

export function TwentyPercentDFTable({
    items: projects,
    particularId,
    budgetItemYear,
    onAdd,
    onEdit,
    onDelete,
    onOpenTrash,
    newlyAddedId: newlyAddedProjectId,
    expandButton,
}: TwentyPercentDFTableProps) {
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
        { particularCode: particularId || "" }
    );

    const togglePinProject = useMutation(api.twentyPercentDF.togglePin);
    const bulkMoveToTrash = useMutation(api.twentyPercentDF.bulkMoveToTrash);
    const bulkUpdateCategory = useMutation(api.twentyPercentDF.bulkUpdateCategory);
    const updateProject = useMutation(api.twentyPercentDF.update);
    const toggleAutoCalculate = useMutation(api.twentyPercentDF.toggleAutoCalculateFinancials);
    const bulkToggleAutoCalculate = useMutation(api.twentyPercentDF.bulkToggleAutoCalculate);
    const updateStatus = useMutation(api.twentyPercentDF.updateStatus);

    // ==================== STATE: MODALS ====================
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
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
    const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<string>>(new Set());

    // ==================== STATE: DATA ====================
    const [selectedProject, setSelectedProject] = useState<TwentyPercentDF | null>(null);
    const [selectedCategoryProject, setSelectedCategoryProject] = useState<TwentyPercentDF | null>(null);
    const [singleCategoryId, setSingleCategoryId] = useState<Id<"projectCategories"> | undefined>(undefined);
    const [pendingBulkCategoryId, setPendingBulkCategoryId] = useState<Id<"projectCategories"> | undefined>(undefined);

    // ==================== STATE: SELECTION & FILTERS ====================
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState<TwentyPercentDFSortField | null>(null);
    const [sortDirection, setSortDirection] = useState<TwentyPercentDFSortDirection>(null);
    const [yearFilter, setYearFilter] = useState<number[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);

    // ==================== STATE: UI ====================
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<TwentyPercentDFContextMenuState | null>(null);
    const [logSheetOpen, setLogSheetOpen] = useState(false);
    const [selectedLogProject, setSelectedLogProject] = useState<TwentyPercentDF | null>(null);
    const [expandedRemarks, setExpandedRemarks] = useState<Set<string>>(new Set());
    const [isTogglingAutoCalculate, setIsTogglingAutoCalculate] = useState(false);

    // ==================== COLUMN WIDTH MANAGEMENT ====================
    // Column settings managed by TwentyPercentDFResizableTable

    // ==================== COMPUTED VALUES ====================
    const canManageBulkActions = useMemo(() => {
        return currentUser?.role === "admin" || currentUser?.role === "super_admin";
    }, [currentUser]);

    // Filter by category first
    const categoryFilteredProjects = useMemo(() => {
        if (categoryFilter.length === 0) return projects;
        return projects.filter((project) =>
            categoryFilter.includes(project.categoryId || "uncategorized")
        );
    }, [projects, categoryFilter]);

    // Apply remaining filters and sorting
    const filteredAndSortedProjects = useMemo(() =>
        applyFilters(categoryFilteredProjects, createTwentyPercentDFFilterConfig(
            searchQuery,
            [], // statusFilter
            yearFilter,
            [], // officeFilter
            sortField,
            sortDirection
        )),
        [categoryFilteredProjects, searchQuery, yearFilter, sortField, sortDirection]
    );

    // Group projects by category
    const groupedProjects = useMemo(() => {
        return groupTwentyPercentDFByCategory(filteredAndSortedProjects, allCategories);
    }, [filteredAndSortedProjects, allCategories]);

    // Prepare categories for the category filter UI (include counts)
    const categoriesForFilter = useMemo(() => {
        const total = filteredAndSortedProjects.length;
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
        return calculateTwentyPercentDFTotals(filteredAndSortedProjects);
    }, [filteredAndSortedProjects]);

    // Prepare print data with category row markers
    const printData = useMemo(() => {
        const groupedArray = groupedProjects.map(([, group]) => group);
        return flattenGroupedTwentyPercentDFForPrint(groupedArray);
    }, [groupedProjects]);

    // Get print columns (respecting hidden columns)
    const printColumns = useMemo(() => {
        return getTwentyPercentDFPrintColumns(hiddenColumns);
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

    // Auto-scroll & highlight for search deep-linking (Search Engine V2)
    const { isHighlighted } = useAutoScrollHighlight(
        filteredAndSortedProjects.map(p => p.id),
        { scrollDelay: 200 }
    );

    // Selection state
    const isAllSelected = filteredAndSortedProjects.length > 0 &&
        selectedIds.size === filteredAndSortedProjects.length;
    const isIndeterminate = selectedIds.size > 0 &&
        selectedIds.size < filteredAndSortedProjects.length;

    // Count visible columns
    const totalVisibleColumns = AVAILABLE_COLUMNS.filter(
        col => !hiddenColumns.has(col.id)
    ).length;

    // ==================== URL SYNC HELPER ====================
    const updateURL = useCallback((key: string, values: string[]) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete(key);
        if (values.length > 0) {
            values.forEach(value => params.append(key, value));
        }
        const newURL = params.toString()
            ? `${pathname}?${params.toString()}`
            : pathname;
        router.replace(newURL, { scroll: false });
    }, [pathname, router, searchParams]);

    // ==================== EFFECTS ====================
    useEffect(() => {
        const categoryParams = searchParams.getAll("category");
        if (categoryParams.length > 0) {
            setCategoryFilter(categoryParams);
        }
    }, [searchParams]);

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
    }, [searchParams]);

    useEffect(() => {
        const currentParams = searchParams.getAll("category");
        const isSame = currentParams.length === categoryFilter.length &&
            currentParams.every(p => categoryFilter.includes(p));
        if (!isSame) {
            updateURL("category", categoryFilter);
        }
    }, [categoryFilter, searchParams, updateURL]);

    useEffect(() => {
        const currentParams = searchParams.getAll("year");
        const currentYears = yearFilter.map(String);
        const isSame = currentParams.length === currentYears.length &&
            currentParams.every(p => currentYears.includes(p));
        if (!isSame) {
            updateURL("year", yearFilter.map(String));
        }
    }, [yearFilter, searchParams, updateURL]);

    // ==================== KANBAN VIEW HANDLERS ====================

    // Keyboard shortcut to toggle view tabs visibility (Ctrl+Shift+V)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'v' || e.key === 'V')) {
                e.preventDefault();
                const newValue = !showViewToggle;
                setShowViewToggle(newValue);
                if (newValue) {
                    toast.info("View toggle controls visible");
                } else {
                    toast.info("View toggle controls hidden");
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showViewToggle]);

    const handleToggleStatus = (statusId: string, isChecked: boolean) => {
        const newVisible = new Set(visibleStatuses);
        if (isChecked) {
            newVisible.add(statusId);
        } else {
            newVisible.delete(statusId);
        }
        setVisibleStatuses(newVisible);
    };

    const handleToggleField = (fieldId: string, isChecked: boolean) => {
        const newVisible = new Set(visibleFields);
        if (isChecked) {
            newVisible.add(fieldId);
        } else {
            newVisible.delete(fieldId);
        }
        setVisibleFields(newVisible);
    };

    const handleKanbanStatusChange = async (itemId: string, newStatus: string) => {
        // Validate status is one of the allowed values
        const validStatuses = ["completed", "ongoing", "delayed"] as const;
        if (!validStatuses.includes(newStatus as typeof validStatuses[number])) {
            toast.error(`Invalid status: ${newStatus}`);
            return;
        }

        setUpdatingStatusIds(prev => new Set(prev).add(itemId));
        try {
            await updateStatus({
                id: itemId as Id<"twentyPercentDF">,
                status: newStatus as "completed" | "ongoing" | "delayed",
                reason: "Status updated via Kanban drag"
            });
            toast.success("Status updated successfully");
        } catch (error) {
            toast.error("Failed to update status");
            console.error(error);
        } finally {
            setUpdatingStatusIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
        }
    };

    const handleKanbanViewLog = (item: TwentyPercentDF) => {
        setSelectedLogProject(item);
        setLogSheetOpen(true);
    };

    const handleKanbanEdit = (item: TwentyPercentDF) => {
        setSelectedProject(item);
        setShowEditModal(true);
    };

    const handleKanbanDelete = (item: TwentyPercentDF) => {
        setSelectedProject(item);
        setShowDeleteModal(true);
    };

    const handleKanbanPin = async (item: TwentyPercentDF) => {
        try {
            await togglePinProject({ id: item.id as Id<"twentyPercentDF"> });
            toast.success(item.isPinned ? "Unpinned" : "Pinned to top");
        } catch {
            toast.error("Failed to toggle pin");
        }
    };

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

    const handleSelectCategory = (categoryProjects: TwentyPercentDF[], checked: boolean) => {
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

    const handleSort = (field: TwentyPercentDFSortField) => {
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

    const handleRowClick = (project: TwentyPercentDF, e: React.MouseEvent) => {
        if (
            (e.target as HTMLElement).closest("button") ||
            (e.target as HTMLElement).closest("[role='checkbox']") ||
            (e.target as HTMLElement).closest(".no-click")
        ) {
            return;
        }

        const projectSlug = createTwentyPercentDFSlug(project.particulars, project.id);
        const targetUrl = `/dashboard/20_percent_df/${project.year || budgetItemYear}/${projectSlug}`;
        router.push(targetUrl);
    };

    const handleContextMenu = (project: TwentyPercentDF, e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, entity: project });
    };

    const handleBulkTrash = async () => {
        try {
            const toastId = toast.loading(`Moving ${selectedIds.size} item(s) to trash...`);
            await bulkMoveToTrash({
                ids: Array.from(selectedIds) as Id<"twentyPercentDF">[]
            });
            toast.dismiss(toastId);
            toast.success(`Successfully moved ${selectedIds.size} item(s) to trash`);
            setSelectedIds(new Set());
        } catch (error) {
            toast.error("Failed to move items to trash");
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
            const toastId = toast.loading(`Updating ${selectedIds.size} item(s)...`);
            await bulkUpdateCategory({
                ids: Array.from(selectedIds) as Id<"twentyPercentDF">[],
                categoryId: pendingBulkCategoryId
            });
            toast.dismiss(toastId);
            toast.success(`Successfully updated ${selectedIds.size} item(s)`);
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
                id: contextMenu.entity.id as Id<"twentyPercentDF">,
                autoCalculate: newValue,
            });
            toast.dismiss(toastId);
            toast.success(`Switched to ${newValue ? 'auto-calculate' : 'manual'} mode`);
        } catch (error) {
            console.error("Error toggling auto-calculate:", error);
            toast.error("Failed to toggle auto-calculate");
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
                ids: Array.from(selectedIds) as Id<"twentyPercentDF">[],
                autoCalculate,
                reason,
            });
            const count = result.count || selectedIds.size;
            toast.success(`Updated ${count} item(s)`);
            setSelectedIds(new Set());
            setShowBulkToggleDialog(false);
        } catch (error) {
            console.error("Error bulk toggling auto-calculate:", error);
            toast.error("Failed to update items");
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
                createTwentyPercentDFExportConfig(AVAILABLE_COLUMNS, hiddenColumns)
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
                id: selectedCategoryProject.id as Id<"twentyPercentDF">,
                categoryId: singleCategoryId,
                particulars: selectedCategoryProject.particulars,
                implementingOffice: selectedCategoryProject.implementingOffice,
                totalBudgetAllocated: selectedCategoryProject.totalBudgetAllocated,
                totalBudgetUtilized: selectedCategoryProject.totalBudgetUtilized || 0,
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
            await togglePinProject({ id: contextMenu.entity.id as Id<"twentyPercentDF"> });
        } catch {
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
        setSelectedProject(contextMenu.entity);
        setShowDeleteModal(true);
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

    return (
        <>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "kanban")} className="w-full">
                {/* View Toggle - Only visible when triggered by Ctrl+Shift+V */}
                <div className="flex justify-end mb-4 h-10">
                    {showViewToggle && (
                        <TabsList className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <TabsTrigger value="table" className="gap-2">
                                <TableIcon className="w-4 h-4" />
                                Table View
                            </TabsTrigger>
                            <TabsTrigger value="kanban" className="gap-2">
                                <LayoutGrid className="w-4 h-4" />
                                Kanban View
                            </TabsTrigger>
                        </TabsList>
                    )}
                </div>

                <TabsContent value="table" className="mt-0">
                    <div className="print-area bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-visible transition-all duration-300 shadow-sm">
                        <TwentyPercentDFTableToolbar
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onSearchFocus={handleSearchFocus}
                            searchInputRef={searchInputRef}
                            selectedCount={selectedIds.size}
                            onClearSelection={() => setSelectedIds(new Set())}
                            canManageBulkActions={canManageBulkActions}
                            onBulkCategoryChange={handleBulkCategoryChange}
                            hiddenColumns={hiddenColumns}
                            onToggleColumn={handleToggleColumn}
                            onShowAllColumns={handleShowAllColumns}
                            onHideAllColumns={handleHideAllColumns}
                            onExportCSV={handleExportCSV}
                            onOpenPrintPreview={handleOpenPrintPreview}
                            onOpenTrash={onOpenTrash}
                            onBulkTrash={handleBulkTrash}
                            isAdmin={canManageBulkActions}
                            pendingRequestsCount={pendingParticularRequests}
                            onOpenShare={() => setShowShareModal(true)}
                            onBulkToggleAutoCalculate={handleOpenBulkToggleDialog}
                            onAddNew={onAdd ? () => setShowAddModal(true) : undefined}
                            expandButton={expandButton}
                            accentColor={accentColorValue}
                        />

                        <TwentyPercentDFCategoryFilter
                            categories={categoriesForFilter}
                            selectedCategoryIds={categoryFilter}
                            onSelectionChange={handleCategoryFilterChange}
                            accentColor={accentColorValue}
                        />

                        <div className="flex-1 overflow-hidden h-full">
                            <TwentyPercentDFResizableTable
                                data={filteredAndSortedProjects}
                                groupedData={groupedProjects}
                                totals={totals}
                                hiddenColumns={hiddenColumns}
                                onRowClick={handleRowClick}
                                onEdit={(item) => {
                                    setSelectedProject(item);
                                    setShowEditModal(true);
                                }}
                                onDelete={(item) => {
                                    setSelectedProject(item);
                                    setShowDeleteModal(true);
                                }}
                                onPin={async (item) => {
                                    try {
                                        await togglePinProject({ id: item.id as Id<"twentyPercentDF"> });
                                    } catch {
                                        toast.error("Failed to toggle pin");
                                    }
                                }}
                                onToggleAutoCalculate={async (item) => {
                                    try {
                                        await toggleAutoCalculate({
                                            id: item.id as Id<"twentyPercentDF">,
                                            autoCalculate: !item.autoCalculateBudgetUtilized
                                        });
                                        toast.success(`Switched to ${!item.autoCalculateBudgetUtilized ? 'auto-calculate' : 'manual'} mode`);
                                    } catch (e) {
                                        toast.error("Failed to toggle auto-calculate");
                                    }
                                }}
                                onChangeCategory={(item) => {
                                    setSelectedCategoryProject(item);
                                    setSingleCategoryId(item.categoryId);
                                    setShowSingleCategoryModal(true);
                                }}
                                onViewLog={(item) => {
                                    setSelectedLogProject(item);
                                    setLogSheetOpen(true);
                                }}
                                selectedIds={selectedIds}
                                onSelectRow={handleSelectRow}
                                onSelectAll={handleSelectAll}
                                isHighlighted={isHighlighted}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="kanban" className="mt-0">
                    <div className="print-area bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-visible transition-all duration-300 shadow-sm p-4">
                        <TwentyPercentDFTableToolbar
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onSearchFocus={handleSearchFocus}
                            searchInputRef={searchInputRef}
                            selectedCount={0}
                            onClearSelection={() => { }}
                            canManageBulkActions={canManageBulkActions}
                            onBulkCategoryChange={handleBulkCategoryChange}
                            hiddenColumns={hiddenColumns}
                            onToggleColumn={handleToggleColumn}
                            onShowAllColumns={handleShowAllColumns}
                            onHideAllColumns={handleHideAllColumns}
                            onExportCSV={handleExportCSV}
                            onOpenPrintPreview={handleOpenPrintPreview}
                            onOpenTrash={onOpenTrash}
                            onBulkTrash={handleBulkTrash}
                            isAdmin={canManageBulkActions}
                            pendingRequestsCount={pendingParticularRequests}
                            onOpenShare={() => setShowShareModal(true)}
                            onBulkToggleAutoCalculate={handleOpenBulkToggleDialog}
                            onAddNew={onAdd ? () => setShowAddModal(true) : undefined}
                            expandButton={expandButton}
                            accentColor={accentColorValue}
                            // Kanban-specific props
                            visibleStatuses={visibleStatuses}
                            onToggleStatus={handleToggleStatus}
                            visibleFields={visibleFields}
                            onToggleField={handleToggleField}
                            showColumnVisibility={false}
                            showExport={false}
                        />

                        <TwentyPercentDFKanban
                            data={filteredAndSortedProjects}
                            isAdmin={canManageBulkActions}
                            onViewLog={handleKanbanViewLog}
                            onEdit={onEdit ? handleKanbanEdit : undefined}
                            onDelete={onDelete ? handleKanbanDelete : undefined}
                            onPin={handleKanbanPin}
                            visibleStatuses={visibleStatuses}
                            visibleFields={visibleFields}
                            year={budgetItemYear || new Date().getFullYear()}
                            onStatusChange={handleKanbanStatusChange}
                        />
                    </div>
                </TabsContent>
            </Tabs>

            <TwentyPercentDFContextMenu
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

            <TwentyPercentDFBulkToggleDialog
                isOpen={showBulkToggleDialog}
                onClose={() => setShowBulkToggleDialog(false)}
                onConfirm={handleBulkToggleAutoCalculate}
                selectedCount={selectedIds.size}
                isLoading={isBulkToggling}
            />

            {selectedLogProject && (
                <ActivityLogSheet
                    type="twentyPercentDF"
                    entityId={selectedLogProject.id}
                    title={`History: ${selectedLogProject.particulars}`}
                    isOpen={logSheetOpen}
                    onOpenChange={(open) => {
                        setLogSheetOpen(open);
                        if (!open) setSelectedLogProject(null);
                    }}
                />
            )}

            {showAddModal && (
                <Modal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    title="Add Item"
                    size="xl"
                >
                    <TwentyPercentDFForm
                        budgetItemYear={budgetItemYear}
                        onSave={(data) => {
                            if (onAdd) onAdd(data);
                            setShowAddModal(false);
                        }}
                        onCancel={() => setShowAddModal(false)}
                    />
                </Modal>
            )}

            {showEditModal && selectedProject && (
                <Modal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedProject(null);
                    }}
                    title="Edit Item"
                    size="xl"
                >
                    <TwentyPercentDFForm
                        project={selectedProject}
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

            {showDeleteModal && selectedProject && (
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedProject(null);
                    }}
                    onConfirm={() => {
                        if (onDelete && selectedProject) {
                            onDelete(selectedProject.id);
                        }
                        setShowDeleteModal(false);
                        setSelectedProject(null);
                    }}
                    title="Move to Trash"
                    message={`Are you sure you want to move "${selectedProject.particulars}" to trash?`}
                    confirmText="Yes, move to trash"
                    variant="danger"
                />
            )}

            {showShareModal && (
                <TwentyPercentDFShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    particularCode={particularId || ""}
                    particularFullName={particularId || "20% DF"}
                />
            )}

            {showBulkCategoryConfirmModal && pendingBulkCategoryId && (
                <ConfirmationModal
                    isOpen={showBulkCategoryConfirmModal}
                    onClose={() => setShowBulkCategoryConfirmModal(false)}
                    onConfirm={confirmBulkCategoryUpdate}
                    title="Update Category"
                    message={`Are you sure you want to move ${selectedIds.size} selected items to this category?`}
                    confirmText="Move Items"
                    variant="info"
                />
            )}

            {showSingleCategoryModal && selectedCategoryProject && (
                <Modal
                    isOpen={showSingleCategoryModal}
                    onClose={() => setShowSingleCategoryModal(false)}
                    title="Move Category"
                    size="sm"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Select a new category for &quot;{selectedCategoryProject.particulars}&quot;:
                        </p>
                        <div className="no-click relative z-50">
                            <TwentyPercentDFCategoryCombobox
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

            {showSearchWarningModal && (
                <ConfirmationModal
                    isOpen={showSearchWarningModal}
                    onClose={() => setShowSearchWarningModal(false)}
                    onConfirm={handleConfirmSearchClear}
                    title="Clear Selection?"
                    message="Modifying the search will clear your current selection. Do you want to continue?"
                    confirmText="Clear & Search"
                    cancelText="Keep Selection"
                    variant="warning"
                />
            )}

            {showHideAllWarning && (
                <ConfirmationModal
                    isOpen={showHideAllWarning}
                    onClose={() => setShowHideAllWarning(false)}
                    onConfirm={confirmHideAll}
                    title="Hide All Columns?"
                    message="This will hide all columns except the bulk selection checkbox."
                    confirmText="Hide All"
                    variant="warning"
                />
            )}

            {showPrintPreview && (
                <PrintPreviewModal
                    isOpen={showPrintPreview}
                    onClose={() => setShowPrintPreview(false)}
                    budgetItems={printData.flatItems.map(p => ({
                        ...p,
                        particular: p.particulars,
                    })) as unknown as BudgetItem[]}
                    rowMarkers={printData.rowMarkers}
                    columns={printColumns}
                    hiddenColumns={hiddenColumns}
                    totals={printTotals}
                    filterState={{
                        searchQuery,
                        statusFilter: [],
                        yearFilter,
                        sortField: sortField as string | null,
                        sortDirection,
                    }}
                    year={budgetItemYear || new Date().getFullYear()}
                    particular={particularId || "20% DEVELOPMENT FUND"}
                />
            )}
        </>
    );
}