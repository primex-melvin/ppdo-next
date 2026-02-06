import { useMemo } from "react";
import {
    ResizableTableContainer,
    ResizableTableHeader,
    ResizableTableRow,
    useResizableColumns,
    useTableSelection,
    ColumnConfig,
} from "@/components/ppdo/shared/table";
import { PROJECT_TABLE_COLUMNS } from "../constants/projectsTableColumns";
import { Project } from "../types";
import { ProjectsTotalsRow } from "./ProjectsTotalsRow";
import { ProjectNameCell, StatusCell, BudgetCell, RemarksCell } from "./cells";
import { Edit, Trash2, Pin, Eye, MoreHorizontal, Calculator, FolderInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_ROW_HEIGHT } from "@/components/ppdo/shared/table/constants/table.constants";

interface ProjectsResizableTableProps {
    projects: Project[];
    particularId: string;
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
}

export function ProjectsResizableTable({
    projects,
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
}: ProjectsResizableTableProps) {

    // Use shared resizable columns hook
    const {
        columns: allColumns,
        rowHeights,
        canEditLayout,
        startResizeColumn,
        startResizeRow,
        onDragStart,
        onDrop,
        onDragOver
    } = useResizableColumns({
        tableIdentifier: `projectsTable_${particularId || 'default'}`,
        defaultColumns: PROJECT_TABLE_COLUMNS
    });

    // Filter columns based on hiddenColumns
    const visibleColumns = useMemo(() => {
        if (!hiddenColumns) return allColumns;
        return allColumns.filter(col => !hiddenColumns.has(col.key as string));
    }, [allColumns, hiddenColumns]);

    // Cell renderer
    const renderCell = (project: Project, column: ColumnConfig) => {
        switch (column.key) {
            case "particulars":
                return <ProjectNameCell project={project} />;
            case "status":
                return <StatusCell project={project} />;
            case "totalBudgetAllocated":
                return <BudgetCell value={project.totalBudgetAllocated} />;
            case "obligatedBudget":
                return <BudgetCell value={project.obligatedBudget} />;
            case "totalBudgetUtilized":
                return <BudgetCell value={project.totalBudgetUtilized} />;
            case "utilizationRate":
                return <BudgetCell value={project.utilizationRate} type="percentage" />;
            case "year":
                return <span className="font-semibold">{project.year}</span>;
            case "remarks":
                return <RemarksCell remarks={project.remarks} />;
            case "implementingOffice":
                return <span className="truncate block" title={project.implementingOffice}>{project.implementingOffice}</span>;
            default:
                // Generic fallback
                return <span className="truncate block">{(project as any)[column.key] || "-"}</span>;
        }
    };

    // Actions renderer
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

    return (
        <ResizableTableContainer>
            <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <ResizableTableHeader
                    columns={visibleColumns}
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
                    {projects.map((project, index) => (
                        <ResizableTableRow
                            key={project.id}
                            data={{ ...project, _id: project.id }} // Adapter for _id vs id
                            index={index}
                            columns={visibleColumns}
                            rowHeight={rowHeights[project.id] ?? DEFAULT_ROW_HEIGHT}
                            canEditLayout={canEditLayout}
                            renderCell={renderCell}
                            renderActions={renderActions}
                            onRowClick={(item, e) => onRowClick(item as unknown as Project, e)}
                            onStartRowResize={startResizeRow}
                            isSelected={selectedIds?.has(project.id)}
                            onSelectRow={onSelectRow}
                        />
                    ))}
                    {projects.length > 0 && (
                        <ProjectsTotalsRow columns={visibleColumns} projects={projects} />
                    )}
                </tbody>
            </table>
        </ResizableTableContainer>
    );
}
