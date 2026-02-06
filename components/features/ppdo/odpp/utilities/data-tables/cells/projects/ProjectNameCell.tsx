
"use client";

import { Pin } from "lucide-react";
import type { Project } from "@/components/features/ppdo/odpp/table-pages/projects/types";

interface ProjectNameCellProps {
    project: Project;
}

export function ProjectNameCell({ project }: ProjectNameCellProps) {
    return (
        <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
                {project.isPinned && (
                    <Pin className="h-3 w-3 flex-shrink-0 text-blue-500 fill-blue-500" />
                )}
                <span className="font-medium truncate" title={project.particulars}>
                    {project.particulars}
                </span>
            </div>
        </div>
    );
}