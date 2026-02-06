

"use client";

import React from "react";
// animations handled within row and group components
import { TwentyPercentDF, GroupedTwentyPercentDF } from "../../types";
import { TwentyPercentDFCategoryGroup } from "./TwentyPercentDFCategoryGroup";


interface TwentyPercentDFTableBodyProps {
    groupedProjects: [string, GroupedTwentyPercentDF][];
    hiddenColumns: Set<string>;
    selectedIds: Set<string>;
    newlyAddedId: string | null | undefined;
    canManageBulkActions: boolean;
    totalVisibleColumns: number;
    onSelectCategory: (projects: TwentyPercentDF[], checked: boolean) => void;
    onSelectRow: (id: string, checked: boolean) => void;
    onRowClick: (project: TwentyPercentDF, e: React.MouseEvent) => void;
    onContextMenu: (project: TwentyPercentDF, e: React.MouseEvent) => void;
    accentColor: string;
    expandedRemarks: Set<string>;
    onToggleRemarks: (projectId: string, e: React.MouseEvent) => void;
}

/**
 * Table body that renders all project groups and rows
 */
export function TwentyPercentDFTableBody({
    groupedProjects,
    hiddenColumns,
    selectedIds,
    newlyAddedId,
    canManageBulkActions,
    totalVisibleColumns,
    onSelectCategory,
    onSelectRow,
    onRowClick,
    onContextMenu,
    accentColor,
    expandedRemarks,
    onToggleRemarks,
}: TwentyPercentDFTableBodyProps) {
    if (groupedProjects.length === 0) {
        return (
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                <tr>
                    <td
                        colSpan={totalVisibleColumns + (canManageBulkActions ? 1 : 0)}
                        className="px-4 py-12 text-center text-sm text-zinc-500"
                    >
                        No projects found matching your criteria.
                    </td>
                </tr>
            </tbody>
        );
    }

    return (
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {groupedProjects.map(([categoryId, group]) => (
                <TwentyPercentDFCategoryGroup
                    key={categoryId}
                    categoryId={categoryId}
                    category={group.category}
                    projects={group.projects}
                    selectedIds={selectedIds}
                    hiddenColumns={hiddenColumns}
                    newlyAddedId={newlyAddedId ?? null}
                    canManageBulkActions={canManageBulkActions}
                    totalVisibleColumns={totalVisibleColumns}
                    onSelectCategory={(checked) => onSelectCategory(group.projects, checked)}
                    onSelectRow={onSelectRow}
                    onRowClick={onRowClick}
                    onContextMenu={onContextMenu}
                    accentColor={accentColor}
                    expandedRemarks={expandedRemarks}
                    onToggleRemarks={onToggleRemarks}
                />
            ))}
        </tbody>
    );
}
