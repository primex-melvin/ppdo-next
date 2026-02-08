// components/ppdo/funds/components/FundsTable.tsx

"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { Modal } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/components/BudgetModal";
import { ConfirmationModal } from "@/components/features/ppdo/odpp/table-pages/11_project_plan/components/BudgetConfirmationModal";
import { ActivityLogSheet } from "@/components/shared/activity/ActivityLogSheet";
import { FundsTableToolbar } from "./toolbar/FundsTableToolbar";
import { FundsContextMenu } from "./context-menu/FundsContextMenu";
import { GenericPrintPreviewModal } from "@/components/features/ppdo/odpp/utilities/print";
import { FundsResizableTable } from "./FundsResizableTable";
import { BaseFund, FundsTableProps, ContextMenuState } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { FundsKanban } from "./FundsKanban";
import { exportToCSV, calculateTotals, formatTimestamp, createFundSlug } from "../utils";
import { useTableSort, useTableFilter, useTableSelection, useFundsPrintDraft, FundsPrintAdapter } from "..";
import { AVAILABLE_COLUMNS } from "../constants";
import { useAutoScrollHighlight } from "@/lib/shared/hooks/useAutoScrollHighlight";
export function FundsTable<T extends BaseFund>({
    data,
    onAdd,
    onEdit,
    onDelete,
    onOpenTrash,
    year,
    fundType,
    title = "Funds",
    searchPlaceholder = "Search funds...",
    emptyMessage = "No funds found",
    FormComponent,
    activityLogType,
    // Enhanced toolbar features
    expandButton,
    pendingRequestsCount,
    onOpenShare,
}: FundsTableProps<T>) {
    const router = useRouter();
    const { accentColorValue } = useAccentColor();

    // Determine which API to use based on fundType
    const apiEndpoint = fundType === 'trust'
        ? api.trustFunds
        : fundType === 'specialEducation'
            ? api.specialEducationFunds
            : fundType === 'specialHealth'
                ? api.specialHealthFunds
                : api.twentyPercentDF;

    // Mutations
    const togglePin = useMutation(apiEndpoint.togglePin);
    const bulkMoveToTrash = useMutation(apiEndpoint.bulkMoveToTrash);
    const updateStatus = useMutation(apiEndpoint.updateStatus);

    // Current user for permissions
    const currentUser = useQuery(api.users.current, {});

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showDraftConfirm, setShowDraftConfirm] = useState(false);
    const [selectedItem, setSelectedItem] = useState<T | null>(null);
    const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
    const [showViewToggle, setShowViewToggle] = useState(false);

    // Keyboard shortcut to toggle view tabs visibility
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

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Activity Log State
    const [logSheetOpen, setLogSheetOpen] = useState(false);
    const [selectedLogItem, setSelectedLogItem] = useState<T | null>(null);

    // Context Menu State
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    // Column Visibility State
    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

    // Status update loading state
    const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<string>>(new Set());

    // Status Visibility State (Kanban)
    const [visibleStatuses, setVisibleStatuses] = useState<Set<string>>(new Set(['on_process', 'ongoing', 'completed']));
    const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set(['received', 'balance', 'utilizationRate']));

    const handleToggleField = (fieldId: string, isChecked: boolean) => {
        const newVisible = new Set(visibleFields);
        if (isChecked) {
            newVisible.add(fieldId);
        } else {
            newVisible.delete(fieldId);
        }
        setVisibleFields(newVisible);
    };

    // Table identifier for Convex persistence - Passed to FundsResizableTable
    const tableIdentifier = fundType === 'trust'
        ? 'trustFundsTable'
        : fundType === 'specialEducation'
            ? 'specialEducationFundsTable'
            : fundType === 'specialHealth'
                ? 'specialHealthFundsTable'
                : 'twentyPercentDFTable';

    // Column settings managed by FundsResizableTable directly

    const { sortField, sortDirection, handleSort } = useTableSort();
    const filteredAndSortedData = useTableFilter(data, searchQuery, sortField, sortDirection);
    const { selected, allSelected, toggleAll, toggleOne, clearSelection } = useTableSelection(filteredAndSortedData);

    const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

    // Calculate totals
    const totals = useMemo(() => calculateTotals(filteredAndSortedData), [filteredAndSortedData]);

    // Auto-scroll & highlight for search deep-linking (Search Engine V2)
    const { isHighlighted } = useAutoScrollHighlight(
        filteredAndSortedData.map(item => item.id),
        { scrollDelay: 200 } // Allow data to load before scrolling
    );

    // Handlers
    const handlePin = async (item: T) => {
        try {
            await togglePin({ id: item.id as any });
            toast.success(item.isPinned ? "Unpinned" : "Pinned to top");
        } catch (error) {
            toast.error("Failed to toggle pin");
        }
    };

    const handleBulkTrash = async () => {
        if (selected.length === 0) return;

        try {
            await bulkMoveToTrash({ ids: selected as any[] });
            toast.success(`Moved ${selected.length} item(s) to trash`);
            clearSelection();
        } catch (error) {
            toast.error("Failed to move items to trash");
        }
    };



    const handleStatusChange = async (itemId: string, newStatus: string) => {
        setUpdatingStatusIds(prev => new Set(prev).add(itemId));

        try {
            await updateStatus({
                id: itemId as any,
                status: newStatus as any,
                reason: "Status updated via quick dropdown"
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

    const toggleAutoCalculate = useMutation(apiEndpoint.toggleAutoCalculateFinancials);

    const handleToggleAutoCalculate = async (id: string) => {
        try {
            const newState = await toggleAutoCalculate({ id: id as any });
            toast.success(`Auto-calculation ${newState ? "enabled" : "disabled"}`);
        } catch (error) {
            toast.error("Failed to toggle auto-calculation");
            console.error(error);
        }
    };

    const handleEdit = (item: T) => {
        setSelectedItem(item);
        setShowEditModal(true);
    };

    const handleDelete = (item: T) => {
        setSelectedItem(item);
        setShowDeleteModal(true);
    };

    const handleViewLog = (item: T) => {
        setSelectedLogItem(item);
        setLogSheetOpen(true);
    };

    // Navigate to breakdown page on row click
    const handleRowClick = (item: T, e: React.MouseEvent) => {
        // Don't navigate if clicking on interactive elements (checkboxes, buttons, etc.)
        if (
            (e.target as HTMLElement).closest("button") ||
            (e.target as HTMLElement).closest("input") ||
            (e.target as HTMLElement).closest("[role='menuitem']") ||
            (e.target as HTMLElement).closest("[data-radix-dropdown-menu-content]")
        ) {
            return;
        }

        const slug = createFundSlug(item.projectTitle, item.id);
        const basePath = fundType === 'trust'
            ? 'trust-funds'
            : fundType === 'specialEducation'
                ? 'special-education-funds'
                : fundType === 'specialHealth'
                    ? 'special-health-funds'
                    : '20_percent_df';
        router.push(`/dashboard/${basePath}/${year}/${slug}`);
    };

    const handleContextMenu = (item: T, e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, entity: item });
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

    const handleToggleStatus = (statusId: string, isChecked: boolean) => {
        const newVisible = new Set(visibleStatuses);
        if (isChecked) {
            newVisible.add(statusId);
        } else {
            newVisible.delete(statusId);
        }
        setVisibleStatuses(newVisible);
    };

    const handleExportCSV = () => {
        const fundTypeSlug = fundType === 'trust'
            ? 'trust-funds'
            : fundType === 'specialEducation'
                ? 'special-education-funds'
                : fundType === 'specialHealth'
                    ? 'special-health-funds'
                    : '20-percent-df';
        exportToCSV(filteredAndSortedData, hiddenColumns, year, fundTypeSlug);
    };

    const { draftState, hasDraft, saveDraft, deleteDraft } = useFundsPrintDraft(year, fundType);

    const handleOpenPrintPreview = () => {
        if (hasDraft) {
            setShowDraftConfirm(true);
        } else {
            setShowPrintModal(true);
        }
    };

    const handleLoadDraft = () => {
        setShowDraftConfirm(false);
        setShowPrintModal(true);
    };

    const handleStartFresh = () => {
        deleteDraft();
        setShowDraftConfirm(false);
        setShowPrintModal(true);
    };

    const printAdapter = useMemo(() => {
        const columns = AVAILABLE_COLUMNS.map(col => ({
            key: col.id,
            label: col.label,
            align: (['received', 'utilized', 'balance', 'utilizationRate', 'obligatedPR'].includes(col.id) ? 'right' : 'left') as 'left' | 'right' | 'center',
            sortable: true,
            filterable: true
        }));

        return new FundsPrintAdapter(
            filteredAndSortedData,
            totals,
            columns,
            year,
            fundType,
            title
        );
    }, [filteredAndSortedData, totals, year, fundType, title]);
    return (
        <>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "kanban")} className="w-full">
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
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <FundsTableToolbar
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            searchInputRef={searchInputRef}
                            selectedCount={selected.length}
                            onClearSelection={clearSelection}
                            hiddenColumns={hiddenColumns}
                            onToggleColumn={handleToggleColumn}
                            onShowAllColumns={() => setHiddenColumns(new Set())}
                            onHideAllColumns={() => setHiddenColumns(new Set(['projectTitle', 'officeInCharge', 'status', 'dateReceived', 'received', 'obligatedPR', 'utilized', 'utilizationRate', 'balance', 'remarks']))}
                            onExportCSV={handleExportCSV}
                            onOpenPrintPreview={handleOpenPrintPreview}
                            hasPrintDraft={hasDraft}
                            isAdmin={isAdmin}
                            onOpenTrash={onOpenTrash}
                            onBulkTrash={handleBulkTrash}
                            onAddNew={onAdd ? () => setShowAddModal(true) : undefined}
                            accentColor={accentColorValue}
                            title={title}
                            searchPlaceholder={searchPlaceholder}
                            // Enhanced toolbar features
                            expandButton={expandButton}
                            pendingRequestsCount={pendingRequestsCount}
                            onOpenShare={onOpenShare}
                        />

                        <div className="overflow-auto max-h-[calc(100vh-300px)]">
                            <FundsResizableTable
                                data={filteredAndSortedData}
                                totals={totals}
                                fundType={fundType}
                                hiddenColumns={hiddenColumns}
                                onRowClick={handleRowClick}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onPin={handlePin}
                                onStatusChange={handleStatusChange}
                                onToggleAutoCalculate={handleToggleAutoCalculate}
                                onViewLog={handleViewLog}
                                selectedIds={new Set(selected)}
                                onSelectRow={(id) => toggleOne(id)}
                                onSelectAll={(checked) => {
                                    if (checked) {
                                        if (selected.length !== filteredAndSortedData.length) toggleAll();
                                    } else {
                                        clearSelection();
                                    }
                                }}
                                isHighlighted={isHighlighted}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="kanban" className="mt-0">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        {/* Reuse Toolbar for functionality but with limited features if needed */}
                        <FundsTableToolbar
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            searchInputRef={searchInputRef}
                            selectedCount={0} // Selection not supported in Kanban yet
                            onClearSelection={() => { }}
                            hiddenColumns={hiddenColumns}
                            onToggleColumn={handleToggleColumn} // Still works even if filtered out visually
                            onShowAllColumns={() => setHiddenColumns(new Set())}
                            onHideAllColumns={() => { }}
                            onExportCSV={handleExportCSV}
                            onOpenPrintPreview={handleOpenPrintPreview}
                            hasPrintDraft={hasDraft}
                            isAdmin={isAdmin}
                            onOpenTrash={onOpenTrash}
                            onBulkTrash={() => { }} // Bulk trash not supported in Kanban
                            onAddNew={onAdd ? () => setShowAddModal(true) : undefined}
                            accentColor={accentColorValue}
                            title={title}
                            searchPlaceholder={searchPlaceholder}
                            showColumnVisibility={false}
                            showExport={false}
                            visibleStatuses={visibleStatuses}
                            onToggleStatus={handleToggleStatus}
                            visibleFields={visibleFields}
                            onToggleField={handleToggleField}
                        />
                        <div className="p-4 bg-zinc-50/50 dark:bg-zinc-950/50">
                            <FundsKanban
                                data={filteredAndSortedData}
                                isAdmin={isAdmin}
                                onViewLog={handleViewLog}
                                onEdit={onEdit ? handleEdit : undefined}
                                onDelete={onDelete ? handleDelete : undefined}
                                onPin={handlePin}
                                visibleStatuses={visibleStatuses}
                                visibleFields={visibleFields}
                                fundType={fundType}
                                year={year}
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Context Menu */}
            <FundsContextMenu
                contextMenu={contextMenu}
                onClose={() => setContextMenu(null)}
                onPin={() => {
                    if (contextMenu) handlePin(contextMenu.entity);
                    setContextMenu(null);
                }}
                onViewLog={() => {
                    if (contextMenu) handleViewLog(contextMenu.entity);
                    setContextMenu(null);
                }}
                onEdit={() => {
                    if (contextMenu) handleEdit(contextMenu.entity);
                    setContextMenu(null);
                }}
                onDelete={() => {
                    if (contextMenu) handleDelete(contextMenu.entity);
                    setContextMenu(null);
                }}
                onToggleAutoCalculate={() => {
                    if (contextMenu) handleToggleAutoCalculate(contextMenu.entity.id);
                    setContextMenu(null);
                }}
                canEdit={!!onEdit}
                canDelete={!!onDelete}
            />

            {/* Modals */}
            {showAddModal && FormComponent && (
                <Modal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    title={`Add ${title.slice(0, -1)}`}
                    size="xl"
                >
                    <FormComponent
                        year={year}
                        onSave={(data: any) => {
                            if (onAdd) onAdd(data);
                            setShowAddModal(false);
                        }}
                        onCancel={() => setShowAddModal(false)}
                    />
                </Modal>
            )}

            {showEditModal && selectedItem && FormComponent && (
                <Modal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedItem(null);
                    }}
                    title={`Edit ${title.slice(0, -1)}`}
                    size="xl"
                >
                    <FormComponent
                        fund={selectedItem}
                        year={year}
                        onSave={(data: any) => {
                            if (onEdit) onEdit(selectedItem.id, data);
                            setShowEditModal(false);
                            setSelectedItem(null);
                        }}
                        onCancel={() => {
                            setShowEditModal(false);
                            setSelectedItem(null);
                        }}
                    />
                </Modal>
            )}

            {showDeleteModal && selectedItem && (
                <ConfirmationModal
                    isOpen={showDeleteModal}
                    onClose={() => {
                        setShowDeleteModal(false);
                        setSelectedItem(null);
                    }}
                    onConfirm={() => {
                        if (onDelete) onDelete(selectedItem.id);
                        setShowDeleteModal(false);
                        setSelectedItem(null);
                    }}
                    title="Move to Trash"
                    message={`Are you sure you want to move "${selectedItem.projectTitle}" to trash?`}
                    confirmText="Move to Trash"
                    variant="danger"
                />
            )}

            {/* Print Preview Modal */}
            {showPrintModal && (
                <GenericPrintPreviewModal
                    isOpen={showPrintModal}
                    onClose={() => setShowPrintModal(false)}
                    adapter={printAdapter}
                    existingDraft={draftState}
                    onDraftSaved={saveDraft}
                    hiddenColumns={hiddenColumns}
                    filterState={{
                        searchQuery,
                        statusFilter: Array.from(visibleStatuses),
                        yearFilter: [year],
                        sortField,
                        sortDirection
                    }}
                />
            )}

            {showDraftConfirm && (
                <ConfirmationModal
                    isOpen={showDraftConfirm}
                    onClose={() => setShowDraftConfirm(false)}
                    onConfirm={handleLoadDraft}
                    onCancel={handleStartFresh}
                    title="Load Existing Draft?"
                    message={`You have a print preview draft from ${draftState ? formatTimestamp(draftState.timestamp) : 'recently'}. Load it or start fresh?`}
                    confirmText="Load Draft"
                    cancelText="Start Fresh"
                    variant="default"
                />
            )}
            {/* Activity Log Sheet */}
            {selectedLogItem && (
                <ActivityLogSheet
                    type={activityLogType}
                    entityId={selectedLogItem.id}
                    title={`${title.slice(0, -1)} History: ${selectedLogItem.projectTitle}`}
                    isOpen={logSheetOpen}
                    onOpenChange={(open) => {
                        setLogSheetOpen(open);
                        if (!open) setSelectedLogItem(null);
                    }}
                />
            )}
        </>
    );
}