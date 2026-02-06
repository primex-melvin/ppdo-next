
"use client";

import { Pin } from "lucide-react";
import { Project } from "../../types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

            {/* Category Badge (if we have category info) */}
            {/* Note: In the current type, we only seem to have categoryId. 
          If we need category name, we might need to fetch it or augment the type. 
          For now, just showing the name. */}
        </div>
    );
}
