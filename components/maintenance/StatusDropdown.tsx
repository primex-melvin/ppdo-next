"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CheckCircle2, Clock, AlertCircle, XCircle, ChevronDown } from "lucide-react";
import {
    DropdownMenu as ShadcnDropdownMenu,
    DropdownMenuContent as ShadcnDropdownMenuContent,
    DropdownMenuItem as ShadcnDropdownMenuItem,
    DropdownMenuTrigger as ShadcnDropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

interface StatusDropdownProps {
    itemId: Id<"bugReports"> | Id<"suggestions">;
    itemType: "bug" | "suggestion";
    currentStatus: string;
}

export function StatusDropdown({ itemId, itemType, currentStatus }: StatusDropdownProps) {
    const currentUser = useQuery(api.users.current);
    const isSuperAdmin = currentUser?.role === "super_admin";

    const updateBugStatus = useMutation(api.bugReports.updateStatus);
    const updateSuggestionStatus = useMutation(api.suggestions.updateStatus);

    const handleStatusUpdate = async (newStatus: string) => {
        if (newStatus === currentStatus) return;

        try {
            if (itemType === "bug") {
                await updateBugStatus({
                    id: itemId as Id<"bugReports">,
                    status: newStatus as any,
                });
            } else {
                await updateSuggestionStatus({
                    id: itemId as Id<"suggestions">,
                    status: newStatus as any,
                });
            }
            toast.success(`${itemType === "bug" ? "Bug" : "Suggestion"} status updated to ${newStatus.replace("_", " ")}`);
        } catch (error) {
            toast.error(`Failed to update status: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    };

    const getStatusConfig = (status: string) => {
        if (itemType === "bug") {
            switch (status) {
                case "fixed":
                    return {
                        colorClass: "bg-[#15803D]/10 text-[#15803D] border-[#15803D]/20 hover:bg-[#15803D]/20",
                        icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
                        label: "Fixed",
                    };
                case "not_fixed":
                    return {
                        colorClass: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/30",
                        icon: <AlertCircle className="w-3 h-3 mr-1" />,
                        label: "Not Fixed",
                    };
                default:
                    return {
                        colorClass: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700",
                        icon: <Clock className="w-3 h-3 mr-1" />,
                        label: "Pending",
                    };
            }
        } else {
            switch (status) {
                case "acknowledged":
                    return {
                        colorClass: "bg-[#15803D]/10 text-[#15803D] border-[#15803D]/20 hover:bg-[#15803D]/20",
                        icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
                        label: "Acknowledged",
                    };
                case "to_review":
                    return {
                        colorClass: "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/30",
                        icon: <Clock className="w-3 h-3 mr-1" />,
                        label: "To Review",
                    };
                case "denied":
                    return {
                        colorClass: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30",
                        icon: <XCircle className="w-3 h-3 mr-1" />,
                        label: "Denied",
                    };
                default:
                    return {
                        colorClass: "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700",
                        icon: <Clock className="w-3 h-3 mr-1" />,
                        label: "Pending",
                    };
            }
        }
    };

    const currentConfig = getStatusConfig(currentStatus);
    const possibleStatuses = itemType === "bug"
        ? ["pending", "fixed", "not_fixed"]
        : ["pending", "acknowledged", "to_review", "denied"];

    if (!isSuperAdmin) {
        return (
            <span className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                currentConfig.colorClass
            )}>
                {currentConfig.icon}
                {currentConfig.label}
            </span>
        );
    }

    return (
        <ShadcnDropdownMenu>
            <ShadcnDropdownMenuTrigger asChild>
                <button
                    className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border transition-colors outline-none",
                        currentConfig.colorClass
                    )}
                    onClick={(e) => e.stopPropagation()} // Prevent row click
                >
                    {currentConfig.icon}
                    {currentConfig.label}
                    <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                </button>
            </ShadcnDropdownMenuTrigger>
            <ShadcnDropdownMenuContent align="start" className="w-32">
                {possibleStatuses.map((status) => {
                    const config = getStatusConfig(status);
                    return (
                        <ShadcnDropdownMenuItem
                            key={status}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(status);
                            }}
                            className="text-xs flex items-center gap-2 cursor-pointer"
                        >
                            <div className={cn("w-2 h-2 rounded-full", status === currentStatus ? "bg-primary" : "bg-transparent border border-muted-foreground")} />
                            {config.label}
                        </ShadcnDropdownMenuItem>
                    );
                })}
            </ShadcnDropdownMenuContent>
        </ShadcnDropdownMenu>
    );
}
