// app/(private)/dashboard/implementing-agencies/components/table/ImplementingAgenciesTable.tsx

"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { Agency } from "../../types/agency-table.types";
import { DEFAULT_ROW_HEIGHT } from "../../constants/agency-table.constants";
import { useAgencyTable } from "../../hooks/useAgencyTable";
import { AgencyTableToolbar } from "./AgencyTableToolbar";
import { AgencyTableHeader } from "./AgencyTableHeader";
import { AgencyTableRow } from "./AgencyTableRow";
import { EmptyState } from "./EmptyState";

interface ImplementingAgenciesTableProps {
  agencies: Agency[];
  onAdd?: () => void;
  onEdit?: (agency: Agency) => void;
  onDelete?: (id: string) => void;
  onOpenTrash?: () => void;
}

export function ImplementingAgenciesTable({
  agencies,
  onAdd,
  onEdit,
  onDelete,
  onOpenTrash,
}: ImplementingAgenciesTableProps) {
  const router = useRouter();
  const { accentColorValue } = useAccentColor();
  const currentUser = useQuery(api.users.current, {});
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "super_admin";

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    // Search
    search,
    setSearch,
    isSearchFocused,
    setIsSearchFocused,
    isSearchExpanded,
    // Sort
    sortOption,
    setSortOption,
    // Selection
    selectedIds,
    handleSelectAll,
    handleSelectRow,
    handleClearSelection,
    isAllSelected,
    isIndeterminate,
    // Column visibility
    hiddenColumns,
    handleToggleColumn,
    handleShowAllColumns,
    handleHideAllColumns,
    // Data
    sortedAgencies,
    visibleColumns,
    // Table settings
    columns,
    rowHeights,
    canEditLayout,
    // Resize
    startResizeColumn,
    startResizeRow,
    // Drag-drop
    onDragStart,
    onDrop,
    onDragOver,
  } = useAgencyTable(agencies);

  // Navigation to detail page
  const handleRowClick = useCallback(
    (agency: Agency, event: React.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest('[role="menuitem"]') ||
        target.closest("input")
      ) {
        return;
      }
      router.push(`/dashboard/implementing-agencies/${agency._id}`);
    },
    [router]
  );

  // Export CSV
  const handleExportCSV = useCallback(() => {
    try {
      const dataToExport = selectedIds.size > 0
        ? sortedAgencies.filter((a) => selectedIds.has(a._id))
        : sortedAgencies;

      const visibleCols = columns.filter((c) => !hiddenColumns.has(String(c.key)));

      const headers = visibleCols.map((c) => c.label);
      const rows = dataToExport.map((agency) =>
        visibleCols.map((col) => {
          const key = String(col.key);
          switch (key) {
            case "department":
              return agency.department?.name || "";
            case "type":
              return agency.type === "department" ? "Department" : "External";
            case "isActive":
              return agency.isActive ? "Active" : "Inactive";
            case "totalBreakdowns":
              return (agency.breakdownUsageCount || 0).toString();
            case "createdAt":
            case "updatedAt": {
              const v = agency[key];
              return v ? new Date(v).toLocaleDateString("en-PH") : "";
            }
            default: {
              const v = agency[key];
              if (v === undefined || v === null) return "";
              return String(v);
            }
          }
        })
      );

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `implementing-agencies-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(
        selectedIds.size > 0
          ? `Exported ${selectedIds.size} selected rows`
          : `Exported ${dataToExport.length} rows`
      );
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  }, [sortedAgencies, selectedIds, columns, hiddenColumns]);

  // Fullscreen toggle
  const handleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-900"
    : "flex flex-col bg-white dark:bg-zinc-900 border rounded-lg overflow-hidden h-[calc(100vh-200px)] min-h-[500px]";

  return (
    <div
      className={containerClass}
      style={!isFullscreen ? { borderColor: "rgb(228 228 231 / 1)" } : undefined}
    >
      {/* TOOLBAR */}
      <AgencyTableToolbar
        search={search}
        setSearch={setSearch}
        isSearchFocused={isSearchFocused}
        setIsSearchFocused={setIsSearchFocused}
        isSearchExpanded={isSearchExpanded}
        sortOption={sortOption}
        setSortOption={setSortOption}
        columns={columns as any}
        hiddenColumns={hiddenColumns}
        onToggleColumn={handleToggleColumn}
        onShowAllColumns={handleShowAllColumns}
        onHideAllColumns={handleHideAllColumns}
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onAdd={onAdd}
        onOpenTrash={onOpenTrash}
        onExportCSV={handleExportCSV}
        onFullscreen={handleFullscreen}
        isAdmin={!!isAdmin}
        accentColor={accentColorValue}
      />

      {/* TABLE WRAPPER */}
      <div className="flex-1 overflow-auto border-t border-zinc-200 dark:border-zinc-800">
        <table
          className="w-full"
          style={{
            borderCollapse: "collapse",
            tableLayout: "fixed",
            minWidth: "100%",
          }}
        >
          {/* HEADER */}
          <AgencyTableHeader
            columns={visibleColumns as any}
            canEditLayout={canEditLayout}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onStartResize={startResizeColumn}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            onSelectAll={handleSelectAll}
          />

          {/* BODY */}
          {sortedAgencies.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={visibleColumns.length + 3}>
                  <EmptyState searchQuery={search} />
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {sortedAgencies.map((agency, index) => {
                const height = rowHeights[agency._id] ?? DEFAULT_ROW_HEIGHT;

                return (
                  <AgencyTableRow
                    key={agency._id}
                    agency={agency}
                    index={index}
                    columns={visibleColumns as any}
                    rowHeight={height}
                    canEditLayout={canEditLayout}
                    onRowClick={handleRowClick}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStartRowResize={startResizeRow}
                    isSelected={selectedIds.has(agency._id)}
                    onSelectRow={handleSelectRow}
                  />
                );
              })}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}
