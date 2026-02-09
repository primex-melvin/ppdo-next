
"use client";

import React, { useMemo } from "react";
import {
    ResizableTableContainer,
    ResizableTableHeader,
    ResizableTableRow,
    useResizableColumns,
    ColumnConfig,
    DEFAULT_ROW_HEIGHT,
} from "../core";
import { PROJECT_TABLE_COLUMNS } from "../configs";
import {
    ProjectNameCell,
    ProjectStatusCell,
    ProjectBudgetCell,
    ProjectRemarksCell,
} from "../cells";
import { Edit, Trash2, Pin, Eye, MoreHorizontal, Calculator, FolderInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatPercentage } from "../core/utils/formatters";
import type { Project, ProjectCategory, GroupedProjects } from "@/components/features/ppdo/odpp/table-pages/projects/types";

interface ProjectsTableProps {
    projects: Project[];
    groupedData?: [string, GroupedProjects][];
    particularId?: string;
    hiddenColumns?: Set<string>;
    onRowClick: (project: Project, e: React.MouseEvent) => void;
    onEdit?: (project: Project) => void;
    onDelete?: (project: Project) => void;
    onPin?: (project: Project) => void;
    onToggleAutoCalculate?: (project: Project, newValue: boolean) => void;
    onChangeCategory?: (project: Project) => void;
    selectedIds?: Set<string>;
    onSelectRow?: (id: string, checked: boolean) => void;
    onSelectAll?: (checked: boolean) => void;
    onSelectCategory?: (projects: Project[], checked: boolean) => void;
    isHighlighted?: (id: string) => boolean;
    onContextMenu?: (project: Project, e: React.MouseEvent) => void;
}

// Category header style helper
function getCategoryHeaderStyle(category: ProjectCategory | null) {
    if (!category || !category.colorCode) {
        return { backgroundColor: "#71717a", color: "#fff" };
    }
    return { backgroundColor: category.colorCode, color: "#fff" };
}

// Totals Row Component
interface ProjectsTotalsRowProps {
    columns: ColumnConfig[];
    projects: Project[];
    columnWidths?: Map<string, number>;
}

function ProjectsTotalsRow({ columns, projects, columnWidths }: ProjectsTotalsRowProps) {
    const totals = projects.reduce((acc, project) => {
        acc.allocatedBudget = (acc.allocatedBudget || 0) + (project.totalBudgetAllocated || 0);
        acc.obligatedBudget = (acc.obligatedBudget || 0) + (project.obligatedBudget || 0);
        acc.utilization = (acc.utilization || 0) + (project.totalBudgetUtilized || 0);
        acc.projectCompleted = (acc.projectCompleted || 0) + (project.projectCompleted || 0);
        acc.projectDelayed = (acc.projectDelayed || 0) + (project.projectDelayed || 0);
        acc.projectsOngoing = (acc.projectsOngoing || 0) + (project.projectsOngoing || 0);
        return acc;
    }, { allocatedBudget: 0, obligatedBudget: 0, utilization: 0, projectCompleted: 0, projectDelayed: 0, projectsOngoing: 0 });

    const utilizationRate = totals.allocatedBudget > 0
        ? (totals.utilization / totals.allocatedBudget) * 100
        : 0;

    const getColumnWidth = (column: ColumnConfig) => {
        const key = column.key as string;
        const savedWidth = columnWidths?.get(key);
        return savedWidth ?? column.width ?? 150;
    };

    return (
        <tr className="sticky bottom-0 bg-zinc-50 dark:bg-zinc-800 font-bold z-20 shadow-[0_-1px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_-1px_0_0_rgba(255,255,255,0.1)]">
            <td className="text-center py-2" style={{ border: '2px solid rgb(228 228 231 / 1)', width: '40px' }} />
            <td className="text-center py-2 text-[11px] sm:text-xs text-zinc-700 dark:text-zinc-200" style={{ border: '2px solid rgb(228 228 231 / 1)', width: '40px' }} />
            {columns.map(column => {
                let cellContent = "";
                if (column.key === "totalBudgetAllocated") {
                    cellContent = formatCurrency(totals.allocatedBudget);
                } else if (column.key === "obligatedBudget") {
                    cellContent = formatCurrency(totals.obligatedBudget);
                } else if (column.key === "totalBudgetUtilized") {
                    cellContent = formatCurrency(totals.utilization);
                } else if (column.key === "utilizationRate") {
                    cellContent = formatPercentage(utilizationRate);
                } else if (column.key === "projectCompleted") {
                    cellContent = Math.round(totals.projectCompleted).toString();
                } else if (column.key === "projectDelayed") {
                    cellContent = Math.round(totals.projectDelayed).toString();
                } else if (column.key === "projectsOngoing") {
                    cellContent = Math.round(totals.projectsOngoing).toString();
                } else if (column.key === "particulars") {
                    cellContent = "TOTALS";
                }

                const width = getColumnWidth(column);

                return (
                    <td
                        key={column.key as string}
                        className="px-2 sm:px-3 py-2 text-[11px] sm:text-xs text-zinc-800 dark:text-zinc-200"
                        style={{
                            border: '2px solid rgb(228 228 231 / 1)',
                            textAlign: column.align,
                            width: `${width}px`,
                            minWidth: `${column.minWidth ?? 60}px`,
                            maxWidth: `${column.maxWidth ?? 600}px`,
                        }}
                    >
                        {cellContent}
                    </td>
                );
            })}
            <td className="text-center" style={{ border: '2px solid rgb(228 228 231 / 1)', width: '64px' }} />
        </tr>
    );
}

export function ProjectsTable({
    projects,
    groupedData,
    particularId,
    hiddenColumns,
    onRowClick,
    onEdit,
    onDelete,
    onPin,
    onToggleAutoCalculate,
    onChangeCategory,
    selectedIds,
    onSelectRow,
    onSelectAll,
    onSelectCategory,
    isHighlighted,
    onContextMenu,
}: ProjectsTableProps) {
    const {
        columns: allColumns,
        columnWidths,
        rowHeights,
        canEditLayout,
        startResizeColumn,
        startResizeRow,
        onDragStart,
        onDrop,
        onDragOver,
        containerRef,
    } = useResizableColumns({
        tableIdentifier: `projectsTable_${particularId || 'default'}`,
        defaultColumns: PROJECT_TABLE_COLUMNS
    });

    const visibleColumns = useMemo(() => {
        if (!hiddenColumns) return allColumns;
        return allColumns.filter(col => !hiddenColumns.has(col.key as string));
    }, [allColumns, hiddenColumns]);

    const renderCell = (project: Project, column: ColumnConfig) => {
        switch (column.key) {
            case "particulars":
                return <ProjectNameCell project={project} />;
            case "status":
                return <ProjectStatusCell project={project} />;
            case "totalBudgetAllocated":
                return <ProjectBudgetCell value={project.totalBudgetAllocated} />;
            case "obligatedBudget":
                return <ProjectBudgetCell value={project.obligatedBudget} />;
            case "totalBudgetUtilized":
                return <ProjectBudgetCell value={project.totalBudgetUtilized} />;
            case "utilizationRate":
                return <ProjectBudgetCell value={project.utilizationRate} type="percentage" />;
            case "year":
                return <span className="font-semibold">{project.year}</span>;
            case "remarks":
                return <ProjectRemarksCell remarks={project.remarks} />;
            case "implementingOffice":
                return <span className="truncate block" title={project.implementingOffice}>{project.implementingOffice}</span>;
            default:
                return <span className="truncate block">{(project as any)[column.key] || "-"}</span>;
        }
    };

    const renderActions = (project: Project) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRowClick(project, e as any); }}>
                    <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                    View Details
                </DropdownMenuItem>

                {onPin && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(project); }}>
                        <Pin className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        {project.isPinned ? "Unpin Project" : "Pin Project"}
                    </DropdownMenuItem>
                )}

                {onToggleAutoCalculate && (
                    <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onToggleAutoCalculate(project, !project.autoCalculateBudgetUtilized);
                    }}>
                        <Calculator className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        {project.autoCalculateBudgetUtilized ? "Disable Auto-Calc" : "Enable Auto-Calc"}
                    </DropdownMenuItem>
                )}

                {onChangeCategory && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onChangeCategory(project); }}>
                        <FolderInput className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        Change Category
                    </DropdownMenuItem>
                )}

                {(onEdit || onDelete) && <DropdownMenuSeparator />}

                {onEdit && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
                        <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                        Edit Project
                    </DropdownMenuItem>
                )}

                {onDelete && (
                    <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onDelete(project); }}
                        className="text-red-600 focus:text-red-600"
                    >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Move to Trash
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const isAllSelected = selectedIds && projects.length > 0 && selectedIds.size === projects.length;
    const isIndeterminate = selectedIds && selectedIds.size > 0 && projects.length > 0 && selectedIds.size < projects.length;

    const groups: [string, GroupedProjects][] = groupedData && groupedData.length > 0
        ? groupedData
        : [['default', { category: null, projects }]];

    return (
        <ResizableTableContainer ref={containerRef}>
            <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: 'fit-content', minWidth: '100%' }}>
                <ResizableTableHeader
                    columns={visibleColumns}
                    columnWidths={columnWidths}
                    canEditLayout={canEditLayout}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onStartResize={startResizeColumn}
                    isAllSelected={isAllSelected}
                    isIndeterminate={isIndeterminate}
                    onSelectAll={onSelectAll}
                />
                <tbody>
                    {projects.length === 0 ? (
                        <tr>
                            <td colSpan={visibleColumns.length + 3} className="px-4 py-8 text-center text-zinc-500">
                                No projects found
                            </td>
                        </tr>
                    ) : (
                        groups.map(([categoryId, group]) => {
                            const groupIds = group.projects.map(p => p.id);
                            const groupSelectedCount = groupIds.filter(id => selectedIds?.has(id)).length;
                            const isGroupAllSelected = groupIds.length > 0 && groupSelectedCount === groupIds.length;
                            const isGroupIndeterminate = groupSelectedCount > 0 && !isGroupAllSelected;
                            const headerStyle = getCategoryHeaderStyle(group.category);
                            const showHeader = groupedData && groupedData.length > 0;

                            return (
                                <React.Fragment key={categoryId}>
                                    {showHeader && (
                                        <tr className="bg-zinc-50 dark:bg-zinc-900 border-t-2 border-zinc-100 dark:border-zinc-800">
                                            {onSelectAll && (
                                                <td className="px-2 py-2 text-center border-r border-zinc-200 dark:border-zinc-700" style={headerStyle}>
                                                    <div className="flex justify-center items-center">
                                                        <Checkbox
                                                            checked={isGroupAllSelected}
                                                            onCheckedChange={(checked) => onSelectCategory?.(group.projects, checked as boolean)}
                                                            className={cn(
                                                                "border-white/50 data-[state=checked]:bg-white data-[state=checked]:text-black",
                                                                isGroupIndeterminate ? "opacity-70" : ""
                                                            )}
                                                        />
                                                    </div>
                                                </td>
                                            )}
                                            <td
                                                colSpan={visibleColumns.length + 2}
                                                className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-left border-l-0"
                                                style={headerStyle}
                                            >
                                                {group.category ? group.category.fullName : "Uncategorized"}
                                                <span className="opacity-80 ml-2 font-normal normal-case">
                                                    ({group.projects.length} {group.projects.length === 1 ? 'project' : 'projects'})
                                                </span>
                                            </td>
                                        </tr>
                                    )}
                                    {group.projects.map((project, index) => (
                                        <ResizableTableRow
                                            key={project.id}
                                            data={{ ...project, _id: project.id }}
                                            index={index}
                                            columns={visibleColumns}
                                            columnWidths={columnWidths}
                                            rowHeight={rowHeights[project.id] ?? DEFAULT_ROW_HEIGHT}
                                            canEditLayout={canEditLayout}
                                            renderCell={renderCell}
                                            renderActions={renderActions}
                                            onRowClick={(item, e) => onRowClick(item as unknown as Project, e)}
                                            onContextMenu={onContextMenu ? (item, e) => onContextMenu(item as unknown as Project, e) : undefined}
                                            onStartRowResize={startResizeRow}
                                            isSelected={selectedIds?.has(project.id)}
                                            onSelectRow={onSelectRow}
                                            isHighlighted={isHighlighted?.(project.id)}
                                        />
                                    ))}
                                </React.Fragment>
                            );
                        })
                    )}
                    {projects.length > 0 && (
                        <ProjectsTotalsRow columns={visibleColumns} projects={projects} columnWidths={columnWidths} />
                    )}
                </tbody>
            </table>
        </ResizableTableContainer>
    );
}