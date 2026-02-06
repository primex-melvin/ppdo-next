"use client";

import { useMemo, useCallback } from "react";
import { TwentyPercentDF } from "../types";
import { formatCurrency, createTwentyPercentDFSlug } from "../utils";
import { KanbanBoard, KanbanCardData, KanbanCardProps } from "../../../utilities/shared/kanban";

interface TwentyPercentDFKanbanProps {
    data: TwentyPercentDF[];
    isAdmin: boolean;
    onViewLog: (item: TwentyPercentDF) => void;
    onEdit?: (item: TwentyPercentDF) => void;
    onDelete?: (item: TwentyPercentDF) => void;
    onPin: (item: TwentyPercentDF) => void;
    visibleStatuses?: Set<string>;
    visibleFields?: Set<string>;
    year: number;
    onStatusChange?: (itemId: string, newStatus: string) => void;
}

// Columns for 20% DF Kanban - maps to actual status values in database
const COLUMNS = [
    { title: "Delayed", id: "delayed", color: "bg-red-500" },
    { title: "Ongoing", id: "ongoing", color: "bg-blue-500" },
    { title: "Completed", id: "completed", color: "bg-green-500" },
];

// Valid statuses in the database
type ValidStatus = "completed" | "ongoing" | "delayed";

export function TwentyPercentDFKanban({
    data,
    isAdmin,
    onViewLog,
    onEdit,
    onDelete,
    onPin,
    visibleStatuses,
    visibleFields,
    year,
    onStatusChange,
}: TwentyPercentDFKanbanProps) {

    // Transform TwentyPercentDF items to KanbanCardData
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

            const slug = createTwentyPercentDFSlug(item.particulars, item.id);
            const navigationUrl = `/dashboard/20_percent_df/${year}/${slug}?view=kanban`;

            // Create generic card data
            const cardData: KanbanCardData = {
                id: item.id || "",
                title: item.particulars,
                subtitle: item.implementingOffice,
                metrics: metrics,
                utilizationRate: fields.has("utilizationRate") ? utilizationRate : undefined,
                footerLeft: item.year ? `FY ${item.year}` : "",
                footerRight: fields.has("remarks") ? item.remarks : undefined,
                isPinned: item.isPinned,
                navigationUrl: navigationUrl,
            };

            cols[targetCol].push(cardData);
        });

        return cols;
    }, [data, visibleFields, year]);

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
