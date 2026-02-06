
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/components/features/ppdo/odpp/table-pages/projects/types";

interface ProjectStatusCellProps {
    project: Project;
}

export function ProjectStatusCell({ project }: ProjectStatusCellProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const updateStatus = useMutation(api.projects.updateStatus);

    const handleStatusChange = async (newStatus: "completed" | "ongoing" | "delayed") => {
        setIsUpdating(true);
        try {
            await updateStatus({
                id: project.id as Id<"projects">,
                status: newStatus,
            });
            toast.success("Status updated successfully");
            setIsOpen(false);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        } finally {
            setIsUpdating(false);
        }
    };

    const status = project.status || "ongoing";
    const label = status.charAt(0).toUpperCase() + status.slice(1);

    // Stop propagation to prevent row click
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="flex items-center justify-center h-full" onClick={handleClick}>
            {isUpdating ? (
                <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Updating...</span>
                </div>
            ) : (
                <Select
                    value={status}
                    onValueChange={handleStatusChange}
                    open={isOpen}
                    onOpenChange={(open) => {
                        setIsOpen(open);
                    }}
                    disabled={isUpdating}
                >
                    <SelectTrigger
                        className={cn(
                            "h-7 w-[100px] text-xs border-0 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:ring-0",
                            status === "completed" && "text-green-600 dark:text-green-400 font-medium",
                            status === "delayed" && "text-red-600 dark:text-red-400 font-medium",
                            status === "ongoing" && "text-blue-600 dark:text-blue-400 font-medium",
                        )}
                    >
                        <SelectValue>{label}</SelectValue>
                    </SelectTrigger>
                    <SelectContent align="center">
                        <SelectItem value="ongoing" className="text-xs">Ongoing</SelectItem>
                        <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                        <SelectItem value="delayed" className="text-xs">Delayed</SelectItem>
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}