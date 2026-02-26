// app/(private)/dashboard/implementing-agencies/hooks/useAgencyTable.ts

"use client";

import { useState, useMemo, useCallback } from "react";
import { useTableSettings } from "@/components/features/ppdo/odpp/utilities/data-tables/core/hooks/useTableSettings";
import { useTableResize } from "@/components/features/ppdo/odpp/utilities/data-tables/core/hooks/useTableResize";
import { useColumnDragDrop } from "@/components/features/ppdo/odpp/utilities/data-tables/core/hooks/useColumnDragDrop";
import {
  Agency,
  AgencyColumnConfig,
  AgencyRowHeights,
  AgencySortOption,
} from "../types/agency-table.types";
import {
  TABLE_IDENTIFIER,
  DEFAULT_COLUMNS,
  DEFAULT_HIDDEN_COLUMNS,
} from "../constants/agency-table.constants";

export function useAgencyTable(agencies: Agency[]) {
  // Search state
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const isSearchExpanded = isSearchFocused || search.length > 0;

  // Sort state
  const [sortOption, setSortOption] = useState<AgencySortOption>("lastModified");

  // Row selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Column visibility (initialized from defaults)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(DEFAULT_HIDDEN_COLUMNS);

  // Table settings from Convex
  const tableSettings = useTableSettings({
    tableIdentifier: TABLE_IDENTIFIER,
    defaultColumns: DEFAULT_COLUMNS as any,
  });

  const { columns, setColumns, rowHeights, setRowHeights, canEditLayout, saveLayout, updateColumnWidth } = tableSettings;

  // Resize hook
  const { startResizeColumn, startResizeRow } = useTableResize({
    columns,
    rowHeights,
    setRowHeights,
    canEditLayout,
    saveLayout,
    updateColumnWidth,
    setColumns,
  });

  // Drag-drop hook
  const saveLayoutWithCols = useCallback(
    (_cols: AgencyColumnConfig[], heights: AgencyRowHeights) => {
      saveLayout(heights);
    },
    [saveLayout]
  );

  const { onDragStart, onDrop, onDragOver } = useColumnDragDrop({
    columns,
    setColumns,
    rowHeights,
    canEditLayout,
    saveLayout: saveLayoutWithCols as any,
  });

  // Filter agencies by search
  const filteredAgencies = useMemo(() => {
    if (!search) return agencies;
    const query = search.toLowerCase();
    return agencies.filter((agency) =>
      agency.code.toLowerCase().includes(query) ||
      agency.fullName.toLowerCase().includes(query) ||
      (agency.contactPerson && agency.contactPerson.toLowerCase().includes(query)) ||
      (agency.contactEmail && agency.contactEmail.toLowerCase().includes(query)) ||
      (agency.contactPhone && agency.contactPhone.toLowerCase().includes(query)) ||
      (agency.category && agency.category.toLowerCase().includes(query)) ||
      (agency.department?.name && agency.department.name.toLowerCase().includes(query))
    );
  }, [agencies, search]);

  // Sort agencies
  const sortedAgencies = useMemo(() => {
    const items = [...filteredAgencies];
    switch (sortOption) {
      case "nameAsc":
        return items.sort((a, b) => a.fullName.localeCompare(b.fullName));
      case "nameDesc":
        return items.sort((a, b) => b.fullName.localeCompare(a.fullName));
      case "codeAsc":
        return items.sort((a, b) => a.code.localeCompare(b.code));
      case "codeDesc":
        return items.sort((a, b) => b.code.localeCompare(a.code));
      case "projectsDesc":
        return items.sort((a, b) => b.totalProjects - a.totalProjects);
      case "projectsAsc":
        return items.sort((a, b) => a.totalProjects - b.totalProjects);
      case "typeAsc":
        return items.sort((a, b) => a.type.localeCompare(b.type));
      case "typeDesc":
        return items.sort((a, b) => b.type.localeCompare(a.type));
      case "lastModifiedAsc":
        return items.sort((a, b) => a.updatedAt - b.updatedAt);
      case "lastModified":
      default:
        return items.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  }, [filteredAgencies, sortOption]);

  // Visible columns
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => !hiddenColumns.has(String(col.key)));
  }, [columns, hiddenColumns]);

  // Selection handlers
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(sortedAgencies.map((a) => a._id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [sortedAgencies]
  );

  const handleSelectRow = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Column visibility handlers
  const handleToggleColumn = useCallback((columnId: string, isChecked: boolean) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (isChecked) {
        next.delete(columnId);
      } else {
        next.add(columnId);
      }
      return next;
    });
  }, []);

  const handleShowAllColumns = useCallback(() => {
    setHiddenColumns(new Set());
  }, []);

  const handleHideAllColumns = useCallback(() => {
    setHiddenColumns(new Set(columns.map((c) => String(c.key))));
  }, [columns]);

  // Selection state
  const isAllSelected = sortedAgencies.length > 0 && selectedIds.size === sortedAgencies.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < sortedAgencies.length;

  return {
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
    setSelectedIds,
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
    filteredAgencies,
    sortedAgencies,
    visibleColumns,
    // Table settings
    columns,
    setColumns,
    rowHeights,
    canEditLayout,
    // Resize
    startResizeColumn,
    startResizeRow,
    // Drag-drop
    onDragStart,
    onDrop,
    onDragOver,
  };
}
