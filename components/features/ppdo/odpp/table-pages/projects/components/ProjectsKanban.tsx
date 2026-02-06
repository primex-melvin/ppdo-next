"use client";

import { useMemo, useCallback } from "react";
import { Project } from "../types";
import { formatCurrency } from "@/lib/shared/utils/formatting";
import { KanbanBoard, KanbanCardData, KanbanCardProps } from "../../../utilities/shared/kanban";

interface ProjectsKanbanProps {
    data: Project[];
    isAdmin: boolean;
    onViewLog: (item: Project) => void;
    onEdit?: (item: Project) => void;
    onDelete?: (item: Project) => void;
    onPin: (item: Project) => void;
    visibleStatuses?: Set<string>;
    visibleFields?: Set<string>;
    onStatusChange?: (itemId: string, newStatus: string) => void;
}

// Columns for Projects Kanban - maps to actual status values
const COLUMNS = [
    { title: "Delayed", id: "delayed", color: "bg-red-500" },
    { title: "Ongoing", id: "ongoing", color: "bg-blue-500" },
    { title: "Completed", id: "completed", color: "bg-green-500" },
];

// Valid statuses in the database
type ValidStatus = "completed" | "ongoing" | "delayed";

export function ProjectsKanban({
    data,
    isAdmin,
    onViewLog,
    onEdit,
    onDelete,
    onPin,
    visibleStatuses,
    visibleFields,
    onStatusChange,
}: ProjectsKanbanProps) {

    // Transform Project items to KanbanCardData
    const groupedData = useMemo(() => {
        const cols: Record<string, KanbanCardData[]> = {
            delayed: [],
            ongoing: [],
            completed: [],
        };

        data.forEach((item) => {
            // Default to "ongoing" if no status
            const status: ValidStatus = item.status || "ongoing";

            // Ensure status is valid for our columns
            const targetCol = cols[status] ? status : "ongoing";

            // Calculate utilization safely
            const utilizationRate = item.utilizationRate ??
                (item.totalBudgetAllocated > 0 ? (item.totalBudgetUtilized / item.totalBudgetAllocated) * 100 : 0);

            // Construct dynamic metrics based on visibleFields
            const metrics = [];
            const fields = visibleFields || new Set(["totalBudgetAllocated", "totalBudgetUtilized", "balance"]);

            if (fields.has("totalBudgetAllocated")) {
                metrics.push({ label: "Allocated", value: formatCurrency(item.totalBudgetAllocated) });
            }
            if (fields.has("obligatedBudget")) {
                metrics.push({ label: "Obligated", value: formatCurrency(item.obligatedBudget || 0) });
            }
            if (fields.has("totalBudgetUtilized")) {
                metrics.push({ label: "Utilized", value: formatCurrency(item.totalBudgetUtilized) });
            }
            if (fields.has("balance")) {
                const balance = item.totalBudgetAllocated - item.totalBudgetUtilized;
                metrics.push({ label: "Balance", value: formatCurrency(balance) });
            }

            // Format target date if available
            const targetDate = item.targetDateCompletion
                ? new Date(item.targetDateCompletion).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                })
                : null;

            // Create generic card data
            const cardData: KanbanCardData = {
                id: item.id || "",
                title: item.particulars,
                subtitle: item.implementingOffice,
                metrics: metrics,
                utilizationRate: fields.has("utilizationRate") ? utilizationRate : undefined,
                footerLeft: targetDate ? `Target: ${targetDate}` : undefined,
                footerRight: item.remarks ? `${item.remarks.slice(0, 30)}${item.remarks.length > 30 ? "..." : ""}` : undefined,
                isPinned: item.isPinned,
            };

            cols[targetCol].push(cardData);
        });

        return cols;
    }, [data, visibleFields]);

    // Create action handlers factory
    const renderCardActions = useCallback((cardData: KanbanCardData): KanbanCardProps["actions"] => {
        const originalItem = data.find(d => d.id === cardData.id);

        if (!originalItem) return {};

        return {
            onView: () => onViewLog(originalItem),
            onEdit: onEdit ? () => onEdit(originalItem) : undefined,
            onDelete: onDelete ? () => onDelete(originalItem) : undefined,
            onPin: () => onPin(originalItem),
        };
    }, [data, onViewLog, onEdit, onDelete, onPin]);

    const handleStatusChange = (itemId: string, newStatus: string) => {
        if (onStatusChange) {
            onStatusChange(itemId, newStatus);
        }
    };

    return (
        <KanbanBoard
            columns={COLUMNS}
            data={groupedData}
            onStatusChange={handleStatusChange}
            renderCardActions={renderCardActions}
            visibleStatuses={visibleStatuses}
        />
    );
}
