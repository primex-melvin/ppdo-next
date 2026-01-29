

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { TwentyPercentDF, ProjectCategory } from "../../types";
import { getCategoryHeaderStyle } from "../../utils";
import { TwentyPercentDFTableRow } from "./TwentyPercentDFTableRow";

interface TwentyPercentDFCategoryGroupProps {
    categoryId: string;
    category: ProjectCategory | null;
    projects: TwentyPercentDF[];
    selectedIds: Set<string>;
    hiddenColumns: Set<string>;
    newlyAddedId: string | null;
    canManageBulkActions: boolean;
    totalVisibleColumns: number;
    onSelectCategory: (checked: boolean) => void;
    onSelectRow: (id: string, checked: boolean) => void;
    onRowClick: (project: TwentyPercentDF, e: React.MouseEvent) => void;
    onContextMenu: (project: TwentyPercentDF, e: React.MouseEvent) => void;
    accentColor: string;
    expandedRemarks: Set<string>;
    onToggleRemarks: (projectId: string, e: React.MouseEvent) => void;
}

/**
 * Renders a category header and all projects in that category
 */
export function TwentyPercentDFCategoryGroup({
    categoryId,
    category,
    projects,
    selectedIds,
    hiddenColumns,
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
}: TwentyPercentDFCategoryGroupProps) {

    // Calculate selection state for this category
    const categoryProjectIds = projects.map(p => p.id);
    const selectedCountInCategory = categoryProjectIds.filter(id => selectedIds.has(id)).length;
    const isCategoryAllSelected = categoryProjectIds.length > 0 && selectedCountInCategory === categoryProjectIds.length;
    const isCategoryIndeterminate = selectedCountInCategory > 0 && selectedCountInCategory < categoryProjectIds.length;

    const headerStyle = getCategoryHeaderStyle(category);

    const animationConfig = useReducedMotion();

    return (
        <>
            {/* Category Header Row */}
            <motion.tr
                initial={animationConfig.shouldAnimate ? { opacity: 0, y: 6 } : undefined}
                animate={animationConfig.shouldAnimate ? { opacity: 1, y: 0 } : undefined}
                exit={animationConfig.shouldAnimate ? { opacity: 0, y: -6 } : undefined}
                transition={{ duration: animationConfig.duration, ease: animationConfig.ease }}
                className="bg-zinc-50 dark:bg-zinc-900 border-t-2 border-zinc-100 dark:border-zinc-800"
            >
                {canManageBulkActions && (
                    <td
                        className="px-3 py-2 text-center"
                        style={headerStyle}
                    >
                        <div className="flex justify-center items-center">
                            <Checkbox
                                checked={isCategoryAllSelected}
                                onCheckedChange={onSelectCategory}
                                className={cn(
                                    "border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black",
                                    isCategoryIndeterminate ? "opacity-70" : ""
                                )}
                            />
                        </div>
                    </td>
                )}

                <td
                    colSpan={totalVisibleColumns}
                    className="px-4 py-2 text-sm font-bold uppercase tracking-wider"
                    style={headerStyle}
                >
                    {category ? category.fullName : "Uncategorized"}
                    <span className="opacity-80 ml-2 font-normal normal-case">
                        ({projects.length} {projects.length === 1 ? 'project' : 'projects'})
                    </span>
                </td>
            </motion.tr>

            {/* Project Rows */}
            <AnimatePresence initial={false} mode="popLayout">
                {projects.map((project) => {
                    const isNewProject = project.id === newlyAddedId;
                    const isSelected = selectedIds.has(project.id);
                    const rowRef = isNewProject ? React.createRef<HTMLTableRowElement>() : undefined;
                    const isExpanded = expandedRemarks.has(project.id);
                    return (
                        <TwentyPercentDFTableRow
                            key={project.id}
                            project={project}
                            hiddenColumns={hiddenColumns}
                            isSelected={isSelected}
                            isNewlyAdded={isNewProject}
                            canManageBulkActions={canManageBulkActions}
                            onSelect={(checked) => onSelectRow(project.id, checked)}
                            onClick={(e) => onRowClick(project, e)}
                            onContextMenu={(e) => onContextMenu(project, e)}
                            accentColor={accentColor}
                            rowRef={rowRef}
                            isRemarksExpanded={isExpanded}
                            onToggleRemarks={onToggleRemarks}
                        />
                    );
                })}
            </AnimatePresence>
        </>
    );
}
